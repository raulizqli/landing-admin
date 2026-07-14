import { useState } from 'react';
import { createEmptySlide, HERO_BUTTON_POSITIONS } from '../utils/heroSlides';
import ImageUrlField from './ImageUrlField';
import SectionBackgroundEditor from './SectionBackgroundEditor';

function SlideEditor({
  slide,
  index,
  open,
  onToggle,
  onChange,
  onRemove,
  pageId,
  formData,
  canRemove,
}) {
  const summary = slide.title?.trim()
    || (slide.imageUrl ? 'Con imagen' : '')
    || (slide.videoUrl ? 'Con video' : '')
    || 'Sin contenido';

  return (
    <div className={`border rounded-lg bg-gray-50/80 overflow-hidden ${open ? 'border-indigo-200' : 'border-gray-200'}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 flex items-center justify-between gap-3 px-4 py-3 text-left min-w-0"
          aria-expanded={open}
        >
          <div className="min-w-0">
            <span className="block text-xs font-semibold text-gray-700">Diapositiva {index + 1}</span>
            <span className="block text-[10px] text-gray-400 truncate">{summary}</span>
          </div>
          <span className="text-gray-400 text-sm shrink-0" aria-hidden>
            {open ? '▾' : '▸'}
          </span>
        </button>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 px-3 py-3 text-[11px] text-red-500 hover:text-red-700"
          >
            Eliminar
          </button>
        )}
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          <ImageUrlField
            label="Imagen de fondo"
            value={slide.imageUrl || ''}
            onChange={(imageUrl) => onChange('imageUrl', imageUrl)}
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
              onChange={(e) => onChange('videoUrl', e.target.value)}
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
              onChange={(e) => onChange('showTitle', e.target.checked)}
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
                onChange={(e) => onChange('title', e.target.value)}
                className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={Boolean(slide.showText)}
              onChange={(e) => onChange('showText', e.target.checked)}
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
                onChange={(e) => onChange('text', e.target.value)}
                className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={slide.showButtons !== false}
              onChange={(e) => onChange('showButtons', e.target.checked)}
              className="rounded border-gray-300"
            />
            Mostrar botones (Contactar / Conocer más)
          </label>

          {slide.showButtons !== false && (
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Posición de los botones</label>
              <select
                value={slide.buttonsPosition || 'center'}
                onChange={(e) => onChange('buttonsPosition', e.target.value)}
                className="w-full border p-2.5 text-xs rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                {HERO_BUTTON_POSITIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={slide.showGradient !== false}
              onChange={(e) => onChange('showGradient', e.target.checked)}
              className="rounded border-gray-300"
            />
            Mostrar degradado sobre la imagen
          </label>
          <p className="text-[10px] text-gray-400 -mt-1">
            Desactívalo en diapositivas solo imagen si no quieres el velo oscuro.
          </p>
        </div>
      )}
    </div>
  );
}

export default function HeroSlidesEditor({ slides = [], onChange, pageId, formData, onFormChange }) {
  const items = slides.length > 0 ? slides : [createEmptySlide()];
  const [openSlides, setOpenSlides] = useState({});

  const isSlideOpen = (index) => openSlides[index] === true;

  const toggleSlide = (index) => {
    setOpenSlides((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const updateSlide = (index, field, value) => {
    onChange(items.map((slide, i) => (i === index ? { ...slide, [field]: value } : slide)));
  };

  const addSlide = () => {
    const nextIndex = items.length;
    onChange([...items, createEmptySlide()]);
    setOpenSlides((prev) => ({ ...prev, [nextIndex]: true }));
  };

  const removeSlide = (index) => {
    if (items.length <= 1) {
      onChange([createEmptySlide()]);
      setOpenSlides({});
      return;
    }
    onChange(items.filter((_, i) => i !== index));
    setOpenSlides((prev) => {
      const next = {};
      Object.entries(prev).forEach(([key, value]) => {
        const i = Number(key);
        if (i < index) next[i] = value;
        if (i > index) next[i - 1] = value;
      });
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-400 uppercase">Especialidad (eyebrow del hero)</label>
        <input
          type="text"
          value={formData?.specialty || ''}
          onChange={(e) => onFormChange?.({ ...formData, specialty: e.target.value })}
          placeholder="Psicología clínica"
          className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
        />
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={formData?.showHeroSpecialty === true}
            onChange={(e) => onFormChange?.({ ...formData, showHeroSpecialty: e.target.checked })}
            className="rounded border-gray-300"
          />
          Mostrar especialidad sobre el carrusel
        </label>
        <p className="text-[10px] text-gray-400">
          Desactívalo si las diapositivas son solo imagen y no quieres la franja tipo «Psicología clínica».
        </p>
      </div>

      <SectionBackgroundEditor
        sectionKey="hero"
        label="Fondo del hero (sin imagen/video)"
        formData={formData}
        onChange={onFormChange}
      />

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

      <div className="space-y-2">
        {items.map((slide, index) => (
          <SlideEditor
            key={`hero-slide-editor-${index}`}
            slide={slide}
            index={index}
            open={isSlideOpen(index)}
            onToggle={() => toggleSlide(index)}
            onChange={(field, value) => updateSlide(index, field, value)}
            onRemove={() => removeSlide(index)}
            pageId={pageId}
            formData={formData}
            canRemove={items.length > 1}
          />
        ))}
      </div>
    </div>
  );
}
