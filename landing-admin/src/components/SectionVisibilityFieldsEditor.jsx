
import { TOGGLEABLE_PAGE_SECTIONS } from '../utils/sectionVisibility';

export default function SectionVisibilityFieldsEditor({ formData, onChange }) {
  const toggle = (flag, defaultEnabled, checked) => {
    onChange({ ...formData, [flag]: checked });
  };

  const isChecked = (flag, defaultEnabled) => {
    if (formData?.[flag] === undefined || formData?.[flag] === null) return defaultEnabled;
    return formData[flag] === true;
  };

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-gray-400">
        Activa o desactiva bloques de la landing. El navbar siempre permanece. Las secciones con contenido propio
        (servicios, catálogo, etc.) también requieren su contenido y «Mostrar sección» cuando aplica.
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {TOGGLEABLE_PAGE_SECTIONS.map((section) => (
          <label
            key={section.flag}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700"
          >
            <input
              type="checkbox"
              checked={isChecked(section.flag, section.defaultEnabled)}
              onChange={(e) => toggle(section.flag, section.defaultEnabled, e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>{section.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
