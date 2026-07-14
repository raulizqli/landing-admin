import {
  createEmptyService,
  normalizeService,
  normalizeServicesCarouselAutoplay,
  normalizeServicesCarouselPerView,
  normalizeServicesDisplayMode,
  isServiceItemVisible,
} from './services.js';
import { normalizePreHeroImageSide } from './preHero.js';

export const EMBED_PLACEMENTS = [
  { value: 'before_pre_hero', label: 'Antes del pre-hero' },
  { value: 'after_pre_hero', label: 'Después del pre-hero' },
  { value: 'after_hero', label: 'Después del hero / carrusel' },
  { value: 'after_about', label: 'Después de sobre mí' },
  { value: 'after_services', label: 'Después de servicios' },
  { value: 'after_catalog', label: 'Después del catálogo' },
  { value: 'after_gallery', label: 'Después de la galería' },
  { value: 'after_video', label: 'Después del video' },
  { value: 'after_testimonials', label: 'Después de testimonios' },
  { value: 'after_blog', label: 'Después del blog' },
  { value: 'after_contact', label: 'Después de contacto' },
  { value: 'after_social', label: 'Después de redes sociales' },
  { value: 'before_footer', label: 'Antes del pie de página' },
];

/**
 * Recommended custom section types for psychology / therapy landings.
 * Stored in `customEmbeds[]` with a `type` field (legacy items default to `embed`).
 */
export const CUSTOM_SECTION_TYPES = [
  {
    value: 'pre_hero',
    label: 'Pre-hero',
    description: 'Bloque imagen + texto (banner o editorial).',
    defaultTitle: '',
    defaultPlacement: 'before_pre_hero',
  },
  {
    value: 'services',
    label: 'Servicios',
    description: 'Lista o carrusel de servicios / temas.',
    defaultTitle: 'Servicios',
    defaultPlacement: 'after_about',
  },
  {
    value: 'faq',
    label: 'Preguntas frecuentes',
    description: 'Dudas sobre terapia, sesiones y modalidades.',
    defaultTitle: 'Preguntas frecuentes',
    defaultPlacement: 'after_about',
  },
  {
    value: 'steps',
    label: 'Proceso / pasos',
    description: 'Cómo empieza y avanza el acompañamiento.',
    defaultTitle: 'Cómo trabajamos',
    defaultPlacement: 'after_services',
  },
  {
    value: 'text',
    label: 'Texto editorial',
    description: 'Enfoque, metodología o un bloque de contenido libre.',
    defaultTitle: 'Mi enfoque',
    defaultPlacement: 'after_about',
  },
  {
    value: 'cta',
    label: 'Banner de cita',
    description: 'Llamada a la acción para reservar o escribir.',
    defaultTitle: 'Agenda tu primera sesión',
    defaultPlacement: 'after_testimonials',
  },
  {
    value: 'quote',
    label: 'Cita destacada',
    description: 'Frase o testimonio corto a pantalla completa.',
    defaultTitle: '',
    defaultPlacement: 'after_hero',
  },
  {
    value: 'portfolio',
    label: 'Portafolio externo',
    description: 'Enlace o embed a Pixieset, SmugMug, Format, Adobe Portfolio, etc.',
    defaultTitle: 'Portafolio',
    defaultPlacement: 'after_gallery',
  },
  {
    value: 'embed',
    label: 'Código / integración',
    description: 'Calendly, PayPal, formularios u otros widgets HTML.',
    defaultTitle: '',
    defaultPlacement: 'after_contact',
  },
];

export const PORTFOLIO_PROVIDERS = [
  { value: 'pixieset', label: 'Pixieset' },
  { value: 'smugmug', label: 'SmugMug' },
  { value: 'format', label: 'Format' },
  { value: 'adobe', label: 'Adobe Portfolio' },
  { value: 'custom', label: 'Otro / personalizado' },
];

const PLACEMENT_VALUES = new Set(EMBED_PLACEMENTS.map((item) => item.value));
const TYPE_VALUES = new Set(CUSTOM_SECTION_TYPES.map((item) => item.value));
const PORTFOLIO_PROVIDER_VALUES = new Set(PORTFOLIO_PROVIDERS.map((item) => item.value));

export function normalizePlacement(value) {
  const placement = String(value ?? '').trim();
  return PLACEMENT_VALUES.has(placement) ? placement : 'after_contact';
}

export function normalizeSectionType(value) {
  const type = String(value ?? '').trim();
  return TYPE_VALUES.has(type) ? type : 'embed';
}

export function normalizePortfolioProvider(value) {
  const provider = String(value ?? '').trim().toLowerCase();
  return PORTFOLIO_PROVIDER_VALUES.has(provider) ? provider : 'custom';
}

export function normalizePreHeroMode(value) {
  if (value === 'grafico' || value === 'banner') return 'banner';
  if (value === 'editorial' || value === 'split') return 'split';
  return 'banner';
}

export function getPlacementLabel(value) {
  return EMBED_PLACEMENTS.find((item) => item.value === value)?.label ?? value;
}

export function getSectionTypeMeta(value) {
  const type = normalizeSectionType(value);
  return CUSTOM_SECTION_TYPES.find((item) => item.value === type) ?? CUSTOM_SECTION_TYPES.at(-1);
}

function createId(prefix = 'section') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function createEmptyFaqItem(overrides = {}) {
  return {
    question: '',
    answer: '',
    ...overrides,
  };
}

export function createEmptyStepItem(overrides = {}) {
  return {
    title: '',
    description: '',
    ...overrides,
  };
}

function normalizeFaqItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    question: String(item?.question ?? item?.pregunta ?? '').trim(),
    answer: String(item?.answer ?? item?.respuesta ?? '').trim(),
  }));
}

function normalizeStepItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    title: String(item?.title ?? item?.titulo ?? '').trim(),
    description: String(item?.description ?? item?.descripcion ?? '').trim(),
  }));
}

function normalizeServiceItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeService);
}

export function getVisibleServiceItems(items) {
  return normalizeServiceItems(items).filter(isServiceItemVisible);
}

export function createEmptyCustomEmbed(overrides = {}) {
  const typeMeta = getSectionTypeMeta(overrides.type || 'embed');

  return {
    id: createId('embed'),
    enabled: true,
    type: typeMeta.value,
    label: '',
    title: typeMeta.defaultTitle || '',
    placement: typeMeta.defaultPlacement,
    htmlCode: '',
    body: '',
    quoteText: '',
    quoteAttribution: '',
    ctaText: '',
    ctaButtonLabel: 'Reservar cita',
    ctaButtonUrl: '',
    faqItems: [createEmptyFaqItem()],
    steps: [createEmptyStepItem(), createEmptyStepItem(), createEmptyStepItem()],
    imageUrl: '',
    preHeroMode: 'split',
    preHeroImageSide: 'left',
    serviceItems: [createEmptyService()],
    servicesDisplayMode: 'stack',
    servicesCarouselPerView: 3,
    servicesCarouselAutoplay: false,
    portfolioUrl: '',
    portfolioProvider: 'custom',
    fullWidth: false,
    sortOrder: 0,
    ...overrides,
    type: normalizeSectionType(overrides.type || typeMeta.value),
  };
}

export function createCustomSectionByType(type, overrides = {}) {
  const typeMeta = getSectionTypeMeta(type);
  const base = {
    type: typeMeta.value,
    title: typeMeta.defaultTitle,
    placement: typeMeta.defaultPlacement,
    ...overrides,
  };

  if (typeMeta.value === 'pre_hero') {
    return createEmptyCustomEmbed({
      ...base,
      preHeroMode: 'split',
      preHeroImageSide: 'left',
      imageUrl: '',
      body: '',
    });
  }

  if (typeMeta.value === 'services') {
    return createEmptyCustomEmbed({
      ...base,
      body: '',
      serviceItems: [createEmptyService(), createEmptyService()],
      servicesDisplayMode: 'stack',
      servicesCarouselPerView: 3,
      servicesCarouselAutoplay: false,
    });
  }

  if (typeMeta.value === 'portfolio') {
    return createEmptyCustomEmbed({
      ...base,
      body: '',
      portfolioUrl: '',
      portfolioProvider: 'custom',
      ctaButtonLabel: 'Ver portafolio completo',
      htmlCode: '',
    });
  }

  return createEmptyCustomEmbed(base);
}

export function normalizeCustomEmbeds(embeds) {
  if (!Array.isArray(embeds)) return [];

  return embeds.map((embed, index) => {
    const type = normalizeSectionType(embed.type || (embed.htmlCode || embed.codigo ? 'embed' : 'text'));
    const defaultCtaLabel = type === 'portfolio' ? 'Ver portafolio completo' : 'Reservar cita';

    return {
      id: String(embed.id || `embed-${index}`).trim() || `embed-${index}`,
      enabled: embed.enabled !== false,
      type,
      label: String(embed.label ?? '').trim(),
      title: String(embed.title ?? '').trim(),
      placement: normalizePlacement(embed.placement),
      htmlCode: String(embed.htmlCode ?? embed.codigo ?? '').trim(),
      body: String(embed.body ?? embed.texto ?? '').trim(),
      quoteText: String(embed.quoteText ?? embed.cita ?? '').trim(),
      quoteAttribution: String(embed.quoteAttribution ?? embed.autor ?? '').trim(),
      ctaText: String(embed.ctaText ?? '').trim(),
      ctaButtonLabel: String(embed.ctaButtonLabel ?? defaultCtaLabel).trim() || defaultCtaLabel,
      ctaButtonUrl: String(embed.ctaButtonUrl ?? '').trim(),
      faqItems: normalizeFaqItems(embed.faqItems),
      steps: normalizeStepItems(embed.steps),
      imageUrl: String(embed.imageUrl ?? embed.preHeroImageUrl ?? embed.imagenUrl ?? '').trim(),
      preHeroMode: normalizePreHeroMode(embed.preHeroMode),
      preHeroImageSide: normalizePreHeroImageSide(embed.preHeroImageSide),
      serviceItems: normalizeServiceItems(embed.serviceItems),
      servicesDisplayMode: normalizeServicesDisplayMode(embed.servicesDisplayMode),
      servicesCarouselPerView: normalizeServicesCarouselPerView(embed.servicesCarouselPerView),
      servicesCarouselAutoplay: normalizeServicesCarouselAutoplay(embed.servicesCarouselAutoplay),
      portfolioUrl: String(embed.portfolioUrl ?? '').trim(),
      portfolioProvider: normalizePortfolioProvider(embed.portfolioProvider),
      fullWidth: embed.fullWidth === true,
      sortOrder: Number.isFinite(Number(embed.sortOrder)) ? Number(embed.sortOrder) : index,
    };
  });
}

export function isCustomSectionVisible(embed) {
  if (!embed || embed.enabled === false) return false;

  const title = String(embed.title ?? '').trim();
  const type = normalizeSectionType(embed.type);

  if (type === 'faq') {
    return normalizeFaqItems(embed.faqItems).some((item) => item.question && item.answer);
  }
  if (type === 'steps') {
    return normalizeStepItems(embed.steps).some((item) => item.title || item.description);
  }
  if (type === 'text') {
    return Boolean(title || String(embed.body ?? '').trim());
  }
  if (type === 'cta') {
    return Boolean(title || String(embed.ctaText ?? '').trim() || String(embed.ctaButtonUrl ?? '').trim());
  }
  if (type === 'quote') {
    return Boolean(String(embed.quoteText ?? '').trim());
  }
  if (type === 'pre_hero') {
    const imageUrl = String(embed.imageUrl ?? '').trim();
    if (!imageUrl) return false;
    if (normalizePreHeroMode(embed.preHeroMode) === 'split') {
      return Boolean(title || String(embed.body ?? '').trim());
    }
    return true;
  }
  if (type === 'services') {
    return getVisibleServiceItems(embed.serviceItems).length > 0;
  }
  if (type === 'portfolio') {
    return Boolean(
      String(embed.portfolioUrl ?? '').trim()
      || String(embed.htmlCode ?? '').trim(),
    );
  }
  // embed
  return Boolean(title || String(embed.htmlCode ?? '').trim());
}

export function getEmbedsForPlacement(data, placement) {
  return normalizeCustomEmbeds(data?.customEmbeds)
    .filter((embed) => embed.placement === placement && isCustomSectionVisible(embed))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function splitSectionParagraphs(value) {
  return String(value ?? '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
