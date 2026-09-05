import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import CmsUserForm, {
  EMPTY_CMS_USER_FORM,
  parsePageIdsInput,
  userToForm,
} from './CmsUserForm';
import {
  createCmsUser,
  deleteCmsUser,
  generateCmsUserInvitation,
  listCmsUsersRemote,
  updateCmsUser,
  approveCmsAccess,
  rejectCmsAccess,
} from '../utils/userFunctions';
import { canManageUsers, getRoleLabel, ROLES } from '../utils/permissions';
import {
  formatAssignedPages,
  formatPageCount,
  formatSubscriptionLabel,
  pageIdsFromCmsUser,
} from '../utils/cmsUserDisplay';
import {
  buildUserInvitationMessage,
  buildUserInvitationUrl,
  describeTransactionalEmailFailure,
  INVITATION_CHANNELS,
} from '../utils/userInvitation';
import { listPageDocuments } from '../utils/firestoreAccess';
import { saveUserProfile, setUserIsDemo } from '../utils/userAccess';

function PasswordStatusBadge({ status }) {
  if (status === 'confirmed') {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
        Confirmado
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
        Sin contraseña
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-500 border border-gray-200">
      —
    </span>
  );
}

function ApprovalStatusBadge({ status }) {
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
        Pendiente aprobación
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200">
        Rechazado
      </span>
    );
  }
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
        Aprobado
      </span>
    );
  }
  return null;
}

export default function UsersAdminPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [pageOptions, setPageOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyUid, setBusyUid] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(EMPTY_CMS_USER_FORM);
  const [editingUid, setEditingUid] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [invitationStatus, setInvitationStatus] = useState('');
  const [resendDraft, setResendDraft] = useState(null);
  const [resendBusy, setResendBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [approveDraft, setApproveDraft] = useState(null);
  const [approveBusy, setApproveBusy] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const [list, pages] = await Promise.all([
        listCmsUsersRemote(),
        listPageDocuments(db).catch(() => []),
      ]);
      setUsers(list);
      setPageOptions(pages.map((page) => ({ id: page.id, name: page.name || page.id })));
    } catch (loadError) {
      console.error(loadError);
      setError(loadError.message || 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canManageUsers(profile)) return;
    loadUsers();
  }, [profile]);

  const pendingCount = useMemo(
    () => users.filter((user) => user.approvalStatus === 'pending').length,
    [users],
  );

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      if (statusFilter === 'pending' && user.approvalStatus !== 'pending') return false;
      if (statusFilter === 'approved' && user.approvalStatus !== 'approved') return false;
      if (statusFilter === 'rejected' && user.approvalStatus !== 'rejected') return false;
      if (!q) return true;
      const haystack = [
        user.email,
        user.displayName,
        user.phone,
        user.role,
        user.plan,
        user.subscriptionLabel,
        user.approvalStatus,
        user.isDemo ? 'demo' : '',
        user.disabled ? 'bloqueado' : '',
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [users, query, statusFilter]);

  if (!canManageUsers(profile)) {
    return <Navigate to="/app" replace />;
  }

  const resetForm = () => {
    setForm(EMPTY_CMS_USER_FORM);
    setEditingUid(null);
    setShowForm(false);
  };

  const handleEdit = (user) => {
    setEditingUid(user.uid);
    setForm(userToForm(user));
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        email: form.email,
        displayName: form.displayName,
        role: form.role,
        assignedPageIds: parsePageIdsInput(form.assignedPageIds),
        pageId: form.pageId,
        isDemo: form.isDemo === true,
      };

      if (editingUid) {
        await saveUserProfile(db, editingUid, payload);
      } else {
        if (
          form.invitationChannel === INVITATION_CHANNELS.WHATSAPP
          && !String(form.whatsappPhone ?? '').replace(/\D/g, '')
        ) {
          throw new Error('Ingresa un teléfono de WhatsApp.');
        }
        const result = await createCmsUser({
          ...payload,
          createInvitation: form.invitationChannel !== INVITATION_CHANNELS.NONE,
        });
        if (result.invitationLink) {
          setInvitation({
            uid: result.uid,
            email: result.email,
            displayName: payload.displayName,
            invitationLink: result.invitationLink,
            channel: form.invitationChannel,
            phone: form.whatsappPhone,
            phoneCountry: form.whatsappPhoneCountry || 'mx',
            emailSent: result.invitationEmailSent === true,
          });
          setInvitationStatus(
            result.invitationEmailSent === true && form.invitationChannel === INVITATION_CHANNELS.EMAIL
              ? 'Email enviado automáticamente.'
              : '',
          );
          if (
            result.invitationEmailSent !== true
            && form.invitationChannel === INVITATION_CHANNELS.EMAIL
          ) {
            setError(
              'Usuario creado, pero no se pudo enviar el email automático. '
                + describeTransactionalEmailFailure(result),
            );
          }
        } else if (result.invitationError) {
          setError(
            `Usuario creado, pero no se generó la invitación: ${result.invitationError} `
              + 'Usa “Invitar” en la tabla para reintentar.',
          );
        }
      }
      await loadUsers();
      resetForm();
    } catch (saveError) {
      setError(saveError.message || 'No se pudo guardar el usuario.');
    } finally {
      setSaving(false);
    }
  };

  const runUserAction = async (uid, action) => {
    setBusyUid(uid);
    setError('');
    try {
      await action();
      await loadUsers();
    } catch (actionError) {
      console.error(actionError);
      setError(actionError.message || 'No se pudo completar la acción.');
    } finally {
      setBusyUid('');
    }
  };

  const handleToggleDemo = (user) => {
    if (user.role === ROLES.ROOT) {
      setError('No se puede marcar como demo a un usuario root.');
      return;
    }
    runUserAction(user.uid, () => setUserIsDemo(db, user.uid, !user.isDemo));
  };

  const handleToggleBlock = (user) => {
    if (user.role === ROLES.ROOT) {
      setError('No se puede bloquear a un usuario root.');
      return;
    }
    runUserAction(user.uid, () => updateCmsUser({ uid: user.uid, disabled: !user.disabled }));
  };

  const handleDelete = (user) => {
    if (user.role === ROLES.ROOT) {
      setError('No se puede eliminar a un usuario root.');
      return;
    }
    if (!window.confirm(`¿Eliminar a ${user.email}? Se borrará el perfil y la cuenta de Authentication.`)) {
      return;
    }
    runUserAction(user.uid, () => deleteCmsUser(user.uid));
  };

  const handlePrepareInvitation = (user) => {
    setError('');
    setInvitationStatus('');
    setInvitation(null);
    setResendDraft({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      channel: INVITATION_CHANNELS.EMAIL,
      phone: user.phone || '',
    });
  };

  const openApprove = (user) => {
    setError('');
    setApproveDraft({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      phone: user.phone || '',
      role: ROLES.USER,
      pageId: '',
      assignedPageIds: '',
    });
  };

  const handleApprove = async (event) => {
    event.preventDefault();
    if (!approveDraft?.uid) return;
    setApproveBusy(true);
    setError('');
    try {
      const result = await approveCmsAccess({
        uid: approveDraft.uid,
        displayName: approveDraft.displayName,
        role: approveDraft.role,
        pageId: approveDraft.pageId,
        assignedPageIds: parsePageIdsInput(approveDraft.assignedPageIds),
      });
      setApproveDraft(null);
      await loadUsers();
      if (result?.emailSent === false) {
        setError(
          'Usuario aprobado, pero no se pudo enviar el email automático. '
            + describeTransactionalEmailFailure(result),
        );
      }
    } catch (approveError) {
      setError(approveError.message || 'No se pudo aprobar el acceso.');
    } finally {
      setApproveBusy(false);
    }
  };

  const handleReject = (user) => {
    if (!window.confirm(`¿Rechazar la solicitud de ${user.email}? La cuenta se bloquea (soft).`)) {
      return;
    }
    runUserAction(user.uid, () => rejectCmsAccess(user.uid));
  };

  const handleConfirmResend = async () => {
    if (!resendDraft?.uid) return;
    setResendBusy(true);
    setError('');
    try {
      if (
        resendDraft.channel === INVITATION_CHANNELS.WHATSAPP
        && !String(resendDraft.phone ?? '').replace(/\D/g, '')
      ) {
        throw new Error('Ingresa un teléfono de WhatsApp con código de país.');
      }
      const result = await generateCmsUserInvitation(resendDraft.uid);
      setInvitation({
        ...result,
        displayName: result.displayName || resendDraft.displayName || '',
        channel: resendDraft.channel,
        phone: resendDraft.phone,
        emailSent: result.emailSent === true,
      });
      setResendDraft(null);
      if (result?.emailSent === true && resendDraft.channel === INVITATION_CHANNELS.EMAIL) {
        setInvitationStatus('Email enviado automáticamente.');
      } else if (result?.emailSent === false) {
        setError(
          'Enlace generado, pero no se pudo enviar el email automático. '
            + describeTransactionalEmailFailure(result),
        );
      }
    } catch (invitationError) {
      setError(invitationError.message || 'No se pudo preparar la invitación.');
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-[#F4F1EA] text-[#2A342D] overflow-hidden">
      <header className="shrink-0 border-b border-[#2A342D]/10 bg-white/90 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Root</p>
            <h1 className="text-lg font-serif font-semibold">Usuarios del CMS</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingUid(null);
                setForm(EMPTY_CMS_USER_FORM);
                setShowForm(true);
              }}
              className="rounded-lg bg-[#4A5D4E] px-3 py-2 text-xs font-semibold text-white hover:bg-[#3d4d41]"
            >
              + Nuevo
            </button>
            <Link
              to="/app/pages"
              className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Volver a páginas
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Buscar</label>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Email, teléfono, plan, demo, bloqueado…"
                className="w-full rounded-lg border bg-white px-3 py-2 text-xs"
              />
            </div>
            <div className="flex flex-wrap gap-1 pb-0.5">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'pending', label: `Pendientes${pendingCount ? ` (${pendingCount})` : ''}` },
                { id: 'approved', label: 'Aprobados' },
                { id: 'rejected', label: 'Rechazados' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`rounded-lg px-3 py-2 text-[11px] font-semibold border ${
                    statusFilter === tab.id
                      ? 'bg-[#4A5D4E] text-white border-[#4A5D4E]'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 pb-2">
              {filteredUsers.length} de {users.length} usuarios
            </p>
          </div>

          {error && !showForm && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="overflow-x-auto rounded-xl border border-[#2A342D]/10 bg-white shadow-sm">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500 sticky top-0">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Usuario</th>
                  <th className="px-3 py-2.5 font-semibold">Rol</th>
                  <th className="px-3 py-2.5 font-semibold">Páginas</th>
                  <th className="px-3 py-2.5 font-semibold">Suscripción</th>
                  <th className="px-3 py-2.5 font-semibold">Estado</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-gray-400">Cargando…</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-gray-400">Sin resultados</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const busy = busyUid === user.uid;
                    const isRootUser = user.role === ROLES.ROOT;
                    return (
                      <tr key={user.uid} className={`border-t border-gray-100 ${user.disabled ? 'bg-rose-50/40' : ''} ${user.approvalStatus === 'pending' ? 'bg-amber-50/30' : ''}`}>
                        <td className="px-3 py-3 align-top">
                          <p className="font-semibold text-gray-900">{user.email || user.uid}</p>
                          {user.displayName ? (
                            <p className="text-gray-500 mt-0.5">{user.displayName}</p>
                          ) : null}
                          {user.phone ? (
                            <p className="text-[10px] text-gray-500 mt-0.5 tabular-nums">{user.phone}</p>
                          ) : null}
                          <p className="text-[10px] text-gray-400 font-mono mt-1">{user.uid}</p>
                        </td>
                        <td className="px-3 py-3 align-top">{user.role ? getRoleLabel(user.role) : '—'}</td>
                        <td className="px-3 py-3 align-top">
                          <p className="tabular-nums font-medium">{formatPageCount(user)}</p>
                          <p
                            className="text-[10px] text-gray-500 mt-0.5 max-w-[14rem] break-all"
                            title={pageIdsFromCmsUser(user).join(', ') || formatAssignedPages(user)}
                          >
                            {formatAssignedPages(user)}
                          </p>
                        </td>
                        <td className="px-3 py-3 align-top capitalize">{formatSubscriptionLabel(user)}</td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex flex-wrap gap-1">
                            <ApprovalStatusBadge status={user.approvalStatus} />
                            <PasswordStatusBadge status={user.passwordStatus} />
                            {user.isDemo && (
                              <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 border border-violet-200">
                                Demo
                              </span>
                            )}
                            {user.disabled && (
                              <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200">
                                Bloqueado
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex flex-wrap justify-end gap-1">
                            {user.approvalStatus === 'pending' ? (
                              <>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => openApprove(user)}
                                  className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                                >
                                  Aprobar
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleReject(user)}
                                  className="px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                                >
                                  Rechazar
                                </button>
                              </>
                            ) : null}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleEdit(user)}
                              className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                            >
                              Editar
                            </button>
                            {!isRootUser && user.approvalStatus === 'approved' && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleToggleDemo(user)}
                                className="px-2 py-1 rounded bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:opacity-50"
                              >
                                {user.isDemo ? 'Quitar demo' : 'Marcar demo'}
                              </button>
                            )}
                            {!isRootUser && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleToggleBlock(user)}
                                className="px-2 py-1 rounded bg-amber-50 text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                              >
                                {user.disabled ? 'Desbloquear' : 'Bloquear'}
                              </button>
                            )}
                            {user.approvalStatus === 'approved' && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handlePrepareInvitation(user)}
                                className="px-2 py-1 rounded bg-sky-50 text-sky-700 hover:bg-sky-100 disabled:opacity-50"
                              >
                                Invitar
                              </button>
                            )}
                            {!isRootUser && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleDelete(user)}
                                className="px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                              >
                                Borrar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showForm && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/45">
          <button
            type="button"
            aria-label="Cerrar panel"
            className="flex-1 min-w-0 cursor-default"
            onClick={resetForm}
          />
          <aside className="h-full w-full max-w-xl min-h-0 shadow-2xl border-l border-gray-200 bg-white flex flex-col">
            <CmsUserForm
              form={form}
              setForm={setForm}
              editingUid={editingUid}
              pageOptions={pageOptions}
              saving={saving}
              error={error}
              onSubmit={handleSubmit}
              onCancel={resetForm}
              variant="panel"
            />
          </aside>
        </div>
      )}

      {approveDraft && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
          <form
            onSubmit={handleApprove}
            className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-2xl p-5 space-y-4"
          >
            <div>
              <h3 className="text-base font-bold text-gray-900">Aprobar acceso</h3>
              <p className="mt-1 text-xs text-gray-500">{approveDraft.email}</p>
              {approveDraft.phone ? (
                <p className="text-[11px] text-gray-500 tabular-nums">{approveDraft.phone}</p>
              ) : null}
              <p className="mt-2 text-[11px] text-gray-500 leading-relaxed">
                Asigna rol y páginas. Se enviará un email automático de aprobación.
              </p>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Nombre</label>
              <input
                type="text"
                value={approveDraft.displayName}
                onChange={(event) => setApproveDraft({ ...approveDraft, displayName: event.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Rol</label>
              <select
                value={approveDraft.role}
                onChange={(event) => setApproveDraft({ ...approveDraft, role: event.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-xs bg-white"
              >
                <option value={ROLES.USER}>Usuario</option>
                <option value={ROLES.ADMIN}>Admin</option>
              </select>
            </div>
            {approveDraft.role === ROLES.USER ? (
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Página</label>
                <select
                  required
                  value={approveDraft.pageId}
                  onChange={(event) => setApproveDraft({ ...approveDraft, pageId: event.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-xs bg-white"
                >
                  <option value="">Selecciona…</option>
                  {pageOptions.map((page) => (
                    <option key={page.id} value={page.id}>{page.name || page.id}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Páginas (una por línea)</label>
                <textarea
                  required
                  rows={3}
                  value={approveDraft.assignedPageIds}
                  onChange={(event) => setApproveDraft({ ...approveDraft, assignedPageIds: event.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-xs font-mono"
                  placeholder={pageOptions.map((p) => p.id).slice(0, 3).join('\n')}
                />
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={approveBusy}
                className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {approveBusy ? 'Aprobando…' : 'Aprobar y notificar'}
              </button>
              <button
                type="button"
                onClick={() => setApproveDraft(null)}
                className="rounded-lg border px-3 py-2 text-xs"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {resendDraft && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-2xl p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Reenviar invitación</h3>
              <p className="mt-1 text-xs text-gray-500">{resendDraft.email}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setResendDraft({ ...resendDraft, channel: INVITATION_CHANNELS.EMAIL })}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                  resendDraft.channel === INVITATION_CHANNELS.EMAIL
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                Correo
              </button>
              <button
                type="button"
                onClick={() => setResendDraft({ ...resendDraft, channel: INVITATION_CHANNELS.WHATSAPP })}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                  resendDraft.channel === INVITATION_CHANNELS.WHATSAPP
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                WhatsApp
              </button>
            </div>
            {resendDraft.channel === INVITATION_CHANNELS.WHATSAPP && (
              <input
                type="tel"
                value={resendDraft.phone}
                onChange={(event) => setResendDraft({ ...resendDraft, phone: event.target.value })}
                placeholder="5215512345678"
                className="w-full rounded-lg border px-3 py-2 text-xs"
              />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmResend}
                disabled={resendBusy}
                className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {resendBusy ? 'Generando…' : 'Generar enlace'}
              </button>
              <button
                type="button"
                onClick={() => setResendDraft(null)}
                className="rounded-lg border px-3 py-2 text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {invitation && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Invitación lista</h3>
            <p className="text-xs text-gray-500">{invitation.email}</p>
            <div className="rounded-lg bg-gray-50 border p-3 text-xs text-gray-600">
              {buildUserInvitationMessage(invitation)}
            </div>
            {invitationStatus && (
              <p className="rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700">{invitationStatus}</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const url = buildUserInvitationUrl(invitation);
                  if (invitation.channel === INVITATION_CHANNELS.EMAIL) window.location.href = url;
                  else window.open(url, '_blank', 'noopener,noreferrer');
                  setInvitationStatus('Canal abierto.');
                }}
                className="rounded-lg bg-[#4A5D4E] px-3 py-2 text-xs font-semibold text-white"
              >
                Abrir canal
              </button>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(invitation.invitationLink);
                  setInvitationStatus('Enlace copiado.');
                }}
                className="rounded-lg border px-3 py-2 text-xs font-semibold"
              >
                Copiar enlace
              </button>
              <button
                type="button"
                onClick={() => setInvitation(null)}
                className="col-span-2 rounded-lg border px-3 py-2 text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
