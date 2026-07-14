import {
  getDefaultLegalDocument,
} from '../utils/legalDocuments';

function LegalDocEditor({
  label,
  enabled,
  title,
  body,
  defaultTitle,
  defaultBody,
  onEnabledChange,
  onTitleChange,
  onBodyChange,
  onReset,
}) {
  return (
    <fieldset className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
      <legend className="px-1 text-[10px] font-bold text-gray-400 uppercase">{label}</legend>

      <label className="flex items-center gap-2 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="rounded border-gray-300"
        />
        Mostrar enlace en el pie
      </label>

      {enabled && (
        <>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={defaultTitle}
              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
            />
            <p className="text-[10px] text-gray-400">Vacío = texto por defecto.</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Contenido</label>
              <button
                type="button"
                onClick={onReset}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Restaurar texto por defecto
              </button>
            </div>
            <textarea
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              placeholder={defaultBody}
              rows={8}
              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white resize-y min-h-[140px] leading-relaxed"
            />
            <p className="text-[10px] text-gray-400">
              Vacío = plantilla por defecto (idioma de la página). Separa párrafos con una línea en blanco.
            </p>
          </div>
        </>
      )}
    </fieldset>
  );
}

export default function LegalDocumentsFieldsEditor({ formData, onChange }) {
  const language = formData.labelLanguage === 'en' ? 'en' : 'es';
  const termsDefault = getDefaultLegalDocument('termsOfUse', language);
  const privacyDefault = getDefaultLegalDocument('privacyPolicy', language);

  return (
    <div className="space-y-3 pt-2 border-t">
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase">Documentos legales</label>
        <p className="text-[10px] text-gray-400 mt-1">
          Enlaces en el pie que abren un diálogo. Si dejas título o contenido vacíos, se usa la plantilla por defecto.
        </p>
      </div>

      <LegalDocEditor
        label="Términos de uso"
        enabled={formData.termsOfUseEnabled !== false}
        title={formData.termsOfUseTitle || ''}
        body={formData.termsOfUseBody || ''}
        defaultTitle={termsDefault.title}
        defaultBody={termsDefault.body}
        onEnabledChange={(termsOfUseEnabled) => onChange({ ...formData, termsOfUseEnabled })}
        onTitleChange={(termsOfUseTitle) => onChange({ ...formData, termsOfUseTitle })}
        onBodyChange={(termsOfUseBody) => onChange({ ...formData, termsOfUseBody })}
        onReset={() => onChange({
          ...formData,
          termsOfUseTitle: termsDefault.title,
          termsOfUseBody: termsDefault.body,
        })}
      />

      <LegalDocEditor
        label="Política de privacidad"
        enabled={formData.privacyPolicyEnabled !== false}
        title={formData.privacyPolicyTitle || ''}
        body={formData.privacyPolicyBody || ''}
        defaultTitle={privacyDefault.title}
        defaultBody={privacyDefault.body}
        onEnabledChange={(privacyPolicyEnabled) => onChange({ ...formData, privacyPolicyEnabled })}
        onTitleChange={(privacyPolicyTitle) => onChange({ ...formData, privacyPolicyTitle })}
        onBodyChange={(privacyPolicyBody) => onChange({ ...formData, privacyPolicyBody })}
        onReset={() => onChange({
          ...formData,
          privacyPolicyTitle: privacyDefault.title,
          privacyPolicyBody: privacyDefault.body,
        })}
      />
    </div>
  );
}
