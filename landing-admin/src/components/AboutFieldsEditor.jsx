
import SectionBackgroundEditor from './SectionBackgroundEditor';
import {
  getCatalogLabel,
  getCustomLabelValue,
  setCustomLabelValue,
} from '../utils/labels';

export default function AboutFieldsEditor({ formData, onChange }) {
  const language = formData.labelLanguage === 'en' ? 'en' : 'es';
  const titleCustom = getCustomLabelValue(formData.customLabels, language, 'about.title');
  const titleDefault = getCatalogLabel(language, 'about.title');

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
        <label className="block text-[10px] font-bold text-gray-400 uppercase">Frase / filosofía</label>
        <input
          type="text"
          value={formData.aboutTagline || ''}
          onChange={(e) => onChange({ ...formData, aboutTagline: e.target.value })}
          placeholder="Cada proceso es único..."
          className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-400 uppercase">Biografía</label>
        <textarea
          rows="4"
          value={formData.aboutBio || ''}
          onChange={(e) => onChange({ ...formData, aboutBio: e.target.value })}
          placeholder="Biografía profesional."
          className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
        />
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
