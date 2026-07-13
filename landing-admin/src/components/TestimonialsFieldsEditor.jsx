import { createEmptyTestimonial } from '../utils/testimonials';
import ImageUrlField from './ImageUrlField';
import SectionBackgroundEditor from './SectionBackgroundEditor';

export default function TestimonialsFieldsEditor({ formData, onChange, pageId }) {
  const enabled = Boolean(formData.testimonialsEnabled);
  const items = Array.isArray(formData.testimonials) && formData.testimonials.length > 0
    ? formData.testimonials
    : [createEmptyTestimonial()];

  const updateItems = (nextItems) => {
    onChange({ ...formData, testimonials: nextItems });
  };

  const updateItem = (index, field, value) => {
    updateItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => {
    updateItems([...items, createEmptyTestimonial()]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) {
      updateItems([createEmptyTestimonial()]);
      return;
    }
    updateItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 pt-2 border-t">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-[11px] font-bold text-gray-400 uppercase">
          Testimonios
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onChange({ ...formData, testimonialsEnabled: e.target.checked })}
            className="rounded border-gray-300"
          />
          Mostrar sección
        </label>
      </div>

      {enabled && (
        <>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Título de la sección</label>
            <input
              type="text"
              value={formData.testimonialsSectionTitle || ''}
              onChange={(e) => onChange({ ...formData, testimonialsSectionTitle: e.target.value })}
              placeholder="Testimonios"
              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-400">Cada testimonio necesita al menos la frase. La foto es opcional.</p>
            <button
              type="button"
              onClick={addItem}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
            >
              + Añadir testimonio
            </button>
          </div>

          {items.map((item, index) => (
            <div key={`testimonial-editor-${index}`} className="border rounded-lg p-4 space-y-3 bg-gray-50/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Testimonio {index + 1}</span>
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
                  placeholder="María G. · Paciente desde 2022"
                  className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Frase</label>
                <textarea
                  rows="3"
                  value={item.quote || ''}
                  onChange={(e) => updateItem(index, 'quote', e.target.value)}
                  placeholder="La terapia me ayudó a entender mis emociones y recuperar la calma."
                  className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <ImageUrlField
                label="Foto (opcional)"
                value={item.imageUrl || ''}
                onChange={(imageUrl) => updateItem(index, 'imageUrl', imageUrl)}
                pageId={pageId}
                pageData={formData}
                uploadFolder={`testimonial-${index + 1}`}
                placeholder="https://ejemplo.com/foto.jpg"
                previewClassName="h-12 w-12 rounded-full object-cover border bg-white"
                previewAlt={`Vista previa testimonio ${index + 1}`}
                helperText="Pega una URL o sube una foto. Si no hay imagen, se muestra un icono decorativo."
              />
            </div>
          ))}
        </>
      )}

      <SectionBackgroundEditor
        sectionKey="testimonials"
        label="Fondo de testimonios"
        formData={formData}
        onChange={onChange}
      />
    </div>
  );
}
