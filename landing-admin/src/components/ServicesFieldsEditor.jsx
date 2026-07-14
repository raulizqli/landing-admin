import { createEmptyService } from '../utils/services';
import ImageUrlField from './ImageUrlField';
import SectionBackgroundEditor from './SectionBackgroundEditor';

export default function ServicesFieldsEditor({ formData, onChange, pageId, canToggleSection = true }) {
  const enabled = Boolean(formData.servicesSectionEnabled);
  const items = Array.isArray(formData.services) && formData.services.length > 0
    ? formData.services
    : [createEmptyService()];

  const updateItems = (nextItems) => {
    onChange({ ...formData, services: nextItems });
  };

  const updateItem = (index, field, value) => {
    updateItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => {
    updateItems([...items, createEmptyService()]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) {
      updateItems([createEmptyService()]);
      return;
    }
    updateItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 pt-2 border-t">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-[11px] font-bold text-gray-400 uppercase">
          Servicios y temas
        </label>
        {canToggleSection && (
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onChange({ ...formData, servicesSectionEnabled: e.target.checked })}
              className="rounded border-gray-300"
            />
            Mostrar sección
          </label>
        )}
      </div>

      {enabled && (
        <>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Título de la sección</label>
            <input
              type="text"
              value={formData.servicesSectionTitle || ''}
              onChange={(e) => onChange({ ...formData, servicesSectionTitle: e.target.value })}
              placeholder="Servicios y áreas de atención"
              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto introductorio (opcional)</label>
            <textarea
              rows="3"
              value={formData.servicesSectionText || ''}
              onChange={(e) => onChange({ ...formData, servicesSectionText: e.target.value })}
              placeholder="Breve descripción de cómo acompañas a tus pacientes."
              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-400">Cada ítem necesita al menos título o descripción.</p>
            <button
              type="button"
              onClick={addItem}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
            >
              + Añadir servicio o tema
            </button>
          </div>

          {items.map((item, index) => (
            <div key={`service-editor-${index}`} className="border rounded-lg p-4 space-y-3 bg-gray-50/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Ítem {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-[11px] text-red-500 hover:text-red-700"
                >
                  Eliminar
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Título</label>
                <input
                  type="text"
                  value={item.title || ''}
                  onChange={(e) => updateItem(index, 'title', e.target.value)}
                  placeholder="Ansiedad y estrés"
                  className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Descripción</label>
                <textarea
                  rows="3"
                  value={item.description || ''}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  placeholder="Acompañamiento para identificar desencadenantes y desarrollar estrategias de regulación emocional."
                  className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <ImageUrlField
                label="Icono o imagen (opcional)"
                value={item.imageUrl || ''}
                onChange={(imageUrl) => updateItem(index, 'imageUrl', imageUrl)}
                pageId={pageId}
                pageData={formData}
                uploadFolder={`service-${index + 1}`}
                placeholder="https://ejemplo.com/icono.png"
                previewClassName="h-10 w-10 rounded-lg object-cover border bg-white"
                previewAlt={`Vista previa servicio ${index + 1}`}
                helperText="Pega una URL o sube una imagen pequeña. Es opcional."
              />
            </div>
          ))}
        </>
      )}

      <SectionBackgroundEditor
        sectionKey="services"
        label="Fondo de servicios"
        formData={formData}
        onChange={onChange}
      />
    </div>
  );
}
