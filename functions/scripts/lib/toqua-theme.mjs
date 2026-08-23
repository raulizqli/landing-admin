import { createDefaultSectionThemes } from '../../../packages/landing-core/src/sectionBackground.js';

/** Toqua brand — keep in sync with toqua-site/src/index.css and landing-admin/src/index.css */
export const TOQUA_PURPLE = '#523677';
export const TOQUA_PURPLE_DARK = '#3F295C';
export const TOQUA_CREAM = '#FCFBF9';
export const TOQUA_WHITE = '#FFFFFF';

/** Section themes with Toqua purple text on cream/neutral backgrounds. */
export function createToquaSectionThemes() {
  const themes = createDefaultSectionThemes();
  const textSections = [
    'page', 'nav', 'preHero', 'about', 'services', 'catalog',
    'gallery', 'video', 'testimonials', 'blog', 'contact', 'social', 'footer',
  ];

  for (const key of textSections) {
    themes[key] = { ...themes[key], textColor: TOQUA_PURPLE };
  }

  themes.page = { ...themes.page, backgroundColor: TOQUA_CREAM };
  themes.nav = { ...themes.nav, backgroundColor: TOQUA_CREAM };
  themes.services = { ...themes.services, backgroundColor: TOQUA_CREAM };
  themes.contact = { ...themes.contact, backgroundColor: TOQUA_CREAM };
  themes.footer = { ...themes.footer, backgroundColor: TOQUA_CREAM };

  return themes;
}

export function heroButtonColors() {
  return {
    buttonBgColor: TOQUA_PURPLE,
    buttonTextColor: TOQUA_WHITE,
    buttonOutlineColor: TOQUA_WHITE,
  };
}

export function serviceWithBrandColors(partial = {}) {
  return {
    layout: 'title_description',
    title: '',
    description: '',
    listItems: [],
    imageUrl: '',
    titleColor: TOQUA_PURPLE,
    descriptionColor: TOQUA_PURPLE,
    ...partial,
  };
}

export function patchHeroSlides(slides = []) {
  return slides.map((slide) => ({
    ...slide,
    ...heroButtonColors(),
  }));
}

export function patchServices(services = []) {
  return services.map((item) => ({
    ...item,
    titleColor: TOQUA_PURPLE,
    descriptionColor: TOQUA_PURPLE,
  }));
}

export function patchCustomEmbedsStepsColors(embeds = []) {
  return embeds.map((embed) => {
    if (embed?.type !== 'steps') return embed;
    return {
      ...embed,
      stepsCardBgColor: TOQUA_PURPLE,
      stepsTextColor: TOQUA_WHITE,
    };
  });
}

export function patchCustomEmbedsFaqColors(embeds = []) {
  return embeds.map((embed) => {
    if (embed?.type !== 'faq') return embed;
    return {
      ...embed,
      faqCardBgColor: TOQUA_PURPLE,
      faqTextColor: TOQUA_WHITE,
    };
  });
}

export function patchCustomEmbedsCtaColors(embeds = []) {
  return embeds.map((embed) => {
    if (embed?.type !== 'cta') return embed;
    return {
      ...embed,
      ctaButtonBgColor: TOQUA_PURPLE,
      ctaButtonTextColor: TOQUA_WHITE,
    };
  });
}

export function patchCustomEmbedsColors(embeds = []) {
  return patchCustomEmbedsCtaColors(patchCustomEmbedsFaqColors(patchCustomEmbedsStepsColors(embeds)));
}
