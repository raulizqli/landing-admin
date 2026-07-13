import { createEmptySlide } from '../utils/heroSlides';
import ImageUrlField from './ImageUrlField';

export default function HeroSlidesEditor({ slides = [], onChange, pageId, formData }) {
  const items = slides.length > 0 ? slides : [createEmptySlide()];

  const updateSlide = (index, field, value) => {
    onChange(items.map((slide, i) => (i === index ? { ...slide, [field]: value } : slide)));
  };

  const addSlide = () => {
    onChange([...items, createEmptySlide()]);
  };

  const removeSlide = (index) => {
    if (items.length <= 1) {
      onChange([createEmptySlide()]);
      return;
    }
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-bold text-gray-400 uppercase">Carrusel Hero</label>
        <button
          type="button"
          onClick={addSlide}
          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
        >
          + Añadir diapositiva
        </button>
      </div>

      {items.map((slide, index) => (
        <div key={`hero-slide-editor-${index}`} className="border rounded-lg p-4 space-y-3 bg-gray-50/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Diapositiva {index + 1}</span>
            <button
              type="button"
              onClick={() => removeSlide(index)}
              className="text-[11px] text-red-500 hover:text-red-700"
            >
              Eliminar
            </button>
          </div>

          <ImageUrlField
            label="Imagen de fondo"
            value={slide.imageUrl || ''}
            onChange={(imageUrl) => updateSlide(index, 'imageUrl', imageUrl)}
            pageId={pageId}
            pageData={formData}
            uploadFolder={`hero-slide-${index + 1}`}
            placeholder="https://ejemplo.com/imagen.jpg"
            previewClassName="h-14 w-24 object-cover border bg-white rounded"
            previewAlt={`Vista previa diapositiva ${index + 1}`}
            helperText="Pega una URL o sube una imagen. Se usa como fondo o como respaldo si hay video."
          />

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Video (opcional)</label>
            <input
              type="url"
              value={slide.videoUrl || ''}
              onChange={(e) => updateSlide(index, 'videoUrl', e.target.value)}
              placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
            />
            <p className="text-[10px] text-gray-400">
              YouTube, Vimeo o archivo directo (.mp4). Se reproduce en bucle sin sonido como fondo de la diapositiva.
            </p>
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={Boolean(slide.showTitle)}
              onChange={(e) => updateSlide(index, 'showTitle', e.target.checked)}
              className="rounded border-gray-300"
            />
            Mostrar título
          </label>

          {slide.showTitle && (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Título</label>
              <textarea
                rows="2"
                value={slide.title || ''}
                onChange={(e) => updateSlide(index, 'title', e.target.value)}
                className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={Boolean(slide.showText)}
              onChange={(e) => updateSlide(index, 'showText', e.target.checked)}
              className="rounded border-gray-300"
            />
            Mostrar texto
          </label>

          {slide.showText && (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto</label>
              <textarea
                rows="3"
                value={slide.text || ''}
                onChange={(e) => updateSlide(index, 'text', e.target.value)}
                className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={slide.showButtons !== false}
              onChange={(e) => updateSlide(index, 'showButtons', e.target.checked)}
              className="rounded border-gray-300"
            />
            Mostrar botones (Contactar / Conocer más)
          </label>
        </div>
      ))}
    </div>
  );
}
