import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import CmsUserForm, {
  EMPTY_CMS_USER_FORM,
  parsePageIdsInput,
  userToForm,
} from './CmsUserForm';
import {
  createCmsUser,
  listCmsUsersRemote,
} from '../utils/userFunctions';
import { saveUserProfile } from '../utils/userAccess';
import {
  formatAssignedPages,
  formatPageCount,
  formatSubscriptionLabel,
  USERS_MODAL_PAGE_SIZE,
} from '../utils/cmsUserDisplay';
import {
  buildUserInvitationMessage,
  buildUserInvitationUrl,
  INVITATION_CHANNELS,
} from '../utils/userInvitation';

export default function UserManagement({ pageOptions = [], onClose }) {
  const [users, setUsers] = useState([]);
  const [visibleCount, setVisibleCount] = useState(USERS_MODAL_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_CMS_USER_FORM);
  const [editingUid, setEditingUid] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [invitationStatus, setInvitationStatus] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await listCmsUsersRemote();
      setUsers(list);
      setVisibleCount(USERS_MODAL_PAGE_SIZE);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError.message || 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_CMS_USER_FORM);
    setEditingUid(null);
  };

  const handleEdit = (user) => {
    setEditingUid(user.uid);
    setForm(userToForm(user));
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
        } else if (result.invitationError) {
          setError(
            `Usuario creado, pero no se generó la invitación: ${result.invitationError} `
              + 'Puedes reenviar la invitación desde la lista.',
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

  const handleOpenInvitation = () => {
    try {
      const url = buildUserInvitationUrl(invitation);
      if (invitation.channel === INVITATION_CHANNELS.EMAIL) {
        window.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      setInvitationStatus('Canal abierto. Confirma el envío en la aplicación.');
    } catch (openError) {
      setInvitationStatus(openError.message);
    }
  };

  const handleCopyInvitation = async (value, confirmation) => {
    try {
      await navigator.clipboard.writeText(value);
      setInvitationStatus(confirmation);
    } catch {
      setInvitationStatus('No se pudo copiar al portapapeles.');
    }
  };

  const visibleUsers = users.slice(0, visibleCount);
  const hasMore = visibleCount < users.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[85vh] overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col">
        <div className="px-5 py-3 border-b flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-900">Usuarios</h2>
            <p className="text-[11px] text-gray-500 truncate">
              Últimos registros · info básica. Detalle completo en el listado.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/app/users"
              onClick={onClose}
              className="text-[11px] font-semibold text-indigo-600 hover:underline px-2 py-1"
            >
              Ver listado →
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 grid lg:grid-cols-2 gap-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-800">Recientes</h3>
              <span className="text-[10px] text-gray-400">
                {users.length ? `${Math.min(visibleCount, users.length)} / ${users.length}` : '0'}
              </span>
            </div>

            {loading ? (
              <p className="text-xs text-gray-400">Cargando...</p>
            ) : users.length === 0 ? (
              <p className="text-xs text-gray-400">No hay perfiles de acceso todavía.</p>
            ) : (
              <div className="space-y-2">
                {visibleUsers.map((user) => (
                  <div
                    key={user.uid}
                    className={`border rounded-lg p-3 text-xs ${user.disabled ? 'opacity-60 bg-gray-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-semibold text-gray-900 truncate">{user.email || user.uid}</p>
                          {user.isDemo && (
                            <span className="inline-flex rounded-full bg-violet-50 px-1.5 py-0.5 text-[9px] font-semibold text-violet-700 border border-violet-200">
                              Demo
                            </span>
                          )}
                          {user.disabled && (
                            <span className="inline-flex rounded-full bg-rose-50 px-1.5 py-0.5 text-[9px] font-semibold text-rose-700 border border-rose-200">
                              Bloqueado
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 mt-1">
                          {formatPageCount(user)} página{formatPageCount(user) === 1 ? '' : 's'}
                          {' · '}
                          {formatAssignedPages(user)}
                          {' · '}
                          {formatSubscriptionLabel(user)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEdit(user)}
                        className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shrink-0"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {hasMore && (
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + USERS_MODAL_PAGE_SIZE)}
                className="w-full rounded-lg border border-dashed border-indigo-300 px-3 py-2 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50"
              >
                Cargar más
              </button>
            )}

            <Link
              to="/app/users"
              onClick={onClose}
              className="block text-center text-[11px] font-semibold text-gray-600 hover:text-indigo-600"
            >
              Abrir tabla completa (editar / bloquear / demo)
            </Link>
          </div>

          <CmsUserForm
            form={form}
            setForm={setForm}
            editingUid={editingUid}
            pageOptions={pageOptions}
            saving={saving}
            error={error}
            onSubmit={handleSubmit}
            onCancel={resetForm}
          />
        </div>
      </div>

      {invitation && (
        <div className="fixed inset-0 z-[60] bg-black/55 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-2xl p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Invitación lista</h3>
              <p className="mt-1 text-xs text-gray-500">
                Usuario: <span className="font-semibold text-gray-700">{invitation.email}</span>
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-xs leading-relaxed text-gray-600">
              {buildUserInvitationMessage(invitation)}
            </div>

            {invitationStatus && (
              <p className="rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                {invitationStatus}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleOpenInvitation}
                className="rounded-lg bg-[#4A5D4E] px-3 py-2 text-xs font-semibold text-white"
              >
                {invitation.channel === INVITATION_CHANNELS.WHATSAPP ? 'Abrir WhatsApp' : 'Abrir correo'}
              </button>
              <button
                type="button"
                onClick={() => handleCopyInvitation(buildUserInvitationMessage(invitation), 'Mensaje copiado.')}
                className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Copiar mensaje
              </button>
              <button
                type="button"
                onClick={() => handleCopyInvitation(invitation.invitationLink, 'Enlace copiado.')}
                className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Copiar enlace
              </button>
              <button
                type="button"
                onClick={() => setInvitation(null)}
                className="rounded-lg border bg-white px-3 py-2 text-xs text-gray-500 hover:bg-gray-50"
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
