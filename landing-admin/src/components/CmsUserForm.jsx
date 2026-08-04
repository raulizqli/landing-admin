import { ROLES } from '../utils/permissions';
import { INVITATION_CHANNELS } from '../utils/userInvitation';

export const EMPTY_CMS_USER_FORM = {
  email: '',
  displayName: '',
  role: ROLES.USER,
  assignedPageIds: '',
  pageId: '',
  isDemo: false,
  invitationChannel: INVITATION_CHANNELS.EMAIL,
  whatsappPhone: '',
};

export function parsePageIdsInput(value) {
  return String(value ?? '')
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function userToForm(user) {
  return {
    email: user.email || '',
    displayName: user.displayName || '',
    role: user.role || ROLES.USER,
    assignedPageIds: (user.assignedPageIds || []).join('\n'),
    pageId: user.pageId || '',
    isDemo: user.isDemo === true,
    invitationChannel: INVITATION_CHANNELS.EMAIL,
    whatsappPhone: '',
  };
}

function FormFields({ form, setForm, editingUid, pageOptions }) {
  return (
    <>
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
          onChange={(event) => {
            const role = event.target.value;
            setForm({
              ...form,
              role,
              isDemo: role === ROLES.ROOT ? false : form.isDemo,
            });
          }}
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
            rows={6}
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

      {form.role !== ROLES.ROOT ? (
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={form.isDemo === true}
            onChange={(event) => setForm({ ...form, isDemo: event.target.checked })}
            className="rounded border-gray-300"
          />
          Marcar como usuario demo
        </label>
      ) : (
        <p className="text-[11px] text-gray-400">
          Los usuarios root no se pueden marcar como demo, bloquear ni eliminar.
        </p>
      )}
    </>
  );
}

export default function CmsUserForm({
  form,
  setForm,
  editingUid = null,
  pageOptions = [],
  saving = false,
  error = '',
  onSubmit,
  onCancel,
  variant = 'card',
}) {
  const title = editingUid ? 'Editar usuario' : 'Nuevo usuario';
  const submitLabel = saving
    ? 'Guardando...'
    : editingUid
      ? 'Guardar cambios'
      : 'Crear usuario';
  const hint = editingUid
    ? 'La edición actualiza rol, páginas y marca demo. El email no se modifica desde aquí.'
    : 'La cuenta se crea sin contraseña. El usuario la establece con el enlace de invitación.';

  if (variant === 'panel') {
    return (
      <form onSubmit={onSubmit} className="flex h-full min-h-0 flex-col bg-white">
        <div className="shrink-0 border-b border-gray-200 px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-[11px] text-gray-500">{hint}</p>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4">
          <FormFields
            form={form}
            setForm={setForm}
            editingUid={editingUid}
            pageOptions={pageOptions}
          />
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-3 flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-[#4A5D4E] text-white rounded-lg py-2.5 text-xs font-semibold disabled:opacity-60"
          >
            {submitLabel}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 text-xs rounded-lg border bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 border rounded-xl p-4 bg-gray-50">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      <FormFields
        form={form}
        setForm={setForm}
        editingUid={editingUid}
        pageOptions={pageOptions}
      />
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-[#4A5D4E] text-white rounded-lg py-2 text-xs font-semibold disabled:opacity-60"
        >
          {submitLabel}
        </button>
        {editingUid && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-xs rounded-lg border bg-white hover:bg-gray-100"
          >
            Cancelar
          </button>
        )}
      </div>
      <p className="text-[10px] text-gray-400 leading-relaxed">{hint}</p>
    </form>
  );
}
