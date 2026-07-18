import SectionBackgroundEditor from './SectionBackgroundEditor';
import AiAssistButton from './AiAssistButton';
import {
  getCatalogLabel,
  getCustomLabelValue,
  setCustomLabelValue,
} from '../utils/labels';

export default function AboutFieldsEditor({ formData, onChange, language: languageProp, pageId = '' }) {
  const language = languageProp === 'en' || formData.labelLanguage === 'en' ? 'en' : 'es';
  const titleCustom = getCustomLabelValue(formData.customLabels, language, 'about.title');
  const titleDefault = getCatalogLabel(language, 'about.title');
  const showBio = formData.aboutBioEnabled !== false;

  const updateTitle = (value) => {
    onChange({
      ...formData,
      customLabels: setCustomLabelValue(formData.customLabels, language, 'about.title', value),
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-400 uppercase">Título de la sección</label>
        <input
          type="text"
          value={titleCustom}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder={titleDefault}
          className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
        />
        <p className="text-[10px] text-gray-400">
          Aparece al inicio del bloque. Por defecto: «{titleDefault}». Déjalo vacío para usar el valor por defecto.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">Frase / destacado</label>
          <AiAssistButton
            formData={formData}
            onChange={onChange}
            pageId={pageId}
            fieldPath="aboutTagline"
            action="polish_tagline"
            currentValue={formData.aboutTagline || ''}
          />
        </div>
        <input
          type="text"
          value={formData.aboutTagline || ''}
          onChange={(e) => onChange({ ...formData, aboutTagline: e.target.value })}
          placeholder="Una propuesta clara, cercana y profesional..."
          className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={showBio}
            onChange={(e) => onChange({ ...formData, aboutBioEnabled: e.target.checked })}
            className="rounded border-gray-300"
          />
          Mostrar texto descriptivo
        </label>
        <p className="text-[10px] text-gray-400">
          Párrafo libre (descripción, enfoque, trayectoria, etc.). Si lo desactivas, solo se muestra la frase destacada.
        </p>
        {showBio && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto descriptivo</label>
              <AiAssistButton
                formData={formData}
                onChange={onChange}
                pageId={pageId}
                fieldPath="aboutBio"
                action="polish_bio"
                currentValue={formData.aboutBio || ''}
                fullActions={[
                  { action: 'seo_meta', tone: 'empathetic', labelKey: 'ai.seoMeta' },
                  { action: 'blog_draft', tone: 'empathetic', labelKey: 'ai.blogDraft' },
                ]}
              />
            </div>
            <textarea
              rows="4"
              value={formData.aboutBio || ''}
              onChange={(e) => onChange({ ...formData, aboutBio: e.target.value })}
              placeholder="Describe tu enfoque, trayectoria o lo que quieras comunicar en esta sección."
              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none bg-white"
            />
          </div>
        )}
      </div>

      <SectionBackgroundEditor
        sectionKey="about"
        label="Colores de la sección"
        formData={formData}
        onChange={onChange}
      />
    </div>
  );
}
