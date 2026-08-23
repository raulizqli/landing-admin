import { buildSocialUrl } from '../utils/socialLinks';
import { getPhoneCountryMeta, normalizePhoneCountry, PHONE_COUNTRIES, toWhatsAppMeNumber } from '../utils/phone';

export default function PhoneFieldsEditor({ formData, onChange }) {
  const isWhatsapp = formData.phoneIsWhatsapp === true;
  const country = normalizePhoneCountry(formData.phoneCountry);
  const countryMeta = getPhoneCountryMeta(country);
  const whatsappConfigured = Boolean(buildSocialUrl(formData.whatsapp, 'whatsapp', { country }));
  const previewDigits = toWhatsAppMeNumber(formData.whatsapp || formData.phone, country);

  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-bold text-gray-400 uppercase">Teléfono</label>
      <div className="flex gap-2">
        <select
          value={country}
          onChange={(e) => onChange({ ...formData, phoneCountry: e.target.value })}
          className="w-[9.5rem] shrink-0 border p-2.5 text-xs rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
          aria-label="Código de país"
        >
          {PHONE_COUNTRIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label} ({item.dialLabel})
            </option>
          ))}
        </select>
        <input
          type="text"
          value={formData.phone || ''}
          onChange={(e) => onChange({ ...formData, phone: e.target.value })}
          placeholder={countryMeta.placeholder}
          className="flex-1 min-w-0 border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
        />
      </div>
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
          Escribe el número local ({countryMeta.nationalLength} dígitos). El enlace de WhatsApp se arma solo
          {country === 'mx' ? ' (México: 52 + 1 + tu número).' : ' con el código del país.'}
          {' '}Si hay número en Redes → WhatsApp, se usa ese.
        </p>
      )}
      {isWhatsapp && previewDigits && (
        <p className="text-[10px] text-gray-500 font-mono truncate" title={`https://wa.me/${previewDigits}`}>
          wa.me/{previewDigits}
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
