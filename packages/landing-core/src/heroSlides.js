import { createContentId, normalizeContentId } from './contentIds.js';
import { SECTION_IDS } from './sectionAnchors.js';
import { parseColorToHex } from './sectionBackground.js';

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

export const HERO_IMAGE_FITS = [
  { value: 'full', label: 'Completa', hint: 'Se ve toda la imagen, sin recortar.' },
  { value: 'centred', label: 'Centrada', hint: 'Resolución original, centrada en el recuadro.' },
  { value: 'fill', label: 'Rellenar', hint: 'Cubre todo el recuadro; puede recortar bordes.' },
];

export const DEFAULT_HERO_IMAGE_FIT = 'full';

const HERO_IMAGE_FIT_SET = new Set(HERO_IMAGE_FITS.map((item) => item.value));

export const HERO_HEIGHT_MODES = [
  { value: 'fixed', label: 'Fija', hint: 'Misma altura en todas las pantallas. La foto se recorta o se contiene dentro del recuadro.' },
  { value: 'auto', label: 'Según la imagen', hint: 'El bloque crece o se encoge para mostrar la foto completa.' },
];

export const DEFAULT_HERO_HEIGHT_MODE = 'fixed';

const HERO_HEIGHT_MODE_SET = new Set(HERO_HEIGHT_MODES.map((item) => item.value));

export function normalizeHeroHeightMode(value, fallback = DEFAULT_HERO_HEIGHT_MODE) {
  return HERO_HEIGHT_MODE_SET.has(value) ? value : fallback;
}

export const HERO_IMAGE_VIEWS = [
  { value: 'desktop', field: 'imageUrl', label: 'Escritorio', hint: 'Pantallas grandes. Es la imagen principal.' },
  { value: 'tablet', field: 'tabletImageUrl', label: 'Tablet', hint: 'Opcional. Si está vacía, se usa la de escritorio.' },
  { value: 'mobile', field: 'mobileImageUrl', label: 'Móvil', hint: 'Opcional. Si está vacía, se usa tablet o escritorio.' },
];

export const HERO_IMAGE_MOBILE_MAX_WIDTH = 639;
export const HERO_IMAGE_TABLET_MAX_WIDTH = 1023;

export function normalizeHeroImageFit(value, fallback = DEFAULT_HERO_IMAGE_FIT) {
  if (value === 'centered') return 'centred';
  return HERO_IMAGE_FIT_SET.has(value) ? value : fallback;
}

export function resolveHeroSlideImageUrl(slide = {}, viewport = 'desktop') {
  const desktop = String(slide.imageUrl ?? '').trim();
  const tablet = String(slide.tabletImageUrl ?? '').trim();
  const mobile = String(slide.mobileImageUrl ?? '').trim();
  if (viewport === 'mobile') return mobile || tablet || desktop;
  if (viewport === 'tablet') return tablet || desktop;
  return desktop;
}

export function hasHeroSlideImage(slide = {}) {
  return Boolean(
    resolveHeroSlideImageUrl(slide, 'desktop')
    || String(slide.tabletImageUrl ?? '').trim()
    || String(slide.mobileImageUrl ?? '').trim(),
  );
}

export function shouldUseFluidHeroHeight(data, slides = []) {
  if (normalizeHeroHeightMode(data?.heroHeightMode) !== 'auto') return false;
  const list = Array.isArray(slides) ? slides : [];
  return list.some(hasHeroSlideImage);
}

export function getHeroImageFitClass(fit, fallback = DEFAULT_HERO_IMAGE_FIT) {
  switch (normalizeHeroImageFit(fit, fallback)) {
    case 'centred':
      return 'object-none object-center';
    case 'fill':
      return 'object-cover object-center';
    default:
      return 'object-contain object-center';
  }
}

export const DEFAULT_HERO_BUTTONS_MODE = 'preset';
export const DEFAULT_HERO_BUTTON_SECTION = SECTION_IDS.contact;

export const HERO_BUTTONS_MODES = [
  { value: 'preset', label: 'Predefinidos', hint: 'Contactar y Conocer más.' },
  { value: 'custom', label: 'Personalizado', hint: 'Un botón con el texto que elijas, hacia una sección.' },
];

const HERO_BUTTONS_MODE_SET = new Set(HERO_BUTTONS_MODES.map((item) => item.value));

export const HERO_BUTTON_SECTIONS = [
  { value: SECTION_IDS.about, label: 'Acerca de' },
  { value: SECTION_IDS.services, label: 'Servicios' },
  { value: SECTION_IDS.catalog, label: 'Catálogo' },
  { value: SECTION_IDS.gallery, label: 'Galería' },
  { value: SECTION_IDS.video, label: 'Video' },
  { value: SECTION_IDS.testimonials, label: 'Testimonios' },
  { value: SECTION_IDS.blog, label: 'Blog / noticias' },
  { value: SECTION_IDS.contact, label: 'Contacto' },
  { value: SECTION_IDS.social, label: 'Redes sociales' },
];

const HERO_BUTTON_SECTION_SET = new Set(HERO_BUTTON_SECTIONS.map((item) => item.value));

export function normalizeHeroButtonsMode(value) {
  return HERO_BUTTONS_MODE_SET.has(value) ? value : DEFAULT_HERO_BUTTONS_MODE;
}

export const DEFAULT_HERO_TEXT_COLOR = '#FFFFFF';
export const DEFAULT_HERO_BUTTON_BG_COLOR = '#4A5D4E';
export const DEFAULT_HERO_BUTTON_TEXT_COLOR = '#FFFFFF';
export const DEFAULT_HERO_BUTTON_OUTLINE_COLOR = '#FFFFFF';

function normalizeOptionalColor(value, fallback) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  return parseColorToHex(raw, fallback);
}

export function resolveHeroSlideTextColor(slide = {}) {
  const custom = normalizeOptionalColor(slide.textColor, DEFAULT_HERO_TEXT_COLOR);
  return custom || DEFAULT_HERO_TEXT_COLOR;
}

export function resolveHeroSlideButtonColors(slide = {}) {
  return {
    buttonBgColor: normalizeOptionalColor(slide.buttonBgColor, DEFAULT_HERO_BUTTON_BG_COLOR)
      || DEFAULT_HERO_BUTTON_BG_COLOR,
    buttonTextColor: normalizeOptionalColor(slide.buttonTextColor, DEFAULT_HERO_BUTTON_TEXT_COLOR)
      || DEFAULT_HERO_BUTTON_TEXT_COLOR,
    buttonOutlineColor: normalizeOptionalColor(slide.buttonOutlineColor, DEFAULT_HERO_BUTTON_OUTLINE_COLOR)
      || DEFAULT_HERO_BUTTON_OUTLINE_COLOR,
  };
}

export function resolveHeroSlideSpecialtyColor(slide = {}) {
  const custom = normalizeOptionalColor(slide.textColor, DEFAULT_HERO_TEXT_COLOR);
  return custom || DEFAULT_HERO_TEXT_COLOR;
}

export function normalizeHeroButtonSection(value) {
  return HERO_BUTTON_SECTION_SET.has(value) ? value : DEFAULT_HERO_BUTTON_SECTION;
}

export function normalizeButtonsPosition(value) {
  return HERO_BUTTON_POSITION_SET.has(value) ? value : 'center';
}

/** Absolute slot for overlays; null means buttons flow under title/text. */
export function getHeroButtonsOverlayClass(position, { clearCarouselDots = false } = {}) {
  switch (normalizeButtonsPosition(position)) {
    case 'top':
      return 'absolute top-8 sm:top-12 inset-x-0 z-20 flex justify-center px-5';
    case 'bottom':
      return clearCarouselDots
        ? 'absolute bottom-20 sm:bottom-24 inset-x-0 z-20 flex justify-center px-5'
        : 'absolute bottom-8 sm:bottom-12 inset-x-0 z-20 flex justify-center px-5';
    case 'top-left':
      return 'absolute top-8 sm:top-12 left-5 sm:left-8 z-20';
    case 'top-right':
      return 'absolute top-8 sm:top-12 right-5 sm:right-8 z-20';
    case 'bottom-left':
      return clearCarouselDots
        ? 'absolute bottom-20 sm:bottom-24 left-5 sm:left-8 z-20'
        : 'absolute bottom-8 sm:bottom-12 left-5 sm:left-8 z-20';
    case 'bottom-right':
      return clearCarouselDots
        ? 'absolute bottom-20 sm:bottom-24 right-5 sm:right-8 z-20'
        : 'absolute bottom-8 sm:bottom-12 right-5 sm:right-8 z-20';
    default:
      return null;
  }
}

export function createEmptySlide() {
  return {
    id: createContentId('slide'),
    imageUrl: '',
    tabletImageUrl: '',
    mobileImageUrl: '',
    imageFit: DEFAULT_HERO_IMAGE_FIT,
    videoUrl: '',
    title: '',
    text: '',
    showTitle: false,
    showText: false,
    showButtons: true,
    buttonsMode: DEFAULT_HERO_BUTTONS_MODE,
    customButtonLabel: '',
    customButtonSection: DEFAULT_HERO_BUTTON_SECTION,
    showGradient: true,
    buttonsPosition: 'center',
    textColor: '',
    buttonBgColor: '',
    buttonTextColor: '',
    buttonOutlineColor: '',
  };
}

export function normalizeHeroSlide(slide = {}, index = 0) {
  const imageUrl = slide.imageUrl || slide.imagenUrl || '';
  const hasLegacyImage = Boolean(String(imageUrl).trim()) && slide.imageFit == null;
  return {
    id: normalizeContentId(slide.id, `slide-${index + 1}`),
    imageUrl,
    tabletImageUrl: String(slide.tabletImageUrl ?? '').trim(),
    mobileImageUrl: String(slide.mobileImageUrl ?? '').trim(),
    imageFit: normalizeHeroImageFit(slide.imageFit, hasLegacyImage ? 'fill' : DEFAULT_HERO_IMAGE_FIT),
    videoUrl: slide.videoUrl || slide.videoLink || '',
    title: slide.title || '',
    text: slide.text || slide.texto || '',
    showTitle: slide.showTitle ?? Boolean(slide.mostrarTitulo),
    showText: slide.showText ?? Boolean(slide.mostrarTexto),
    showButtons: slide.showButtons ?? slide.mostrarBotones !== false,
    buttonsMode: normalizeHeroButtonsMode(slide.buttonsMode),
    customButtonLabel: String(slide.customButtonLabel ?? '').trim(),
    customButtonSection: normalizeHeroButtonSection(slide.customButtonSection),
    showGradient: (slide.showGradient ?? slide.mostrarDegradado) !== false,
    buttonsPosition: normalizeButtonsPosition(slide.buttonsPosition ?? slide.botonesPosicion),
    textColor: normalizeOptionalColor(slide.textColor, DEFAULT_HERO_TEXT_COLOR),
    buttonBgColor: normalizeOptionalColor(slide.buttonBgColor, DEFAULT_HERO_BUTTON_BG_COLOR),
    buttonTextColor: normalizeOptionalColor(slide.buttonTextColor, DEFAULT_HERO_BUTTON_TEXT_COLOR),
    buttonOutlineColor: normalizeOptionalColor(slide.buttonOutlineColor, DEFAULT_HERO_BUTTON_OUTLINE_COLOR),
  };
}

export function normalizeHeroSlides(data) {
  if (Array.isArray(data?.heroSlides) && data.heroSlides.length > 0) {
    return data.heroSlides.map((slide, index) => normalizeHeroSlide(slide, index));
  }

  const title = String(data?.heroTitle ?? '').trim();
  const text = String(data?.heroSubtitle ?? '').trim();
  const showButtons = data?.heroMostrarBotones !== false;

  if (!title && !text) {
    return [createEmptySlide()];
  }

  return [normalizeHeroSlide({
    imageUrl: '',
    tabletImageUrl: '',
    mobileImageUrl: '',
    imageFit: DEFAULT_HERO_IMAGE_FIT,
    title,
    text,
    showTitle: Boolean(title),
    showText: Boolean(text),
    showButtons,
    buttonsMode: DEFAULT_HERO_BUTTONS_MODE,
    customButtonLabel: '',
    customButtonSection: DEFAULT_HERO_BUTTON_SECTION,
    showGradient: true,
    buttonsPosition: 'center',
  }, 0)];
}

export function hydrateFormHeroSlides(formData) {
  const heroSlides = normalizeHeroSlides(formData).map((slide) => ({
    ...slide,
    tabletImageUrl: String(slide.tabletImageUrl ?? '').trim(),
    mobileImageUrl: String(slide.mobileImageUrl ?? '').trim(),
    imageFit: normalizeHeroImageFit(slide.imageFit, DEFAULT_HERO_IMAGE_FIT),
    showButtons: slide.showButtons !== false,
    buttonsMode: normalizeHeroButtonsMode(slide.buttonsMode),
    customButtonLabel: String(slide.customButtonLabel ?? '').trim(),
    customButtonSection: normalizeHeroButtonSection(slide.customButtonSection),
    showGradient: slide.showGradient !== false,
    buttonsPosition: normalizeButtonsPosition(slide.buttonsPosition),
    textColor: normalizeOptionalColor(slide.textColor, DEFAULT_HERO_TEXT_COLOR),
    buttonBgColor: normalizeOptionalColor(slide.buttonBgColor, DEFAULT_HERO_BUTTON_BG_COLOR),
    buttonTextColor: normalizeOptionalColor(slide.buttonTextColor, DEFAULT_HERO_BUTTON_TEXT_COLOR),
    buttonOutlineColor: normalizeOptionalColor(slide.buttonOutlineColor, DEFAULT_HERO_BUTTON_OUTLINE_COLOR),
  }));

  return { ...formData, heroSlides };
}
