import {
  VERTICALS,
  getVerticalMeta,
  normalizeVertical,
} from '@raulizqli/landing-core/verticals';
import { normalizeLabelLanguage } from '../utils/labels';

function hasCustomLabelOverrides(customLabels = {}) {
  const buckets = [customLabels.es, customLabels.en].filter(Boolean);
  return buckets.some((bucket) => Object.keys(bucket).length > 0);
}

export default function VerticalFieldsEditor({ formData, onChange, language: languageProp }) {
  const selected = normalizeVertical(formData?.vertical);
  const meta = getVerticalMeta(selected);
  const language = normalizeLabelLanguage(languageProp ?? formData?.labelLanguage);
  const warnCustom = hasCustomLabelOverrides(formData?.customLabels);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase">
          {language === 'en' ? 'Business type' : 'Tipo de negocio'}
        </label>
        <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
          {language === 'en'
            ? 'Sets the default landing copy (buttons, sections, messages). Custom labels take priority and are not cleared when you change the preset.'
            : 'Define los textos por defecto de la landing (botones, secciones, mensajes). Las etiquetas personalizadas tienen prioridad y no se borran al cambiar el preset.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {VERTICALS.map((item) => {
          const isSelected = selected === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange({ ...formData, vertical: item.id })}
              className={`text-left rounded-xl border px-3 py-2.5 transition ${
                isSelected
                  ? 'border-[#4A5D4E] bg-[#4A5D4E]/8 ring-1 ring-[#4A5D4E]/30'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <p className={`text-xs font-semibold ${isSelected ? 'text-[#2A342D]' : 'text-gray-800'}`}>
                {item.label[language] || item.label.es}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                {item.description[language] || item.description.es}
              </p>
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-500">
        {language === 'en' ? 'Active:' : 'Activo:'}
        {' '}
        <span className="font-semibold text-gray-700">
          {meta.label[language] || meta.label.es}
        </span>
      </p>

      {warnCustom && (
        <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
          {language === 'en'
            ? 'This page has custom labels. They keep overriding the preset until you clear them in Labels.'
            : 'Esta página tiene etiquetas personalizadas. Esas seguirán mostrándose por encima del preset hasta que las quites en «Etiquetas».'}
        </p>
      )}
    </div>
  );
}
