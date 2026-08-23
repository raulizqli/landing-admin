import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createEmptySlide,
  DEFAULT_HERO_IMAGE_FIT,
  getHeroImageFitClass,
  hasHeroSlideImage,
  HERO_BUTTON_POSITIONS,
  HERO_BUTTON_SECTIONS,
  HERO_BUTTONS_MODES,
  HERO_HEIGHT_MODES,
  HERO_IMAGE_FITS,
  HERO_IMAGE_VIEWS,
  normalizeHeroButtonsMode,
  normalizeHeroHeightMode,
  normalizeHeroImageFit,
} from '../utils/heroSlides';
import ImageUrlField from './ImageUrlField';
import SectionBackgroundEditor, { ColorField } from './SectionBackgroundEditor';
import AiAssistButton from './AiAssistButton';
import { BRAND_COLOR_PRESETS, TEXT_COLOR_PRESETS } from '../utils/sectionBackground';
import {
  DEFAULT_HERO_BUTTON_BG_COLOR,
  DEFAULT_HERO_BUTTON_OUTLINE_COLOR,
  DEFAULT_HERO_BUTTON_TEXT_COLOR,
  DEFAULT_HERO_TEXT_COLOR,
} from '../utils/heroSlides';
import { useLocale } from '../i18n/LocaleContext';
import { HERO_SLIDE_IMAGE_MAX_BYTES } from '../utils/uploadImage';

function formatSlideCurrentValue(slide) {
  const title = String(slide?.title ?? '').trim();
  const text = String(slide?.text ?? '').trim();
  if (title && text) return `Título: ${title}\nTexto: ${text}`;
  return title || text || '';
}

function SlideColorReset({ field, onChange, defaultLabel }) {
  return (
    <button
      type="button"
      onClick={() => onChange(field, '')}
      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
    >
      Restablecer ({defaultLabel})
    </button>
  );
}

function SlideEditor({
  slide,
  index,
  open,
  selected,
  onToggle,
  onSelect,
  onChange,
  onRemove,
  pageId,
  formData,
  canRemove,
}) {
  const [imageView, setImageView] = useState('desktop');
  const activeView = HERO_IMAGE_VIEWS.find((view) => view.value === imageView) || HERO_IMAGE_VIEWS[0];
  const imageFit = normalizeHeroImageFit(slide.imageFit, DEFAULT_HERO_IMAGE_FIT);
  const activeFit = HERO_IMAGE_FITS.find((item) => item.value === imageFit) || HERO_IMAGE_FITS[0];
  const summary = slide.title?.trim()
    || (hasHeroSlideImage(slide) ? 'Con imagen' : '')
    || (slide.videoUrl ? 'Con video' : '')
    || 'Sin contenido';

  return (
    <div className={`border rounded-lg bg-gray-50/80 overflow-hidden ${
      open ? 'border-indigo-200' : selected ? 'border-indigo-300' : 'border-gray-200'
    }`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            onSelect?.();
            onToggle();
          }}
          className="flex-1 flex items-center justify-between gap-3 px-4 py-3 text-left min-w-0"
          aria-expanded={open}
        >
          <div className="min-w-0">
            <span className="block text-xs font-semibold text-gray-700">
              Diapositiva {index + 1}
              {selected && (
                <span className="ml-1.5 text-[10px] font-bold uppercase text-indigo-500">
                  · seleccionada
                </span>
              )}
            </span>
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
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">
              Visualización de la imagen
            </label>
            <div className="grid grid-cols-3 gap-1">
              {HERO_IMAGE_FITS.map((option) => {
                const selectedFit = imageFit === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange('imageFit', option.value)}
                    className={`px-2 py-2 rounded-lg border text-[11px] font-semibold ${
                      selectedFit
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400">{activeFit.hint}</p>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">
              Imagen por dispositivo
            </label>
            <div className="flex gap-1">
              {HERO_IMAGE_VIEWS.map((view) => {
                const selectedView = imageView === view.value;
                const hasImage = Boolean(String(slide[view.field] ?? '').trim());
                return (
                  <button
                    key={view.value}
                    type="button"
                    onClick={() => setImageView(view.value)}
                    className={`flex-1 px-2 py-1.5 rounded-lg border text-[11px] font-semibold ${
                      selectedView
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200'
                    }`}
                  >
                    {view.label}
                    {hasImage ? (
                      <span className="ml-1 text-[9px] text-emerald-600">●</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <ImageUrlField
              label={activeView.label}
              value={slide[activeView.field] || ''}
              onChange={(url) => onChange(activeView.field, url)}
              pageId={pageId}
              pageData={formData}
              uploadFolder={`hero-slide-${index + 1}-${activeView.value}`}
              placeholder="https://ejemplo.com/imagen.jpg"
              previewClassName={`h-20 w-full max-w-[240px] border bg-[#F4F1EA] rounded ${getHeroImageFitClass(imageFit)}`}
              previewAlt={`Vista previa ${activeView.label.toLowerCase()} diapositiva ${index + 1}`}
              helperText={`${activeView.hint} Se guarda a resolución original (máx. 15 MB).`}
              maxBytes={HERO_SLIDE_IMAGE_MAX_BYTES}
            />
          </div>

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
            Mostrar botones
          </label>

          {slide.showButtons !== false && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Tipo de botones</label>
                <div className="grid grid-cols-2 gap-1">
                  {HERO_BUTTONS_MODES.map((option) => {
                    const selectedMode = normalizeHeroButtonsMode(slide.buttonsMode) === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange('buttonsMode', option.value)}
                        className={`px-2 py-2 rounded-lg border text-[11px] font-semibold ${
                          selectedMode
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-gray-400">
                  {(HERO_BUTTONS_MODES.find((item) => item.value === normalizeHeroButtonsMode(slide.buttonsMode))
                    || HERO_BUTTONS_MODES[0]).hint}
                </p>
              </div>

              {normalizeHeroButtonsMode(slide.buttonsMode) === 'custom' && (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto del botón</label>
                    <input
                      type="text"
                      value={slide.customButtonLabel || ''}
                      onChange={(e) => onChange('customButtonLabel', e.target.value)}
                      placeholder="Agendar cita"
                      className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Ir a la sección</label>
                    <select
                      value={slide.customButtonSection || 'contact'}
                      onChange={(e) => onChange('customButtonSection', e.target.value)}
                      className="w-full border p-2.5 text-xs rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                    >
                      {HERO_BUTTON_SECTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-gray-400">
                      El botón lleva a esa sección de la misma página.
                    </p>
                  </div>
                </div>
              )}

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
            </div>
          )}

          {(slide.showTitle || slide.showText || slide.showButtons !== false) && (
            <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Colores de esta diapositiva</p>

              {(slide.showTitle || slide.showText) && (
                <div className="space-y-1">
                  <ColorField
                    label="Color del texto"
                    value={slide.textColor || DEFAULT_HERO_TEXT_COLOR}
                    onChange={(value) => onChange('textColor', value)}
                    presets={[
                      { value: DEFAULT_HERO_TEXT_COLOR, label: 'Blanco' },
                      ...TEXT_COLOR_PRESETS,
                    ]}
                  />
                  {slide.textColor ? (
                    <SlideColorReset
                      field="textColor"
                      onChange={onChange}
                      defaultLabel={DEFAULT_HERO_TEXT_COLOR}
                    />
                  ) : null}
                </div>
              )}

              {slide.showButtons !== false && (
                <>
                  <div className="space-y-1">
                    <ColorField
                      label="Fondo del botón principal"
                      value={slide.buttonBgColor || DEFAULT_HERO_BUTTON_BG_COLOR}
                      onChange={(value) => onChange('buttonBgColor', value)}
                      presets={BRAND_COLOR_PRESETS}
                    />
                    {slide.buttonBgColor ? (
                      <SlideColorReset
                        field="buttonBgColor"
                        onChange={onChange}
                        defaultLabel={DEFAULT_HERO_BUTTON_BG_COLOR}
                      />
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <ColorField
                      label="Texto del botón principal"
                      value={slide.buttonTextColor || DEFAULT_HERO_BUTTON_TEXT_COLOR}
                      onChange={(value) => onChange('buttonTextColor', value)}
                      presets={[
                        { value: DEFAULT_HERO_BUTTON_TEXT_COLOR, label: 'Blanco' },
                        ...TEXT_COLOR_PRESETS,
                      ]}
                    />
                    {slide.buttonTextColor ? (
                      <SlideColorReset
                        field="buttonTextColor"
                        onChange={onChange}
                        defaultLabel={DEFAULT_HERO_BUTTON_TEXT_COLOR}
                      />
                    ) : null}
                  </div>
                  {normalizeHeroButtonsMode(slide.buttonsMode) === 'preset' && (
                    <div className="space-y-1">
                      <ColorField
                        label="Color del botón secundario (borde y texto)"
                        value={slide.buttonOutlineColor || DEFAULT_HERO_BUTTON_OUTLINE_COLOR}
                        onChange={(value) => onChange('buttonOutlineColor', value)}
                        presets={[
                          { value: DEFAULT_HERO_BUTTON_OUTLINE_COLOR, label: 'Blanco' },
                          ...TEXT_COLOR_PRESETS,
                        ]}
                      />
                      {slide.buttonOutlineColor ? (
                        <SlideColorReset
                          field="buttonOutlineColor"
                          onChange={onChange}
                          defaultLabel={DEFAULT_HERO_BUTTON_OUTLINE_COLOR}
                        />
                      ) : null}
                    </div>
                  )}
                </>
              )}
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

export default function HeroSlidesEditor({
  slides = [],
  onChange,
  pageId,
  formData,
  onFormChange,
  onActiveSlideChange,
}) {
  const { t } = useLocale();
  const items = slides.length > 0 ? slides : [createEmptySlide()];
  const [openSlides, setOpenSlides] = useState({});
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const prevSlideCountRef = useRef(items.length);

  const isSlideOpen = (index) => openSlides[index] === true;

  useEffect(() => {
    if (items.length > prevSlideCountRef.current) {
      const newIndex = items.length - 1;
      setSelectedSlideIndex(newIndex);
      setOpenSlides((prev) => ({ ...prev, [newIndex]: true }));
    }
    prevSlideCountRef.current = items.length;
  }, [items.length]);

  useEffect(() => {
    if (selectedSlideIndex >= items.length) {
      setSelectedSlideIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, selectedSlideIndex]);

  useEffect(() => {
    onActiveSlideChange?.(selectedSlideIndex);
  }, [selectedSlideIndex, onActiveSlideChange]);

  const selectedSlide = items[selectedSlideIndex] || items[0];

  const heroAiMenu = useMemo(() => [
    {
      action: 'hero_suggest',
      labelKey: 'ai.hero.editSlide',
      fieldPath: `heroSlides[${selectedSlideIndex}]`,
      currentValue: formatSlideCurrentValue(selectedSlide),
    },
    {
      action: 'hero_suggest',
      labelKey: 'ai.hero.addSlide',
      fieldPath: 'heroSlides[+]',
      currentValue: '',
    },
  ], [selectedSlide, selectedSlideIndex]);

  const toggleSlide = (index) => {
    setSelectedSlideIndex(index);
    setOpenSlides((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const updateSlide = (index, field, value) => {
    onChange(items.map((slide, i) => (i === index ? { ...slide, [field]: value } : slide)));
  };

  const addSlide = () => {
    const nextIndex = items.length;
    onChange([...items, createEmptySlide()]);
    setSelectedSlideIndex(nextIndex);
    setOpenSlides((prev) => ({ ...prev, [nextIndex]: true }));
  };

  const removeSlide = (index) => {
    if (items.length <= 1) {
      onChange([createEmptySlide()]);
      setOpenSlides({});
      setSelectedSlideIndex(0);
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
    setSelectedSlideIndex((prev) => {
      if (prev === index) return Math.max(0, index - 1);
      if (prev > index) return prev - 1;
      return prev;
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-400 uppercase">Especialidad (texto corto sobre el carrusel)</label>
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

      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-400 uppercase">
          Altura del carrusel
        </label>
        <div className="grid grid-cols-2 gap-1">
          {HERO_HEIGHT_MODES.map((option) => {
            const selectedHeight = normalizeHeroHeightMode(formData?.heroHeightMode) === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onFormChange?.({ ...formData, heroHeightMode: option.value })}
                className={`px-2 py-2 rounded-lg border text-[11px] font-semibold ${
                  selectedHeight
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-gray-400">
          {(HERO_HEIGHT_MODES.find((item) => item.value === normalizeHeroHeightMode(formData?.heroHeightMode))
            || HERO_HEIGHT_MODES[0]).hint}
        </p>
      </div>

      <SectionBackgroundEditor
        sectionKey="hero"
        label="Fondo del carrusel (sin imagen/video)"
        formData={formData}
        onChange={onFormChange}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase">Diapositivas</label>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {t('ai.hero.selectedSlide', { n: selectedSlideIndex + 1 })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onFormChange && (
            <AiAssistButton
              formData={formData}
              onChange={onFormChange}
              pageId={pageId}
              action="hero_suggest"
              fieldPath={`heroSlides[${selectedSlideIndex}]`}
              currentValue={formatSlideCurrentValue(selectedSlide)}
              label="✨ LeftSide AI"
              showLiteMenu={false}
              customMenu={heroAiMenu}
              workingTaskLabel={t('ai.workingHero')}
            />
          )}
          <button
            type="button"
            onClick={addSlide}
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
          >
            + Añadir diapositiva
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((slide, index) => (
          <SlideEditor
            key={slide.id || `hero-slide-editor-${index}`}
            slide={slide}
            index={index}
            open={isSlideOpen(index)}
            selected={index === selectedSlideIndex}
            onToggle={() => toggleSlide(index)}
            onSelect={() => setSelectedSlideIndex(index)}
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
