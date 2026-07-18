import { createContentId, normalizeContentId } from './contentIds.js';

export const SERVICE_ITEM_LAYOUTS = [
  {
    value: 'title',
    label: 'Solo título',
    fields: { description: false, list: false },
  },
  {
    value: 'title_description',
    label: 'Título + descripción',
    fields: { description: true, list: false },
  },
  {
    value: 'title_list',
    label: 'Título + lista',
    fields: { description: false, list: true },
  },
];

const SERVICE_ITEM_LAYOUT_VALUES = new Set(SERVICE_ITEM_LAYOUTS.map((item) => item.value));

/** Legacy layouts map into the simplified 3-option model. */
const SERVICE_LAYOUT_ALIASES = {
  list: 'title_description',
  title_image: 'title',
  title_description_image: 'title_description',
  title_list_image: 'title_list',
};

export function createEmptyService(overrides = {}) {
  return {
    id: createContentId('service'),
    layout: 'title_description',
    title: '',
    description: '',
    listItems: [],
    imageUrl: '',
    ...overrides,
    layout: normalizeServiceLayout(overrides.layout || 'title_description'),
    listItems: normalizeServiceListItems(overrides.listItems ?? []),
  };
}

export function getServiceLayoutMeta(value) {
  const layout = normalizeServiceLayout(value);
  return SERVICE_ITEM_LAYOUTS.find((item) => item.value === layout) ?? SERVICE_ITEM_LAYOUTS[1];
}

export function normalizeServiceLayout(value) {
  const raw = String(value ?? '').trim();
  const layout = SERVICE_LAYOUT_ALIASES[raw] || raw;
  return SERVICE_ITEM_LAYOUT_VALUES.has(layout) ? layout : 'title_description';
}

export function normalizeServiceListItems(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return String(value)
      .split(/\n+/)
      .map((line) => line.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);
  }
  return [];
}

export function serviceListItemsToText(items) {
  return normalizeServiceListItems(items).join('\n');
}

export function normalizeService(item = {}) {
  const layout = normalizeServiceLayout(item.layout || item.tipo || item.itemLayout);
  const description = item.description || item.descripcion || item.text || item.texto || '';
  let listItems = normalizeServiceListItems(item.listItems ?? item.items ?? item.lista);

  if (listItems.length === 0 && layout === 'title_list') {
    listItems = normalizeServiceListItems(description);
  }

  return {
    id: normalizeContentId(item.id, createContentId('service')),
    layout,
    title: item.title || item.titulo || '',
    description,
    listItems,
    imageUrl: item.imageUrl || item.imagenUrl || '',
  };
}

export function normalizeServices(items) {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeService);
}

export function isServiceItemVisible(item) {
  const normalized = normalizeService(item);
  const title = String(normalized.title ?? '').trim();
  const description = String(normalized.description ?? '').trim();
  const imageUrl = String(normalized.imageUrl ?? '').trim();
  const listItems = normalized.listItems || [];
  const meta = getServiceLayoutMeta(normalized.layout);

  if (meta.fields.list) {
    return Boolean(title || listItems.length > 0);
  }
  if (normalized.layout === 'title') {
    return Boolean(title || imageUrl);
  }
  return Boolean(title || description);
}

export function getVisibleServices(data) {
  return normalizeServices(data?.services).filter(isServiceItemVisible);
}

export function shouldShowServicesSection(data) {
  if (!data?.servicesSectionEnabled) return false;
  return getVisibleServices(data).length > 0;
}

export function splitServicesSectionText(text) {
  return String(text ?? '')
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export const SERVICES_DISPLAY_MODES = [
  { value: 'stack', label: 'Lista (todos hacia abajo)' },
  { value: 'carousel', label: 'Carrusel' },
];

export const SERVICES_CAROUSEL_MOTION_MODES = [
  { value: 'manual', label: 'Manual (botones)' },
  { value: 'auto', label: 'Automático' },
];

export const SERVICES_CAROUSEL_PER_VIEW_OPTIONS = [1, 2, 3, 4];

/** Default interval for automatic carousel advance (ms). */
export const SERVICES_CAROUSEL_AUTOPLAY_MS = 5000;

export const SERVICES_VISUAL_STYLES = [
  { value: 'cards', label: 'Tarjetas', description: 'Tarjetas con borde y sombra suave' },
  { value: 'minimal', label: 'Minimal', description: 'Sin borde ni sombra, más aire' },
  { value: 'editorial', label: 'Editorial', description: 'Separadores y tipografía abierta' },
];

export const SERVICES_CAROUSEL_TRANSITIONS = [
  { value: 'none', label: 'Sin transición', description: 'Cambio instantáneo' },
  { value: 'fade', label: 'Fundido', description: 'Suave cambio de opacidad' },
  { value: 'slide', label: 'Deslizamiento', description: 'Desplaza horizontalmente' },
];

const SERVICES_VISUAL_STYLE_VALUES = new Set(SERVICES_VISUAL_STYLES.map((item) => item.value));
const SERVICES_CAROUSEL_TRANSITION_VALUES = new Set(SERVICES_CAROUSEL_TRANSITIONS.map((item) => item.value));

export function normalizeServicesDisplayMode(value) {
  return value === 'carousel' ? 'carousel' : 'stack';
}

export function normalizeServicesCarouselPerView(value) {
  const n = Number(value);
  if (SERVICES_CAROUSEL_PER_VIEW_OPTIONS.includes(n)) return n;
  return 3;
}

export function normalizeServicesCarouselAutoplay(value) {
  return value === true || value === 'auto';
}

export function normalizeServicesVisualStyle(value) {
  const style = String(value ?? '').trim();
  return SERVICES_VISUAL_STYLE_VALUES.has(style) ? style : 'cards';
}

export function normalizeServicesCarouselTransition(value) {
  const transition = String(value ?? '').trim();
  return SERVICES_CAROUSEL_TRANSITION_VALUES.has(transition) ? transition : 'fade';
}


/** Word limit for service card descriptions before “view more”. */
export const SERVICES_DESCRIPTION_PREVIEW_WORDS = 36;

/**
 * Truncates text by word count for uniform service cards.
 * @returns {{ preview: string, full: string, truncated: boolean }}
 */
export function truncateServiceDescription(text, maxWords = SERVICES_DESCRIPTION_PREVIEW_WORDS) {
  const full = String(text ?? '').trim().replace(/\s+/g, ' ');
  if (!full) {
    return { preview: '', full: '', truncated: false };
  }

  const words = full.split(' ');
  const limit = Number(maxWords);
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : SERVICES_DESCRIPTION_PREVIEW_WORDS;

  if (words.length <= safeLimit) {
    return { preview: full, full, truncated: false };
  }

  return {
    preview: `${words.slice(0, safeLimit).join(' ')}…`,
    full,
    truncated: true,
  };
}
