
export function createEmptyGalleryItem() {
  return {
    imageUrl: '',
    caption: '',
    alt: '',
  };
}

export function normalizeGalleryItem(item = {}) {
  return {
    imageUrl: String(item.imageUrl || item.imagenUrl || '').trim(),
    caption: String(item.caption || item.leyenda || item.title || item.titulo || '').trim(),
    alt: String(item.alt || item.textoAlt || '').trim(),
  };
}

export function normalizeGalleryItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeGalleryItem);
}

export function getVisibleGalleryItems(data) {
  return normalizeGalleryItems(data?.galleryItems).filter((item) => Boolean(item.imageUrl));
}

export function shouldShowGallerySection(data) {
  if (!data?.gallerySectionEnabled) return false;
  return getVisibleGalleryItems(data).length > 0;
}

export function getGalleryPortfolioUrl(data) {
  return String(data?.galleryPortfolioUrl ?? '').trim();
}

export function splitGallerySectionText(text) {
  return String(text ?? '')
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
