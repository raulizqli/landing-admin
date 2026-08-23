import {
  createEmptyService,
  normalizeService,
  normalizeServicesCarouselAutoplay,
  normalizeServicesCarouselPerView,
  normalizeServicesCarouselTransition,
  normalizeServicesDisplayMode,
  normalizeServicesVisualStyle,
  isServiceItemVisible,
  serviceListItemsToText,
} from './services.js';
import { createEmptySectionCustomStyle, normalizeSectionCustomStyle } from './sectionCustomStyle.js';
import { normalizePreHeroImageSide } from './preHero.js';
import { createContentId, normalizeContentId } from './contentIds.js';
import { parseColorToHex } from './sectionBackground.js';

export const DEFAULT_STEPS_CARD_BG_COLOR = '#F4F7F5';
export const DEFAULT_STEPS_TITLE_COLOR = '#0A5C3A';
export const DEFAULT_STEPS_BODY_COLOR = '#1A2420';
export const DEFAULT_STEPS_MUTED_COLOR = '#0A5C3A';

export const DEFAULT_FAQ_CARD_BG_COLOR = DEFAULT_STEPS_CARD_BG_COLOR;
export const DEFAULT_FAQ_TEXT_COLOR = DEFAULT_STEPS_TITLE_COLOR;

export const DEFAULT_CTA_BUTTON_BG_COLOR = '#4A5D4E';
export const DEFAULT_CTA_BUTTON_TEXT_COLOR = '#FFFFFF';

function normalizeOptionalColor(value, fallback) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  return parseColorToHex(raw, fallback);
}

function resolveEmbedCardColors(embed = {}, { bgField, textField }) {
  const defaultBg = DEFAULT_STEPS_CARD_BG_COLOR;
  const cardBgColor = normalizeOptionalColor(embed[bgField], defaultBg) || defaultBg;
  const customText = normalizeOptionalColor(embed[textField], DEFAULT_STEPS_TITLE_COLOR);

  if (customText) {
    return {
      cardBgColor,
      titleColor: customText,
      bodyColor: `${customText}CC`,
      mutedColor: `${customText}8C`,
    };
  }

  return {
    cardBgColor,
    titleColor: DEFAULT_STEPS_TITLE_COLOR,
    bodyColor: `${DEFAULT_STEPS_BODY_COLOR}CC`,
    mutedColor: `${DEFAULT_STEPS_MUTED_COLOR}8C`,
  };
}

/** Resolved card + text colors for steps embeds (empty fields keep legacy defaults). */
export function resolveStepsCardColors(embed = {}) {
  return resolveEmbedCardColors(embed, {
    bgField: 'stepsCardBgColor',
    textField: 'stepsTextColor',
  });
}

/** Resolved card + text colors for FAQ embeds (empty fields keep legacy defaults). */
export function resolveFaqCardColors(embed = {}) {
  return resolveEmbedCardColors(embed, {
    bgField: 'faqCardBgColor',
    textField: 'faqTextColor',
  });
}

/** Resolved button colors for booking CTA embeds (empty fields keep legacy defaults). */
export function resolveCtaButtonColors(embed = {}) {
  return {
    buttonBgColor: normalizeOptionalColor(embed.ctaButtonBgColor, DEFAULT_CTA_BUTTON_BG_COLOR)
      || DEFAULT_CTA_BUTTON_BG_COLOR,
    buttonTextColor: normalizeOptionalColor(embed.ctaButtonTextColor, DEFAULT_CTA_BUTTON_TEXT_COLOR)
      || DEFAULT_CTA_BUTTON_TEXT_COLOR,
  };
}

export const EMBED_PLACEMENTS = [
  { value: 'before_pre_hero', label: 'Antes de la sección principal' },
  { value: 'after_pre_hero', label: 'Después de la sección principal' },
  { value: 'after_hero', label: 'Después del carrusel' },
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
    label: 'Sección principal',
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
    id: createContentId('faq'),
    question: '',
    answer: '',
    price: '',
    ...overrides,
  };
}

export function createEmptyStepItem(overrides = {}) {
  return {
    id: createContentId('step'),
    title: '',
    description: '',
    ...overrides,
  };
}

function normalizeFaqItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => ({
    id: normalizeContentId(item?.id, `faq-${index + 1}`),
    question: String(item?.question ?? item?.pregunta ?? '').trim(),
    answer: String(item?.answer ?? item?.respuesta ?? '').trim(),
    price: String(item?.price ?? item?.precio ?? '').trim(),
  }));
}

function normalizeStepItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => ({
    id: normalizeContentId(item?.id, `step-${index + 1}`),
    title: String(item?.title ?? item?.titulo ?? '').trim(),
    description: String(item?.description ?? item?.descripcion ?? '').trim(),
  }));
}

function normalizeServiceItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => normalizeService(item, index));
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
    ctaButtonBgColor: '',
    ctaButtonTextColor: '',
    faqItems: [createEmptyFaqItem()],
    steps: [createEmptyStepItem(), createEmptyStepItem(), createEmptyStepItem()],
    imageUrl: '',
    preHeroMode: 'split',
    preHeroImageSide: 'left',
    serviceItems: [createEmptyService()],
    servicesDisplayMode: 'stack',
    servicesCarouselPerView: 3,
    servicesCarouselAutoplay: false,
    servicesVisualStyle: 'cards',
    servicesCarouselTransition: 'fade',
    servicesCustomStyle: createEmptySectionCustomStyle(),
    portfolioUrl: '',
    portfolioProvider: 'custom',
    stepsCardBgColor: '',
    stepsTextColor: '',
    faqCardBgColor: '',
    faqTextColor: '',
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
      servicesVisualStyle: 'cards',
      servicesCarouselTransition: 'fade',
      servicesCustomStyle: createEmptySectionCustomStyle(),
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

const LIST_SECTION_TYPES = new Set(['faq', 'steps', 'services']);

function pickEmbedLongText(embed = {}) {
  return String(embed.body ?? embed.ctaText ?? embed.quoteText ?? '').trim();
}

function extractTitleDescriptionItems(embed = {}, fromType = embed.type) {
  const type = normalizeSectionType(fromType);

  if (type === 'faq') {
    return normalizeFaqItems(embed.faqItems).map((item) => ({
      id: item.id,
      title: item.question,
      description: item.answer,
      price: item.price,
    }));
  }

  if (type === 'steps') {
    return normalizeStepItems(embed.steps).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      price: '',
    }));
  }

  if (type === 'services') {
    return normalizeServiceItems(embed.serviceItems).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description || serviceListItemsToText(item.listItems),
      price: item.price,
      layout: item.layout,
      listItems: item.listItems,
      imageUrl: item.imageUrl,
    }));
  }

  return [];
}

function formatTitleDescriptionItemsAsBody(items = []) {
  return items
    .filter((item) => item.title || item.description || item.price)
    .map((item) => {
      const parts = [];
      if (item.title) parts.push(item.title);
      if (item.price) parts.push(item.price);
      if (item.description) parts.push(item.description);
      return parts.join('\n');
    })
    .join('\n\n');
}

function applyTitleDescriptionItems(target, toType, items = []) {
  const normalized = items.filter((item) => item.title || item.description || item.price);
  if (!normalized.length) return;

  if (toType === 'faq') {
    target.faqItems = normalized.map((item) => createEmptyFaqItem({
      id: item.id,
      question: item.title,
      answer: item.description,
      price: item.price || '',
    }));
    return;
  }

  if (toType === 'steps') {
    target.steps = normalized.map((item) => createEmptyStepItem({
      id: item.id,
      title: item.title,
      description: item.description,
    }));
    return;
  }

  if (toType === 'services') {
    target.serviceItems = normalized.map((item) => createEmptyService({
      id: item.id,
      title: item.title,
      description: item.description,
      price: item.price || '',
      layout: item.layout || 'title_description',
      listItems: item.listItems || [],
      imageUrl: item.imageUrl || '',
    }));
  }
}

function migrateCardColors(source, target, fromType, toType) {
  if (fromType === 'faq' && toType === 'steps') {
    target.stepsCardBgColor = source.stepsCardBgColor || source.faqCardBgColor || '';
    target.stepsTextColor = source.stepsTextColor || source.faqTextColor || '';
    return;
  }

  if (fromType === 'steps' && toType === 'faq') {
    target.faqCardBgColor = source.faqCardBgColor || source.stepsCardBgColor || '';
    target.faqTextColor = source.faqTextColor || source.stepsTextColor || '';
  }
}

function copyServicesSettings(source, target) {
  target.servicesDisplayMode = source.servicesDisplayMode ?? target.servicesDisplayMode;
  target.servicesCarouselPerView = source.servicesCarouselPerView ?? target.servicesCarouselPerView;
  target.servicesCarouselAutoplay = source.servicesCarouselAutoplay ?? target.servicesCarouselAutoplay;
  target.servicesVisualStyle = source.servicesVisualStyle ?? target.servicesVisualStyle;
  target.servicesCarouselTransition = source.servicesCarouselTransition ?? target.servicesCarouselTransition;
  target.servicesCustomStyle = source.servicesCustomStyle ?? target.servicesCustomStyle;
}

/**
 * Maps shared content when switching custom embed section types in the admin.
 * Preserves id, label, title, placement, and translates list/prose fields when possible.
 */
export function migrateCustomEmbedType(embed = {}, nextTypeRaw) {
  const fromType = normalizeSectionType(embed?.type);
  const toType = normalizeSectionType(nextTypeRaw);
  if (fromType === toType) return { ...embed, type: toType };

  const meta = getSectionTypeMeta(toType);
  const template = createCustomSectionByType(toType, { sortOrder: embed.sortOrder });
  const longText = pickEmbedLongText(embed);
  const listItems = extractTitleDescriptionItems(embed, fromType);

  const migrated = {
    ...template,
    id: embed.id,
    enabled: embed.enabled !== false,
    label: String(embed.label ?? '').trim(),
    title: String(embed.title ?? '').trim() || meta.defaultTitle || template.title || '',
    placement: embed.placement || meta.defaultPlacement || template.placement,
    fullWidth: embed.fullWidth === true,
    sortOrder: Number.isFinite(Number(embed.sortOrder)) ? Number(embed.sortOrder) : template.sortOrder,
  };

  migrateCardColors(embed, migrated, fromType, toType);

  if (LIST_SECTION_TYPES.has(fromType) || LIST_SECTION_TYPES.has(toType)) {
    applyTitleDescriptionItems(migrated, toType, listItems);
  }

  if (toType === 'text' || toType === 'pre_hero') {
    migrated.body = longText || formatTitleDescriptionItemsAsBody(listItems) || migrated.body;
  }

  if (toType === 'quote') {
    migrated.quoteText = String(embed.quoteText ?? '').trim() || longText || formatTitleDescriptionItemsAsBody(listItems);
    migrated.quoteAttribution = String(embed.quoteAttribution ?? '').trim();
  }

  if (toType === 'cta') {
    migrated.ctaText = String(embed.ctaText ?? '').trim() || longText || formatTitleDescriptionItemsAsBody(listItems);
  }

  if (toType === 'pre_hero' || fromType === 'pre_hero') {
    migrated.imageUrl = String(embed.imageUrl ?? '').trim() || migrated.imageUrl;
    migrated.preHeroMode = embed.preHeroMode ?? migrated.preHeroMode;
    migrated.preHeroImageSide = embed.preHeroImageSide ?? migrated.preHeroImageSide;
  }

  if (toType === 'embed' || toType === 'portfolio' || fromType === 'embed' || fromType === 'portfolio') {
    migrated.htmlCode = String(embed.htmlCode ?? '').trim() || migrated.htmlCode;
  }

  if (toType === 'portfolio' || fromType === 'portfolio') {
    migrated.portfolioUrl = String(embed.portfolioUrl ?? '').trim() || migrated.portfolioUrl;
    migrated.portfolioProvider = embed.portfolioProvider || migrated.portfolioProvider;
  }

  if (toType === 'services') {
    copyServicesSettings(embed, migrated);
  }

  if (embed.ctaButtonLabel) {
    migrated.ctaButtonLabel = embed.ctaButtonLabel;
  }
  if (embed.ctaButtonUrl) {
    migrated.ctaButtonUrl = embed.ctaButtonUrl;
  }
  if (embed.ctaButtonBgColor) {
    migrated.ctaButtonBgColor = embed.ctaButtonBgColor;
  }
  if (embed.ctaButtonTextColor) {
    migrated.ctaButtonTextColor = embed.ctaButtonTextColor;
  }

  if (toType === 'portfolio') {
    migrated.ctaButtonLabel = embed.ctaButtonLabel && embed.ctaButtonLabel !== 'Reservar cita'
      ? embed.ctaButtonLabel
      : (migrated.ctaButtonLabel || 'Ver portafolio completo');
    migrated.portfolioProvider = embed.portfolioProvider || migrated.portfolioProvider || 'custom';
  }

  return migrated;
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
      ctaButtonBgColor: normalizeOptionalColor(embed.ctaButtonBgColor, DEFAULT_CTA_BUTTON_BG_COLOR),
      ctaButtonTextColor: normalizeOptionalColor(embed.ctaButtonTextColor, DEFAULT_CTA_BUTTON_TEXT_COLOR),
      faqItems: normalizeFaqItems(embed.faqItems),
      steps: normalizeStepItems(embed.steps),
      imageUrl: String(embed.imageUrl ?? embed.preHeroImageUrl ?? embed.imagenUrl ?? '').trim(),
      preHeroMode: normalizePreHeroMode(embed.preHeroMode),
      preHeroImageSide: normalizePreHeroImageSide(embed.preHeroImageSide),
      serviceItems: normalizeServiceItems(embed.serviceItems),
      servicesDisplayMode: normalizeServicesDisplayMode(embed.servicesDisplayMode),
      servicesCarouselPerView: normalizeServicesCarouselPerView(embed.servicesCarouselPerView),
      servicesCarouselAutoplay: normalizeServicesCarouselAutoplay(embed.servicesCarouselAutoplay),
      servicesVisualStyle: normalizeServicesVisualStyle(embed.servicesVisualStyle),
      servicesCarouselTransition: normalizeServicesCarouselTransition(embed.servicesCarouselTransition),
      servicesCustomStyle: normalizeSectionCustomStyle(embed.servicesCustomStyle),
      portfolioUrl: String(embed.portfolioUrl ?? '').trim(),
      portfolioProvider: normalizePortfolioProvider(embed.portfolioProvider),
      stepsCardBgColor: normalizeOptionalColor(embed.stepsCardBgColor, DEFAULT_STEPS_CARD_BG_COLOR),
      stepsTextColor: normalizeOptionalColor(embed.stepsTextColor, DEFAULT_STEPS_TITLE_COLOR),
      faqCardBgColor: normalizeOptionalColor(embed.faqCardBgColor, DEFAULT_FAQ_CARD_BG_COLOR),
      faqTextColor: normalizeOptionalColor(embed.faqTextColor, DEFAULT_FAQ_TEXT_COLOR),
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
