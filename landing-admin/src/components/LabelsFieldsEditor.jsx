import {
  getCatalogLabel,
  getCustomLabelValue,
  LABEL_GROUPS,
  LABEL_ADMIN_NAMES,
  LABEL_LANGUAGES,
  setCustomLabelValue,
} from '../utils/labels';

export default function LabelsFieldsEditor({ formData, onChange }) {
  const language = formData.labelLanguage === 'en' ? 'en' : 'es';

  const handleLanguageChange = (nextLanguage) => {
    onChange({
      ...formData,
      labelLanguage: nextLanguage,
    });
  };

  const handleLabelChange = (key, value) => {
    onChange({
      ...formData,
      customLabels: setCustomLabelValue(formData.customLabels, language, key, value),
    });
  };

  const handleResetLabel = (key) => {
    handleLabelChange(key, '');
  };

  return (
    <div className="space-y-4 pt-2 border-t">
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase">
          Idioma de etiquetas (landing pública)
        </label>
        <p className="text-[10px] text-gray-400 mt-1 mb-2">
          Define el idioma base de botones, títulos fijos y mensajes. Puedes personalizar cada etiqueta por idioma.
        </p>
        <div className="flex gap-2">
          {LABEL_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleLanguageChange(lang)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                language === lang
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {lang === 'es' ? 'Español' : 'English'}
            </button>
          ))}
        </div>
      </div>

      {LABEL_GROUPS.map((group) => (
        <div key={group.id} className="space-y-3 rounded-xl border border-gray-200 p-4 bg-gray-50/70">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">{group.title}</h3>
          <div className="space-y-3">
            {group.keys.map((key) => {
              const customValue = getCustomLabelValue(formData.customLabels, language, key);
              const defaultValue = getCatalogLabel(language, key);

              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">
                      {LABEL_ADMIN_NAMES[key] || key}
                    </label>
                    {customValue && (
                      <button
                        type="button"
                        onClick={() => handleResetLabel(key)}
                        className="text-[10px] text-indigo-600 hover:underline"
                      >
                        Restaurar
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={customValue}
                    onChange={(event) => handleLabelChange(key, event.target.value)}
                    placeholder={defaultValue}
                    className="w-full border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-[10px] text-gray-400">
                    Por defecto ({language}): {defaultValue}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
