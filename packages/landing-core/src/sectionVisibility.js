
import { SECTION_IDS } from './sectionAnchors.js';
import { getLabel, resolvePageLabels } from './labels.js';
import { shouldShowPreHero } from './preHero.js';
import { shouldShowServicesSection } from './services.js';
import { shouldShowCatalogSection } from './catalog.js';
import { shouldShowGallerySection } from './gallery.js';
import { shouldShowVideoSection } from './videoSection.js';
import { shouldShowTestimonialsSection } from './testimonials.js';
import { shouldShowBlogSection } from './blog.js';
import { getSocialLinks } from './socialLinks.js';

export const NAV_ALIGN_OPTIONS = [
  { value: 'spread', label: 'Distribuido (marca izq. / CTA der.)' },
  { value: 'left', label: 'Alineado a la izquierda' },
  { value: 'center', label: 'Centrado' },
  { value: 'right', label: 'Alineado a la derecha (CTA izq. si está activo)' },
];

const NAV_ALIGN_SET = new Set(NAV_ALIGN_OPTIONS.map((item) => item.value));

export function normalizeNavAlign(value) {
  return NAV_ALIGN_SET.has(value) ? value : 'spread';
}

/** Sections that can be toggled (navbar is always on). */
export const TOGGLEABLE_PAGE_SECTIONS = [
  {
    flag: 'preHeroEnabled',
    sectionId: SECTION_IDS.preHero,
    label: 'Pre-hero',
    defaultEnabled: false,
  },
  {
    flag: 'heroSectionEnabled',
    sectionId: SECTION_IDS.hero,
    label: 'Hero',
    defaultEnabled: true,
  },
  {
    flag: 'aboutSectionEnabled',
    sectionId: SECTION_IDS.about,
    label: 'Acerca de',
    defaultEnabled: true,
  },
  {
    flag: 'servicesSectionEnabled',
    sectionId: SECTION_IDS.services,
    label: 'Servicios',
    defaultEnabled: false,
  },
  {
    flag: 'catalogSectionEnabled',
    sectionId: SECTION_IDS.catalog,
    label: 'Catálogo',
    defaultEnabled: false,
  },
  {
    flag: 'gallerySectionEnabled',
    sectionId: SECTION_IDS.gallery,
    label: 'Galería',
    defaultEnabled: false,
  },
  {
    flag: 'videoSectionEnabled',
    sectionId: SECTION_IDS.video,
    label: 'Video',
    defaultEnabled: false,
  },
  {
    flag: 'testimonialsEnabled',
    sectionId: SECTION_IDS.testimonials,
    label: 'Testimonios',
    defaultEnabled: false,
  },
  {
    flag: 'blogSectionEnabled',
    sectionId: SECTION_IDS.blog,
    label: 'Blog / noticias',
    defaultEnabled: false,
  },
  {
    flag: 'contactSectionEnabled',
    sectionId: SECTION_IDS.contact,
    label: 'Contacto',
    defaultEnabled: true,
  },
  {
    flag: 'socialSectionEnabled',
    sectionId: SECTION_IDS.social,
    label: 'Redes sociales',
    defaultEnabled: true,
  },
  {
    flag: 'footerSectionEnabled',
    sectionId: SECTION_IDS.footer,
    label: 'Pie de página',
    defaultEnabled: true,
  },
];

export function isFlagEnabled(data, flag, defaultEnabled = true) {
  if (data?.[flag] === undefined || data?.[flag] === null) return defaultEnabled;
  return data[flag] === true;
}

export function isHeroSectionEnabled(data) {
  return isFlagEnabled(data, 'heroSectionEnabled', true);
}

export function isAboutSectionEnabled(data) {
  return isFlagEnabled(data, 'aboutSectionEnabled', true);
}

export function isContactSectionEnabled(data) {
  return isFlagEnabled(data, 'contactSectionEnabled', true);
}

export function isSocialSectionEnabled(data) {
  return isFlagEnabled(data, 'socialSectionEnabled', true);
}

export function isFooterSectionEnabled(data) {
  return isFlagEnabled(data, 'footerSectionEnabled', true);
}

/**
 * In-page nav links for enabled sections that actually render.
 * Skips navbar, hero, and pre-hero.
 */
export function getNavMenuItems(data) {
  const labels = resolvePageLabels(data);
  const items = [];

  if (isAboutSectionEnabled(data)) {
    items.push({ id: SECTION_IDS.about, label: getLabel(labels, 'about.title') });
  }
  if (shouldShowServicesSection(data)) {
    items.push({
      id: SECTION_IDS.services,
      label: String(data.servicesSectionTitle ?? '').trim() || getLabel(labels, 'services.defaultTitle'),
    });
  }
  if (shouldShowCatalogSection(data)) {
    items.push({
      id: SECTION_IDS.catalog,
      label: String(data.catalogSectionTitle ?? '').trim() || getLabel(labels, 'catalog.defaultTitle'),
    });
  }
  if (shouldShowGallerySection(data)) {
    items.push({
      id: SECTION_IDS.gallery,
      label: String(data.gallerySectionTitle ?? '').trim() || getLabel(labels, 'gallery.defaultTitle'),
    });
  }
  if (shouldShowVideoSection(data)) {
    items.push({
      id: SECTION_IDS.video,
      label: String(data.videoSectionTitle ?? '').trim() || getLabel(labels, 'nav.menuVideo'),
    });
  }
  if (shouldShowTestimonialsSection(data)) {
    items.push({
      id: SECTION_IDS.testimonials,
      label: String(data.testimonialsSectionTitle ?? '').trim() || getLabel(labels, 'testimonials.defaultTitle'),
    });
  }
  if (shouldShowBlogSection(data)) {
    items.push({
      id: SECTION_IDS.blog,
      label: String(data.blogSectionTitle ?? '').trim() || getLabel(labels, 'blog.defaultTitle'),
    });
  }
  if (isContactSectionEnabled(data)) {
    items.push({ id: SECTION_IDS.contact, label: getLabel(labels, 'contact.title') });
  }
  if (isSocialSectionEnabled(data) && getSocialLinks(data).length > 0) {
    items.push({ id: SECTION_IDS.social, label: getLabel(labels, 'social.title') });
  }

  return items;
}

export function shouldIncludePreHero(data) {
  return shouldShowPreHero(data);
}
