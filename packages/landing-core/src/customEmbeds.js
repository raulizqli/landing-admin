
export const EMBED_PLACEMENTS = [
  { value: 'before_pre_hero', label: 'Antes del pre-hero' },
  { value: 'after_pre_hero', label: 'Después del pre-hero' },
  { value: 'after_hero', label: 'Después del hero / carrusel' },
  { value: 'after_about', label: 'Después de sobre mí' },
  { value: 'after_services', label: 'Después de servicios' },
  { value: 'after_catalog', label: 'Después del catálogo' },
  { value: 'after_video', label: 'Después del video' },
  { value: 'after_testimonials', label: 'Después de testimonios' },
  { value: 'after_contact', label: 'Después de contacto' },
  { value: 'after_social', label: 'Después de redes sociales' },
  { value: 'before_footer', label: 'Antes del pie de página' },
];

const PLACEMENT_VALUES = new Set(EMBED_PLACEMENTS.map((item) => item.value));

export function normalizePlacement(value) {
  const placement = String(value ?? '').trim();
  return PLACEMENT_VALUES.has(placement) ? placement : 'after_contact';
}

export function getPlacementLabel(value) {
  return EMBED_PLACEMENTS.find((item) => item.value === value)?.label ?? value;
}

export function createEmptyCustomEmbed(overrides = {}) {
  return {
    id: `embed-${Date.now()}`,
    enabled: true,
    label: '',
    title: '',
    placement: 'after_contact',
    htmlCode: '',
    fullWidth: false,
    sortOrder: 0,
    ...overrides,
  };
}

export function normalizeCustomEmbeds(embeds) {
  if (!Array.isArray(embeds)) return [];

  return embeds.map((embed, index) => ({
    id: String(embed.id || `embed-${index}`).trim() || `embed-${index}`,
    enabled: embed.enabled !== false,
    label: String(embed.label ?? '').trim(),
    title: String(embed.title ?? '').trim(),
    placement: normalizePlacement(embed.placement),
    htmlCode: String(embed.htmlCode ?? embed.codigo ?? '').trim(),
    fullWidth: embed.fullWidth === true,
    sortOrder: Number.isFinite(Number(embed.sortOrder)) ? Number(embed.sortOrder) : index,
  }));
}

export function getEmbedsForPlacement(data, placement) {
  return normalizeCustomEmbeds(data?.customEmbeds)
    .filter((embed) => embed.enabled && embed.placement === placement && embed.htmlCode)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
