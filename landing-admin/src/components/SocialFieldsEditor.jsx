import { SOCIAL_FIELDS, parseSocialHandle, getWhatsAppSocialPlaceholder } from '../utils/socialLinks';
import { getPhoneCountryMeta, normalizePhoneCountry, PHONE_COUNTRIES, toWhatsAppMeNumber } from '../utils/phone';
import SectionBackgroundEditor from './SectionBackgroundEditor';

export default function SocialFieldsEditor({ formData, onChange }) {
  const iconOnly = formData.socialIconOnly === true;
  const country = normalizePhoneCountry(formData.phoneCountry);
  const countryMeta = getPhoneCountryMeta(country);
  const whatsappPreview = toWhatsAppMeNumber(formData.whatsapp, country);

  const handleChange = (key, rawValue) => {
    if (key === 'whatsapp') {
      onChange({ ...formData, [key]: rawValue.replace(/\D/g, '') });
      return;
    }
    onChange({ ...formData, [key]: rawValue.replace(/^@+/, '') });
  };

  const handleBlur = (key, rawValue) => {
    const cleaned = parseSocialHandle(rawValue, key);
    if (cleaned !== (formData[key] || '')) {
      onChange({ ...formData, [key]: cleaned });
    }
  };

  return (
    <div className="space-y-3 pt-2 border-t">
      <label className="block text-[11px] font-bold text-gray-400 uppercase">Redes sociales</label>
      <p className="text-[10px] text-gray-400">Solo edita el usuario o identificador. El enlace base ya está incluido.</p>

      <fieldset className="space-y-2 pb-1">
        <legend className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Botones visibles</legend>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="radio"
            name="social-display-mode"
            checked={!iconOnly}
            onChange={() => onChange({ ...formData, socialIconOnly: false })}
            className="border-gray-300"
          />
          Icono + nombre de la red
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="radio"
            name="social-display-mode"
            checked={iconOnly}
            onChange={() => onChange({ ...formData, socialIconOnly: true })}
            className="border-gray-300"
          />
          Solo icono
        </label>
      </fieldset>

      {SOCIAL_FIELDS.map(({ key, label, prefix, placeholder }) => {
        const isWhatsapp = key === 'whatsapp';
        const fieldPlaceholder = isWhatsapp ? getWhatsAppSocialPlaceholder(country) : placeholder;

        return (
          <div key={key} className="space-y-1">
            <label className="block text-[10px] font-semibold text-gray-500">{label}</label>
            {isWhatsapp && (
              <select
                value={country}
                onChange={(e) => onChange({ ...formData, phoneCountry: e.target.value })}
                className="w-full border p-2.5 text-xs rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                aria-label="Código de país WhatsApp"
              >
                {PHONE_COUNTRIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label} ({item.dialLabel})
                  </option>
                ))}
              </select>
            )}
            <div className="flex items-stretch">
              <span className="inline-flex items-center px-2.5 border border-r-0 rounded-l-lg bg-gray-100 text-[10px] text-gray-500 shrink-0 max-w-[50%] truncate">
                {prefix}
              </span>
              <input
                type="text"
                value={formData[key] || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                onBlur={(e) => handleBlur(key, e.target.value)}
                placeholder={fieldPlaceholder}
                className="flex-1 min-w-0 border p-2.5 text-xs rounded-r-lg focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            {isWhatsapp && (
              <p className="text-[10px] text-gray-400">
                Número local ({countryMeta.nationalLength} dígitos). El código de país se agrega solo
                {country === 'mx' ? ' (incluye el 1 que pide WhatsApp en México).' : '.'}
              </p>
            )}
            {isWhatsapp && whatsappPreview && (
              <p className="text-[10px] text-gray-500 font-mono truncate">
                → wa.me/{whatsappPreview}
              </p>
            )}
          </div>
        );
      })}

      <SectionBackgroundEditor
        sectionKey="social"
        label="Fondo de redes sociales"
        formData={formData}
        onChange={onChange}
      />
    </div>
  );
}
