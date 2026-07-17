
import {
  getCustomLabelValue,
  getDefaultLabelForPage,
  getLabelAdminName,
  getLabelGroupTitle,
  LABEL_GROUPS,
  LABEL_LANGUAGES,
  normalizeCustomLabels,
  normalizeLabelLanguage,
  setCustomLabelValue,
} from '../utils/labels';

export default function LabelsFieldsEditor({
  formData,
  onChange,
  groupIds = null,
  showLanguagePicker = true,
  compact = false,
  language: languageProp,
}) {
  const language = normalizeLabelLanguage(languageProp ?? formData.labelLanguage);
  const groups = Array.isArray(groupIds)
    ? LABEL_GROUPS.filter((group) => groupIds.includes(group.id))
    : LABEL_GROUPS;

  const handleLanguageChange = (nextLanguage) => {
    const next = normalizeLabelLanguage(nextLanguage);
    onChange({
      ...formData,
      labelLanguage: next,
      customLabels: normalizeCustomLabels(formData.customLabels),
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

  if (groups.length === 0 && !showLanguagePicker) return null;

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {showLanguagePicker && (
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase">
            {language === 'en' ? 'Label language (public landing)' : 'Idioma de etiquetas (landing pública)'}
          </label>
          <p className="text-[10px] text-gray-400 mt-1 mb-2">
            {language === 'en'
              ? 'Sets the base language for buttons, fixed titles, and messages. You can customize each label per language.'
              : 'Define el idioma base de botones, títulos fijos y mensajes. Puedes personalizar cada etiqueta por idioma.'}
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
      )}

      {groups.map((group) => (
        <div
          key={`${group.id}-${language}`}
          className={compact
            ? 'space-y-3'
            : 'space-y-3 rounded-xl border border-gray-200 p-4 bg-gray-50/70'}
        >
          {!compact && (
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              {getLabelGroupTitle(group, language)}
            </h3>
          )}
          {compact && (
            <p className="text-[10px] font-bold text-gray-400 uppercase">
              {getLabelGroupTitle(group, language)}
            </p>
          )}
          <div className="space-y-3">
            {group.keys.map((key) => {
              const customValue = getCustomLabelValue(formData.customLabels, language, key);
              const defaultValue = getDefaultLabelForPage(
                { ...formData, labelLanguage: language },
                key,
              );

              return (
                <div key={`${language}-${key}`} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">
                      {getLabelAdminName(key, language)}
                    </label>
                    {customValue && (
                      <button
                        type="button"
                        onClick={() => handleResetLabel(key)}
                        className="text-[10px] text-indigo-600 hover:underline"
                      >
                        {language === 'en' ? 'Reset' : 'Restaurar'}
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
                    {language === 'en' ? 'Default' : 'Por defecto'} ({language}): {defaultValue}
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
