import { buildSocialUrl } from '../utils/socialLinks';

export default function PhoneFieldsEditor({ formData, onChange }) {
  const isWhatsapp = formData.phoneIsWhatsapp === true;
  const whatsappConfigured = Boolean(buildSocialUrl(formData.whatsapp, 'whatsapp'));

  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-bold text-gray-400 uppercase">Teléfono</label>
      <input
        type="text"
        value={formData.phone || ''}
        onChange={(e) => onChange({ ...formData, phone: e.target.value })}
        placeholder="+52 55 1234 5678"
        className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
      />
      <label className="flex items-center gap-2 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={isWhatsapp}
          onChange={(e) => onChange({ ...formData, phoneIsWhatsapp: e.target.checked })}
          className="rounded border-gray-300"
        />
        Abrir WhatsApp en lugar de llamada
      </label>
      {isWhatsapp && (
        <p className="text-[10px] text-gray-400">
          Usa el número de WhatsApp en Redes sociales; si está vacío, se toman solo los dígitos del teléfono.
        </p>
      )}
      {isWhatsapp && !whatsappConfigured && !String(formData.phone ?? '').replace(/\D/g, '') && (
        <p className="text-[10px] text-amber-600">
          Configura WhatsApp en Redes sociales o escribe un teléfono con dígitos.
        </p>
      )}
    </div>
  );
}
