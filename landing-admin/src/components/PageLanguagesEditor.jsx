import {
  PAGE_LANGUAGE_OPTIONS,
  normalizeEnabledLanguages,
  normalizePageLanguage,
  setPageLanguageConfiguration,
} from '@raulizqli/landing-core/pageTranslations';

export default function PageLanguagesEditor({
  formData,
  editingLanguage,
  onEditingLanguageChange,
  onChange,
}) {
  const defaultLanguage = normalizePageLanguage(formData.defaultLanguage ?? formData.labelLanguage);
  const enabledLanguages = normalizeEnabledLanguages(formData.enabledLanguages, defaultLanguage);

  const updateConfiguration = (configuration) => {
    const next = setPageLanguageConfiguration(formData, {
      defaultLanguage: configuration.defaultLanguage ?? defaultLanguage,
      enabledLanguages: configuration.enabledLanguages ?? enabledLanguages,
    });
    onChange(next);
    if (!next.enabledLanguages.includes(editingLanguage)) {
      onEditingLanguageChange(next.defaultLanguage);
    }
  };

  const toggleLanguage = (language) => {
    if (language === defaultLanguage) return;
    const enabled = enabledLanguages.includes(language)
      ? enabledLanguages.filter((item) => item !== language)
      : [...enabledLanguages, language];
    updateConfiguration({ enabledLanguages: enabled });
  };

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-4">
      <div>
        <p className="text-[11px] font-bold text-indigo-700 uppercase">Idiomas de la landing</p>
        <p className="text-[10px] text-indigo-500 mt-1">
          El contenido visual y la configuración se comparten. Los textos se editan por idioma.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
            Idioma predeterminado
          </label>
          <select
            value={defaultLanguage}
            onChange={(event) => {
              const nextLanguage = event.target.value;
              updateConfiguration({ defaultLanguage: nextLanguage });
              onEditingLanguageChange(nextLanguage);
            }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white"
          >
            {PAGE_LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <span className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
            Idiomas públicos
          </span>
          <div className="flex gap-2">
            {PAGE_LANGUAGE_OPTIONS.map((option) => {
              const enabled = enabledLanguages.includes(option.value);
              const locked = option.value === defaultLanguage;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleLanguage(option.value)}
                  title={locked ? 'El idioma predeterminado siempre está habilitado' : ''}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    enabled
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                  } ${locked ? 'cursor-default' : ''}`}
                >
                  {option.shortLabel}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <span className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
          Editando ahora
        </span>
        <div className="flex gap-2">
          {PAGE_LANGUAGE_OPTIONS
            .filter((option) => enabledLanguages.includes(option.value))
            .map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onEditingLanguageChange(option.value)}
                className={`rounded-lg border px-4 py-2 text-xs font-semibold transition ${
                  editingLanguage === option.value
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
