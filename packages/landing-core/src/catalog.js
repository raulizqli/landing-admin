
import { createContentId, normalizeContentId } from './contentIds.js';

export function createEmptyCatalogItem() {
  return {
    id: createContentId('catalog'),
    title: '',
    description: '',
    imageUrl: '',
    price: '',
    link: '',
  };
}

export function normalizeCatalogItem(item = {}) {
  return {
    id: normalizeContentId(item.id, createContentId('catalog')),
    title: item.title || item.titulo || item.name || '',
    description: item.description || item.descripcion || item.text || item.texto || '',
    imageUrl: item.imageUrl || item.imagenUrl || '',
    price: item.price || item.precio || '',
    link: item.link || item.enlace || item.url || '',
  };
}

export function normalizeCatalogItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeCatalogItem);
}

export function getVisibleCatalogItems(data) {
  return normalizeCatalogItems(data?.catalogItems).filter((item) => (
    String(item.title ?? '').trim()
    || String(item.imageUrl ?? '').trim()
    || String(item.description ?? '').trim()
  ));
}

export function shouldShowCatalogSection(data) {
  if (!data?.catalogSectionEnabled) return false;
  return getVisibleCatalogItems(data).length > 0;
}

export function splitCatalogSectionText(text) {
  return String(text ?? '')
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function normalizeExternalLink(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function resolveCatalogItemLink(item) {
  const href = normalizeExternalLink(item?.link);
  if (!href) return null;
  return {
    href,
    external: true,
  };
}
