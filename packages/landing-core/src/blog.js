import { createContentId, normalizeContentId } from './contentIds.js';

/** Blog / news block layouts for the landing section. */
export const BLOG_LAYOUTS = [
  {
    value: 'title_text',
    label: 'Título + texto largo',
    description: 'Entrada editorial solo con título y cuerpo.',
    usesTitle: true,
    usesText: true,
    usesImage: false,
  },
  {
    value: 'title_text_image_left',
    label: 'Título + texto + imagen izquierda',
    description: 'Imagen a la izquierda, título y texto a la derecha.',
    usesTitle: true,
    usesText: true,
    usesImage: true,
  },
  {
    value: 'title_image_right_text',
    label: 'Título + imagen derecha + texto',
    description: 'Título y texto a la izquierda, imagen a la derecha.',
    usesTitle: true,
    usesText: true,
    usesImage: true,
  },
  {
    value: 'title_image',
    label: 'Título + imagen',
    description: 'Título sobre o junto a una imagen destacada.',
    usesTitle: true,
    usesText: false,
    usesImage: true,
  },
  {
    value: 'image_only',
    label: 'Solo imagen',
    description: 'Bloque visual a ancho completo.',
    usesTitle: false,
    usesText: false,
    usesImage: true,
  },
];

const LAYOUT_VALUES = new Set(BLOG_LAYOUTS.map((item) => item.value));
const LAYOUT_META = Object.fromEntries(BLOG_LAYOUTS.map((item) => [item.value, item]));

export function normalizeBlogLayout(value) {
  const layout = String(value ?? '').trim();
  return LAYOUT_VALUES.has(layout) ? layout : 'title_text';
}

export function getBlogLayoutMeta(layout) {
  return LAYOUT_META[normalizeBlogLayout(layout)] || LAYOUT_META.title_text;
}

export function createEmptyBlogPost(layout = 'title_text') {
  return {
    id: createContentId('post'),
    layout: normalizeBlogLayout(layout),
    title: '',
    text: '',
    imageUrl: '',
    imageAlt: '',
  };
}

export function normalizeBlogPost(item = {}) {
  return {
    id: normalizeContentId(item.id, createContentId('post')),
    layout: normalizeBlogLayout(item.layout || item.tipo || item.blockType),
    title: String(item.title || item.titulo || '').trim(),
    text: String(item.text || item.texto || item.body || '').trim(),
    imageUrl: String(item.imageUrl || item.imagenUrl || '').trim(),
    imageAlt: String(item.imageAlt || item.alt || item.textoAlt || '').trim(),
  };
}

export function normalizeBlogPosts(items) {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeBlogPost);
}

export function isBlogPostVisible(item = {}) {
  const post = normalizeBlogPost(item);

  switch (post.layout) {
    case 'image_only':
      return Boolean(post.imageUrl);
    case 'title_image':
      return Boolean(post.imageUrl);
    case 'title_text_image_left':
    case 'title_image_right_text':
      return Boolean(post.imageUrl && (post.title || post.text));
    case 'title_text':
    default:
      return Boolean(post.title || post.text);
  }
}

export function getVisibleBlogPosts(data) {
  return normalizeBlogPosts(data?.blogPosts).filter(isBlogPostVisible);
}

export function shouldShowBlogSection(data) {
  if (!data?.blogSectionEnabled) return false;
  return getVisibleBlogPosts(data).length > 0;
}

export function splitBlogText(text) {
  return String(text ?? '')
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
