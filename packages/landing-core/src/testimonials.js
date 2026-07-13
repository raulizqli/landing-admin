
export function createEmptyTestimonial() {
  return {
    title: '',
    quote: '',
    imageUrl: '',
  };
}

export function normalizeTestimonial(item = {}) {
  return {
    title: item.title || item.titulo || '',
    quote: item.quote || item.frase || item.text || item.texto || '',
    imageUrl: item.imageUrl || item.imagenUrl || item.fotoUrl || '',
  };
}

export function normalizeTestimonials(items) {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeTestimonial);
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
