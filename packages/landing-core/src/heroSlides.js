import { createContentId, normalizeContentId } from './contentIds.js';

export const HERO_BUTTON_POSITIONS = [
  { value: 'center', label: 'Centro (con el texto)' },
  { value: 'top', label: 'Arriba · centrado' },
  { value: 'bottom', label: 'Abajo · centrado' },
  { value: 'top-left', label: 'Esquina superior izquierda' },
  { value: 'top-right', label: 'Esquina superior derecha' },
  { value: 'bottom-left', label: 'Esquina inferior izquierda' },
  { value: 'bottom-right', label: 'Esquina inferior derecha' },
];

const HERO_BUTTON_POSITION_SET = new Set(HERO_BUTTON_POSITIONS.map((item) => item.value));

export function normalizeButtonsPosition(value) {
  return HERO_BUTTON_POSITION_SET.has(value) ? value : 'center';
}

/** Absolute slot for overlays; null means buttons flow under title/text. */
export function getHeroButtonsOverlayClass(position, { clearCarouselDots = false } = {}) {
  const bottomPad = clearCarouselDots ? 'bottom-14 sm:bottom-12' : 'bottom-6';

  switch (normalizeButtonsPosition(position)) {
    case 'top':
      return 'absolute top-6 inset-x-0 z-10 flex justify-center px-5';
    case 'bottom':
      return `absolute ${bottomPad} inset-x-0 z-10 flex justify-center px-5`;
    case 'top-left':
      return 'absolute top-6 left-5 z-10';
    case 'top-right':
      return 'absolute top-6 right-5 z-10';
    case 'bottom-left':
      return `absolute ${bottomPad} left-5 z-10`;
    case 'bottom-right':
      return `absolute ${bottomPad} right-5 z-10`;
    default:
      return null;
  }
}

export function createEmptySlide() {
  return {
    id: createContentId('slide'),
    imageUrl: '',
    videoUrl: '',
    title: '',
    text: '',
    showTitle: false,
    showText: false,
    showButtons: true,
    showGradient: true,
    buttonsPosition: 'center',
  };
}

export function normalizeHeroSlide(slide = {}) {
  return {
    id: normalizeContentId(slide.id, createContentId('slide')),
    imageUrl: slide.imageUrl || slide.imagenUrl || '',
    videoUrl: slide.videoUrl || slide.videoLink || '',
    title: slide.title || '',
    text: slide.text || slide.texto || '',
    showTitle: slide.showTitle ?? Boolean(slide.mostrarTitulo),
    showText: slide.showText ?? Boolean(slide.mostrarTexto),
    showButtons: slide.showButtons ?? slide.mostrarBotones !== false,
    showGradient: (slide.showGradient ?? slide.mostrarDegradado) !== false,
    buttonsPosition: normalizeButtonsPosition(slide.buttonsPosition ?? slide.botonesPosicion),
  };
}

export function normalizeHeroSlides(data) {
  if (Array.isArray(data?.heroSlides) && data.heroSlides.length > 0) {
    return data.heroSlides.map(normalizeHeroSlide);
  }

  const title = String(data?.heroTitle ?? '').trim();
  const text = String(data?.heroSubtitle ?? '').trim();
  const showButtons = data?.heroMostrarBotones !== false;

  if (!title && !text) {
    return [createEmptySlide()];
  }

  return [{
    imageUrl: '',
    title,
    text,
    showTitle: Boolean(title),
    showText: Boolean(text),
    showButtons,
    showGradient: true,
    buttonsPosition: 'center',
  }];
}

export function hydrateFormHeroSlides(formData) {
  const heroSlides = normalizeHeroSlides(formData).map((slide) => ({
    ...slide,
    showButtons: slide.showButtons !== false,
    showGradient: slide.showGradient !== false,
    buttonsPosition: normalizeButtonsPosition(slide.buttonsPosition),
  }));

  return { ...formData, heroSlides };
}
