import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { ROLES, getRoleLabel } from '../utils/permissions';
import {
  listUserProfiles,
  saveUserProfile,
} from '../utils/userAccess';
import {
  createCmsUser,
  deleteCmsUser,
  generateCmsUserInvitation,
} from '../utils/userFunctions';
import {
  buildUserInvitationMessage,
  buildUserInvitationUrl,
  INVITATION_CHANNELS,
} from '../utils/userInvitation';

const EMPTY_FORM = {
  email: '',
  displayName: '',
  role: ROLES.USER,
  assignedPageIds: '',
  pageId: '',
  invitationChannel: INVITATION_CHANNELS.EMAIL,
  whatsappPhone: '',
};

function parsePageIdsInput(value) {
  return String(value ?? '')
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function UserManagement({ pageOptions = [], onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingUid, setEditingUid] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [invitationStatus, setInvitationStatus] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await listUserProfiles(db);
      setUsers(list);
    } catch (loadError) {
      console.error(loadError);
      setError('No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingUid(null);
  };

  const handleEdit = (user) => {
    setEditingUid(user.uid);
    setForm({
      email: user.email,
      displayName: user.displayName,
      role: user.role || ROLES.USER,
      assignedPageIds: (user.assignedPageIds || []).join('\n'),
      pageId: user.pageId || '',
      invitationChannel: INVITATION_CHANNELS.EMAIL,
      whatsappPhone: '',
    });
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
      };

      if (editingUid) {
        await saveUserProfile(db, editingUid, payload);
      } else {
        if (
          form.invitationChannel === INVITATION_CHANNELS.WHATSAPP
          && !String(form.whatsappPhone ?? '').replace(/\D/g, '')
        ) {
          throw new Error('Ingresa un teléfono de WhatsApp con código de país.');
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
          });
          setInvitationStatus('');
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

  const handlePrepareInvitation = async (user) => {
    setError('');
    setInvitationStatus('');
    try {
      const result = await generateCmsUserInvitation(user.uid);
      setInvitation({
        ...result,
        displayName: result.displayName || user.displayName || '',
        channel: INVITATION_CHANNELS.EMAIL,
        phone: '',
      });
    } catch (invitationError) {
      setError(invitationError.message || 'No se pudo preparar la invitación.');
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

  const handleDelete = async (uid) => {
    if (!window.confirm('¿Eliminar este usuario? Se borrará su perfil de acceso y su cuenta de Authentication.')) {
      return;
    }

    setError('');
    try {
      await deleteCmsUser(uid);
      if (editingUid === uid) resetForm();
      await loadUsers();
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError.message || 'No se pudo eliminar el usuario.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Gestión de usuarios</h2>
            <p className="text-xs text-gray-500">
              Solo root. Crea cuentas, asigna accesos y prepara invitaciones seguras.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Usuarios registrados</h3>
            {loading ? (
              <p className="text-xs text-gray-400">Cargando...</p>
            ) : users.length === 0 ? (
              <p className="text-xs text-gray-400">No hay perfiles de acceso todavía.</p>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user.uid} className="border rounded-lg p-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{user.email || user.uid}</p>
                        <p className="text-gray-500">{getRoleLabel(user.role)}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-1">{user.uid}</p>
                        {user.role === ROLES.ADMIN && (
                          <p className="text-gray-400 mt-1 font-mono">
                            {(user.assignedPageIds || []).join(', ') || 'Sin páginas'}
                          </p>
                        )}
                        {user.role === ROLES.USER && (
                          <p className="text-gray-400 mt-1 font-mono">{user.pageId || 'Sin página'}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handlePrepareInvitation(user)}
                          className="px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100"
                        >
                          Invitar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(user)}
                          className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user.uid)}
                          className="px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
                        >
                          Borrar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 border rounded-xl p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">
              {editingUid ? 'Editar usuario' : 'Nuevo usuario'}
            </h3>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Email</label>
              <input
                type="email"
                required
                disabled={Boolean(editingUid)}
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-xs disabled:bg-gray-100"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Nombre (opcional)</label>
              <input
                type="text"
                value={form.displayName}
                onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-xs"
              />
            </div>

            {!editingUid && (
              <div className="space-y-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
                <label className="block text-[10px] font-bold text-indigo-500 uppercase">
                  Preparar invitación
                </label>
                <select
                  value={form.invitationChannel}
                  onChange={(event) => setForm({ ...form, invitationChannel: event.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-xs bg-white"
                >
                  <option value={INVITATION_CHANNELS.EMAIL}>Correo</option>
                  <option value={INVITATION_CHANNELS.WHATSAPP}>WhatsApp</option>
                  <option value={INVITATION_CHANNELS.NONE}>No preparar ahora</option>
                </select>
                {form.invitationChannel === INVITATION_CHANNELS.WHATSAPP && (
                  <input
                    type="tel"
                    required
                    value={form.whatsappPhone}
                    onChange={(event) => setForm({ ...form, whatsappPhone: event.target.value })}
                    placeholder="5215512345678 (con código de país)"
                    className="w-full border rounded-lg px-3 py-2 text-xs bg-white"
                  />
                )}
                <p className="text-[10px] text-indigo-500">
                  Se generará un enlace temporal para que el usuario establezca su contraseña.
                </p>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Rol</label>
              <select
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-xs"
              >
                <option value={ROLES.ROOT}>Root — todas las páginas</option>
                <option value={ROLES.ADMIN}>Admin — páginas asignadas</option>
                <option value={ROLES.USER}>Usuario — una sola página</option>
              </select>
            </div>

            {form.role === ROLES.ADMIN && (
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Páginas asignadas</label>
                <textarea
                  rows={4}
                  value={form.assignedPageIds}
                  onChange={(event) => setForm({ ...form, assignedPageIds: event.target.value })}
                  placeholder="maria-garcia&#10;ana-lopez"
                  className="w-full border rounded-lg px-3 py-2 text-xs font-mono"
                />
                {pageOptions.length > 0 && (
                  <p className="text-[10px] text-gray-400">
                    Disponibles: {pageOptions.map((page) => page.id).join(', ')}
                  </p>
                )}
              </div>
            )}

            {form.role === ROLES.USER && (
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Página asignada</label>
                <input
                  type="text"
                  required
                  list="page-id-options"
                  value={form.pageId}
                  onChange={(event) => setForm({ ...form, pageId: event.target.value })}
                  placeholder="maria-garcia"
                  className="w-full border rounded-lg px-3 py-2 text-xs font-mono"
                />
                <datalist id="page-id-options">
                  {pageOptions.map((page) => (
                    <option key={page.id} value={page.id}>{page.name || page.id}</option>
                  ))}
                </datalist>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#4A5D4E] text-white rounded-lg py-2 text-xs font-semibold disabled:opacity-60"
              >
                {saving ? 'Guardando...' : editingUid ? 'Actualizar perfil' : 'Crear usuario'}
              </button>
              {editingUid && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-2 text-xs rounded-lg border bg-white hover:bg-gray-100"
                >
                  Cancelar
                </button>
              )}
            </div>

            <p className="text-[10px] text-gray-400 leading-relaxed">
              {editingUid
                ? 'La edición actualiza rol y páginas en Firestore. El email y la contraseña de Authentication no se modifican desde aquí.'
                : 'La cuenta se crea con una contraseña interna aleatoria. El usuario establece la suya mediante la invitación.'}
            </p>
          </form>
        </div>
      </div>

      {invitation && (
        <div className="fixed inset-0 z-[60] bg-black/55 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-2xl p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Invitación preparada</h3>
              <p className="mt-1 text-xs text-gray-500">
                Usuario creado: <span className="font-semibold text-gray-700">{invitation.email}</span>
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Enviar mediante</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInvitation({ ...invitation, channel: INVITATION_CHANNELS.EMAIL })}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                    invitation.channel === INVITATION_CHANNELS.EMAIL
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  ✉ Correo
                </button>
                <button
                  type="button"
                  onClick={() => setInvitation({ ...invitation, channel: INVITATION_CHANNELS.WHATSAPP })}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                    invitation.channel === INVITATION_CHANNELS.WHATSAPP
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  WhatsApp
                </button>
              </div>
              {invitation.channel === INVITATION_CHANNELS.WHATSAPP && (
                <input
                  type="tel"
                  value={invitation.phone}
                  onChange={(event) => setInvitation({ ...invitation, phone: event.target.value })}
                  placeholder="5215512345678 (con código de país)"
                  className="w-full rounded-lg border px-3 py-2 text-xs"
                />
              )}
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
                {invitation.channel === INVITATION_CHANNELS.WHATSAPP
                  ? 'Abrir WhatsApp'
                  : 'Abrir correo'}
              </button>
              <button
                type="button"
                onClick={() => handleCopyInvitation(
                  buildUserInvitationMessage(invitation),
                  'Mensaje copiado.',
                )}
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
            <p className="text-[10px] text-gray-400">
              La invitación queda preparada; el envío se confirma en Correo o WhatsApp.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
