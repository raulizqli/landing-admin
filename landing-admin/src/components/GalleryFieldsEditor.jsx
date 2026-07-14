
import { createEmptyGalleryItem } from '../utils/gallery';
import ImageUrlField from './ImageUrlField';
import SectionBackgroundEditor from './SectionBackgroundEditor';

export default function GalleryFieldsEditor({ formData, onChange, pageId, canToggleSection = true }) {
  const enabled = Boolean(formData.gallerySectionEnabled);
  const items = Array.isArray(formData.galleryItems) && formData.galleryItems.length > 0
    ? formData.galleryItems
    : [createEmptyGalleryItem()];

  const updateItems = (nextItems) => {
    onChange({ ...formData, galleryItems: nextItems });
  };

  const updateItem = (index, field, value) => {
    updateItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => {
    updateItems([...items, createEmptyGalleryItem()]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) {
      updateItems([createEmptyGalleryItem()]);
      return;
    }
    updateItems(items.filter((_, i) => i !== index));
  };

  const moveItem = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    updateItems(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-[11px] font-bold text-gray-400 uppercase">
          Galería de imágenes
        </label>
        {canToggleSection && (
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onChange({ ...formData, gallerySectionEnabled: e.target.checked })}
              className="rounded border-gray-300"
            />
            Mostrar sección
          </label>
        )}
      </div>

      {enabled && (
        <>
          <p className="text-[10px] text-gray-400">
            Ideal para el consultorio, talleres o momentos del proceso. Solo se publican ítems con imagen.
          </p>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Título de la sección</label>
            <input
              type="text"
              value={formData.gallerySectionTitle || ''}
              onChange={(e) => onChange({ ...formData, gallerySectionTitle: e.target.value })}
              placeholder="Galería"
              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto introductorio (opcional)</label>
            <textarea
              rows="3"
              value={formData.gallerySectionText || ''}
              onChange={(e) => onChange({ ...formData, gallerySectionText: e.target.value })}
              placeholder="Un vistazo al espacio de trabajo."
              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="rounded-lg border border-dashed border-gray-200 bg-white/70 p-3 space-y-3">
            <p className="text-[10px] text-gray-500 leading-snug">
              Portafolio externo (opcional): CTA debajo de la galería curada hacia Pixieset, SmugMug, Format u otro sitio.
            </p>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">URL del portafolio completo</label>
              <input
                type="url"
                value={formData.galleryPortfolioUrl || ''}
                onChange={(e) => onChange({ ...formData, galleryPortfolioUrl: e.target.value })}
                placeholder="https://cliente.pixieset.com/..."
                className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto del botón (opcional)</label>
              <input
                type="text"
                value={formData.galleryPortfolioLabel || ''}
                onChange={(e) => onChange({ ...formData, galleryPortfolioLabel: e.target.value })}
                placeholder="Ver portafolio completo"
                className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-400">Sube o pega URLs. Puedes reordenar las fotos.</p>
            <button
              type="button"
              onClick={addItem}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
            >
              + Añadir imagen
            </button>
          </div>

          {items.map((item, index) => (
            <div key={`gallery-editor-${index}`} className="border rounded-lg p-4 space-y-3 bg-gray-50/80">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-gray-700">Imagen {index + 1}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    className="text-[11px] text-gray-500 hover:text-gray-700 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, 1)}
                    disabled={index === items.length - 1}
                    className="text-[11px] text-gray-500 hover:text-gray-700 disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-[11px] text-red-500 hover:text-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <ImageUrlField
                label="Imagen"
                value={item.imageUrl || ''}
                onChange={(imageUrl) => updateItem(index, 'imageUrl', imageUrl)}
                pageId={pageId}
                pageData={formData}
                uploadFolder={`gallery-${index + 1}`}
                placeholder="https://ejemplo.com/foto.jpg"
                previewClassName="h-16 w-16 object-cover border bg-white rounded"
                previewAlt={`Vista previa imagen ${index + 1}`}
                helperText="Pega una URL o sube una imagen."
              />

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Leyenda (opcional)</label>
                <input
                  type="text"
                  value={item.caption || ''}
                  onChange={(e) => updateItem(index, 'caption', e.target.value)}
                  placeholder="Sala de terapia"
                  className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto alternativo (opcional)</label>
                <input
                  type="text"
                  value={item.alt || ''}
                  onChange={(e) => updateItem(index, 'alt', e.target.value)}
                  placeholder="Descripción breve para accesibilidad"
                  className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          ))}

          <SectionBackgroundEditor
            sectionKey="gallery"
            label="Colores de la galería"
            formData={formData}
            onChange={onChange}
          />
        </>
      )}
    </div>
  );
}
