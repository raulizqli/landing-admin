
import { normalizeHeroSlide } from './pageModel';

export function createEmptySlide() {
  return {
    imageUrl: '',
    videoUrl: '',
    title: '',
    text: '',
    showTitle: false,
    showText: false,
    showButtons: true,
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
  }];
}

export function hydrateFormHeroSlides(formData) {
  const heroSlides = normalizeHeroSlides(formData).map((slide) => ({
    ...slide,
    showButtons: slide.showButtons !== false,
  }));

  return { ...formData, heroSlides };
}
