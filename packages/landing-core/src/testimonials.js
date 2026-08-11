
import { createContentId, normalizeContentId } from './contentIds.js';

export function createEmptyTestimonial() {
  return {
    id: createContentId('testimonial'),
    title: '',
    quote: '',
    imageUrl: '',
  };
}

export function normalizeTestimonial(item = {}, index = 0) {
  return {
    id: normalizeContentId(item.id, `testimonial-${index + 1}`),
    title: item.title || item.titulo || '',
    quote: item.quote || item.frase || item.text || item.texto || '',
    imageUrl: item.imageUrl || item.imagenUrl || item.fotoUrl || '',
  };
}

export function normalizeTestimonials(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => normalizeTestimonial(item, index));
}

export function getVisibleTestimonials(data) {
  return normalizeTestimonials(data?.testimonials).filter((item) => (
    String(item.quote ?? '').trim()
  ));
}

export function shouldShowTestimonialsSection(data) {
  if (!data?.testimonialsEnabled) return false;
  return getVisibleTestimonials(data).length > 0;
}
