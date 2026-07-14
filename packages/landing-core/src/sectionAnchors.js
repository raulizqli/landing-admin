
export const SECTION_IDS = {
  top: 'page-top',
  nav: 'nav',
  preHero: 'pre-hero',
  hero: 'hero',
  about: 'about',
  services: 'services',
  catalog: 'catalog',
  gallery: 'gallery',
  video: 'video',
  testimonials: 'testimonials',
  blog: 'blog',
  contact: 'contact',
  social: 'social',
  embeds: 'custom-embeds',
  footer: 'footer',
};

/** Map admin editor section keys → DOM ids used for preview scroll-into-view. */
export const EDITOR_PREVIEW_SECTION_MAP = {
  identity: SECTION_IDS.top,
  page: SECTION_IDS.top,
  visibility: SECTION_IDS.top,
  hosting: SECTION_IDS.footer,
  nav: SECTION_IDS.nav,
  preHero: SECTION_IDS.preHero,
  hero: SECTION_IDS.hero,
  about: SECTION_IDS.about,
  services: SECTION_IDS.services,
  catalog: SECTION_IDS.catalog,
  gallery: SECTION_IDS.gallery,
  video: SECTION_IDS.video,
  testimonials: SECTION_IDS.testimonials,
  blog: SECTION_IDS.blog,
  contact: SECTION_IDS.contact,
  social: SECTION_IDS.social,
  embeds: SECTION_IDS.embeds,
  footer: SECTION_IDS.footer,
  analytics: SECTION_IDS.footer,
};

export function resolvePreviewSectionId(editorSectionKey) {
  return EDITOR_PREVIEW_SECTION_MAP[editorSectionKey] || SECTION_IDS.top;
}
