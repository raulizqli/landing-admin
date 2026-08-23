
import { createEmptySlide, normalizeHeroHeightMode, normalizeHeroSlide } from './heroSlides';
import { normalizeTestimonials } from './testimonials';
import {
  normalizeServices,
  normalizeServicesCarouselAutoplay,
  normalizeServicesCarouselPerView,
  normalizeServicesCarouselTransition,
  normalizeServicesDisplayMode,
  normalizeServicesVisualStyle,
} from './services.js';
import { normalizeCatalogItems, normalizeCatalogVisualStyle } from './catalog';
import { createEmptySectionCustomStyle, normalizeSectionCustomStyle } from './sectionCustomStyle.js';
import { normalizeGalleryItems } from './gallery';
import {
  normalizeVideoSectionCarouselAutoplay,
  normalizeVideoSectionItems,
  syncVideoSectionUrlFromItems,
} from './videoSection.js';
import { normalizeBlogPosts } from './blog';
import { normalizeSectionThemes, parseColorToHex } from './sectionBackground';
import { normalizeExternalFirebase } from './externalFirebase';
import { normalizeHostname } from './hostname';
import { normalizeContactMapLayout } from './maps';
import { syncLegacyLocationFields } from './locations.js';
import { normalizeCustomLabels, normalizeLabelLanguage } from './labels';
import { normalizeCustomEmbeds, isCustomSectionVisible } from './customEmbeds';
import { DEFAULT_VERTICAL, normalizeVertical } from './verticals';
import { normalizeNavAlign } from './sectionVisibility';
import { normalizeNavSpecialtyCase } from './navDisplay';
import { normalizeLegalDocuments } from './legalDocuments';
import { normalizePreHeroImageSide } from './preHero';
import { normalizeHostingDeployFields } from './hostingDeploy';
import {
  normalizeEnabledLanguages,
  normalizePageLanguage,
  normalizePageTranslations,
} from './pageTranslations';
import {
  createEmptyMarketingSettings,
  normalizeMarketingRoutes,
  normalizeMarketingSeo,
  normalizeMarketingSettings,
  normalizeSiteMode,
} from './marketingSite.js';
import { normalizeSiteAccess } from './siteAccess.js';
import { DEFAULT_PHONE_COUNTRY, normalizePhoneCountry } from './phone.js';

export const DEFAULT_NAV_CTA_BG_COLOR = '#4A5D4E';
export const DEFAULT_NAV_CTA_TEXT_COLOR = '#FFFFFF';

export const EMPTY_META_SOURCE = {
  facebookPageId: '',
  facebookName: '',
  instagram: '',
  importedAt: '',
};

export function normalizeMetaSource(raw) {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_META_SOURCE };
  return {
    facebookPageId: String(raw.facebookPageId ?? '').trim(),
    facebookName: String(raw.facebookName ?? '').trim(),
    instagram: String(raw.instagram ?? '').trim(),
    importedAt: String(raw.importedAt ?? '').trim(),
  };
}

export const EMPTY_PAGE = {
  name: '',
  specialty: '',
  vertical: DEFAULT_VERTICAL,
  navMode: 'profile',
  navIconUrl: '',
  navLogoUrl: '',
  navIconOnly: false,
  navSpecialty: '',
  navSpecialtyCase: 'uppercase',
  navShowSpecialty: true,
  navShowCta: true,
  navShowMenu: false,
  navAlign: 'spread',
  navCtaTarget: 'email',
  navCtaLink: '',
  navCtaBgColor: DEFAULT_NAV_CTA_BG_COLOR,
  navCtaTextColor: DEFAULT_NAV_CTA_TEXT_COLOR,
  preHeroEnabled: false,
  preHeroMode: 'banner',
  preHeroImageSide: 'left',
  preHeroImageUrl: '',
  preHeroTitle: '',
  preHeroText: '',
  heroSlides: [createEmptySlide()],
  heroHeightMode: 'fixed',
  heroSectionEnabled: true,
  aboutTagline: '',
  aboutBio: '',
  aboutShowTitle: true,
  aboutShowTagline: true,
  aboutBioEnabled: true,
  aboutSectionEnabled: true,
  servicesSectionEnabled: false,
  servicesSectionTitle: '',
  servicesSectionText: '',
  servicesShowTitle: true,
  servicesShowIntro: true,
  servicesDisplayMode: 'stack',
  servicesCarouselPerView: 3,
  servicesCarouselAutoplay: false,
  servicesVisualStyle: 'cards',
  servicesCarouselTransition: 'fade',
  servicesCustomStyle: createEmptySectionCustomStyle(),
  services: [],
  catalogSectionEnabled: false,
  catalogSectionTitle: '',
  catalogSectionText: '',
  catalogShowTitle: true,
  catalogShowIntro: true,
  catalogVisualStyle: 'cards',
  catalogCustomStyle: createEmptySectionCustomStyle(),
  catalogItems: [],
  gallerySectionEnabled: false,
  gallerySectionTitle: '',
  gallerySectionText: '',
  galleryShowTitle: true,
  galleryShowIntro: true,
  galleryPortfolioUrl: '',
  galleryPortfolioLabel: '',
  galleryItems: [],
  videoSectionEnabled: false,
  videoSectionTitle: '',
  videoSectionText: '',
  videoSectionUrl: '',
  videoSectionItems: [],
  videoSectionCarouselAutoplay: false,
  testimonialsEnabled: false,
  testimonialsSectionTitle: '',
  testimonialsShowTitle: true,
  testimonialsShowSubtitle: true,
  testimonials: [],
  blogSectionEnabled: false,
  blogSectionTitle: '',
  blogSectionText: '',
  blogShowTitle: true,
  blogShowIntro: true,
  blogPosts: [],
  contactSectionEnabled: true,
  contactShowTitle: true,
  contactShowSubtitle: true,
  location: '',
  locationMapsUrl: '',
  showLocationMap: false,
  locations: [],
  locationsContactMode: 'shared',
  locationsDisplayMode: 'list',
  contactMapLayout: 'below',
  email: '',
  phone: '',
  phoneCountry: 'mx',
  phoneIsWhatsapp: false,
  socialSectionEnabled: true,
  instagram: '',
  whatsapp: '',
  facebook: '',
  metaSource: { ...EMPTY_META_SOURCE },
  linkedin: '',
  doctoralia: '',
  tiktok: '',
  youtube: '',
  socialIconOnly: false,
  footerSectionEnabled: true,
  termsOfUseEnabled: true,
  termsOfUseTitle: '',
  termsOfUseBody: '',
  privacyPolicyEnabled: true,
  privacyPolicyTitle: '',
  privacyPolicyBody: '',
  analyticsMeasurementId: '',
  customDomain: '',
  useExternalFirebase: false,
  externalFirebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  },
  hostingProvider: 'hub',
  hostingDeployHookUrl: '',
  hostingGithubOwner: '',
  hostingGithubRepo: '',
  hostingGithubWorkflow: 'deploy-template-manual.yml',
  hostingGithubRef: 'master',
  hostingPublicUrl: '',
  sectionThemes: {},
  showHeroSpecialty: false,
  labelLanguage: 'es',
  defaultLanguage: 'es',
  enabledLanguages: ['es'],
  translations: { es: {}, en: {} },
  customLabels: { es: {}, en: {} },
  customEmbeds: [],
  siteMode: 'landing',
  marketing: createEmptyMarketingSettings(),
  seo: {
    defaultTitle: '',
    defaultDescription: '',
    ogImageUrl: '',
    canonicalBaseUrl: '',
  },
  marketingRoutes: [],
  seoArtifacts: {
    sitemapXml: '',
    rssXml: '',
    robotsTxt: '',
    generatedAt: '',
    baseUrl: '',
  },
  siteAccess: {
    stage: 'paid',
    unpaidSince: null,
    adsEnabled: false,
    offline: false,
    updatedAt: null,
  },
};

const LEGACY_ROOT_FIELDS = {
  nombre: 'name',
  especialidad: 'specialty',
  sobreMiFrase: 'aboutTagline',
  sobreMiBio: 'aboutBio',
  ubicacion: 'location',
  ubicacionMapsUrl: 'locationMapsUrl',
  ubicacionMostrarMapa: 'showLocationMap',
  telefono: 'phone',
  telefonoEsWhatsapp: 'phoneIsWhatsapp',
  navModo: 'navMode',
  navIconoUrl: 'navIconUrl',
  navSoloIcono: 'navIconOnly',
  navCtaDestino: 'navCtaTarget',
  preHeroActivo: 'preHeroEnabled',
  preHeroModo: 'preHeroMode',
  preHeroImagenUrl: 'preHeroImageUrl',
  preHeroTitulo: 'preHeroTitle',
  preHeroTexto: 'preHeroText',
  socialSoloIcono: 'socialIconOnly',
};

function normalizeNavMode(value) {
  if (value === 'perfil' || value === 'profile') return 'profile';
  if (value === 'logo') return 'logo';
  return 'profile';
}

function normalizePreHeroMode(value) {
  if (value === 'grafico' || value === 'banner') return 'banner';
  if (value === 'editorial' || value === 'split') return 'split';
  return 'banner';
}

function normalizeNavCtaTarget(value) {
  if (value === 'email' || value === 'whatsapp' || value === 'link') return value;
  return 'email';
}

export { normalizeHeroSlide } from './heroSlides';

function normalizeHeroSlidesFromLegacy(data) {
  const title = String(data?.heroTitle ?? '').trim();
  const text = String(data?.heroSubtitle ?? '').trim();
  const showButtons = data?.heroMostrarBotones !== false;

  if (!title && !text) {
    return [createEmptySlide()];
  }

  return [normalizeHeroSlide({
    imageUrl: '',
    title,
    text,
    showTitle: Boolean(title),
    showText: Boolean(text),
    showButtons,
    showGradient: true,
    buttonsPosition: 'center',
  })];
}

export function normalizePageData(data = {}) {
  const next = { ...data };

  Object.entries(LEGACY_ROOT_FIELDS).forEach(([legacyKey, englishKey]) => {
    if (next[legacyKey] !== undefined && next[englishKey] === undefined) {
      next[englishKey] = next[legacyKey];
    }
    delete next[legacyKey];
  });

  if (next.navMode !== undefined) {
    next.navMode = normalizeNavMode(next.navMode);
  }
  if (next.preHeroMode !== undefined) {
    next.preHeroMode = normalizePreHeroMode(next.preHeroMode);
  }
  next.preHeroImageSide = normalizePreHeroImageSide(next.preHeroImageSide);
  next.servicesDisplayMode = normalizeServicesDisplayMode(next.servicesDisplayMode);
  next.servicesCarouselPerView = normalizeServicesCarouselPerView(next.servicesCarouselPerView);
  next.servicesCarouselAutoplay = normalizeServicesCarouselAutoplay(next.servicesCarouselAutoplay);
  next.servicesVisualStyle = normalizeServicesVisualStyle(next.servicesVisualStyle);
  next.servicesCarouselTransition = normalizeServicesCarouselTransition(next.servicesCarouselTransition);
  next.servicesCustomStyle = normalizeSectionCustomStyle(next.servicesCustomStyle);
  next.catalogVisualStyle = normalizeCatalogVisualStyle(next.catalogVisualStyle);
  next.catalogCustomStyle = normalizeSectionCustomStyle(next.catalogCustomStyle);
  if (next.navCtaTarget !== undefined) {
    next.navCtaTarget = normalizeNavCtaTarget(next.navCtaTarget);
  }

  if (Array.isArray(next.heroSlides) && next.heroSlides.length > 0) {
    next.heroSlides = next.heroSlides.map((slide, index) => normalizeHeroSlide(slide, index));
  } else if (next.heroTitle || next.heroSubtitle) {
    next.heroSlides = normalizeHeroSlidesFromLegacy(next);
  } else if (!Array.isArray(next.heroSlides)) {
    next.heroSlides = [createEmptySlide()];
  }

  next.testimonials = normalizeTestimonials(next.testimonials);
  next.services = normalizeServices(next.services);
  next.catalogItems = normalizeCatalogItems(next.catalogItems);
  next.galleryItems = normalizeGalleryItems(next.galleryItems);
  next.videoSectionItems = normalizeVideoSectionItems(next.videoSectionItems, next.videoSectionUrl);
  next.videoSectionUrl = syncVideoSectionUrlFromItems(next.videoSectionItems, next.videoSectionUrl);
  next.videoSectionCarouselAutoplay = normalizeVideoSectionCarouselAutoplay(next.videoSectionCarouselAutoplay);
  next.blogPosts = normalizeBlogPosts(next.blogPosts);

  next.navIconOnly = next.navIconOnly === true;
  next.navShowCta = next.navShowCta !== false;
  next.navShowMenu = next.navShowMenu === true;
  next.navAlign = normalizeNavAlign(next.navAlign);
  next.navSpecialtyCase = normalizeNavSpecialtyCase(next.navSpecialtyCase);
  next.navShowSpecialty = next.navShowSpecialty !== false;
  next.navCtaBgColor = parseColorToHex(next.navCtaBgColor, DEFAULT_NAV_CTA_BG_COLOR);
  next.navCtaTextColor = parseColorToHex(next.navCtaTextColor, DEFAULT_NAV_CTA_TEXT_COLOR);
  next.preHeroEnabled = next.preHeroEnabled === true;
  next.heroSectionEnabled = next.heroSectionEnabled !== false;
  next.aboutSectionEnabled = next.aboutSectionEnabled !== false;
  next.aboutShowTitle = next.aboutShowTitle !== false;
  next.aboutShowTagline = next.aboutShowTagline !== false;
  next.aboutBioEnabled = next.aboutBioEnabled !== false;
  next.servicesSectionEnabled = next.servicesSectionEnabled === true;
  next.servicesShowTitle = next.servicesShowTitle !== false;
  next.servicesShowIntro = next.servicesShowIntro !== false;
  next.catalogSectionEnabled = next.catalogSectionEnabled === true;
  next.catalogShowTitle = next.catalogShowTitle !== false;
  next.catalogShowIntro = next.catalogShowIntro !== false;
  next.gallerySectionEnabled = next.gallerySectionEnabled === true;
  next.galleryShowTitle = next.galleryShowTitle !== false;
  next.galleryShowIntro = next.galleryShowIntro !== false;
  next.videoSectionEnabled = next.videoSectionEnabled === true;
  next.testimonialsEnabled = next.testimonialsEnabled === true;
  next.testimonialsShowTitle = next.testimonialsShowTitle !== false;
  next.testimonialsShowSubtitle = next.testimonialsShowSubtitle !== false;
  next.blogSectionEnabled = next.blogSectionEnabled === true;
  next.blogShowTitle = next.blogShowTitle !== false;
  next.blogShowIntro = next.blogShowIntro !== false;
  next.contactSectionEnabled = next.contactSectionEnabled !== false;
  next.contactShowTitle = next.contactShowTitle !== false;
  next.contactShowSubtitle = next.contactShowSubtitle !== false;
  next.metaSource = normalizeMetaSource(next.metaSource);
  next.socialSectionEnabled = next.socialSectionEnabled !== false;
  next.footerSectionEnabled = next.footerSectionEnabled !== false;
  Object.assign(next, syncLegacyLocationFields(next));
  next.contactMapLayout = normalizeContactMapLayout(next.contactMapLayout);
  next.phoneIsWhatsapp = next.phoneIsWhatsapp === true;
  next.phoneCountry = normalizePhoneCountry(next.phoneCountry ?? DEFAULT_PHONE_COUNTRY);
  next.socialIconOnly = next.socialIconOnly === true;
  next.showHeroSpecialty = next.showHeroSpecialty === true;
  next.heroHeightMode = normalizeHeroHeightMode(next.heroHeightMode);

  next.sectionThemes = normalizeSectionThemes(next.sectionThemes);

  next.vertical = normalizeVertical(next.vertical);
  next.defaultLanguage = normalizePageLanguage(next.defaultLanguage ?? next.labelLanguage);
  next.enabledLanguages = normalizeEnabledLanguages(next.enabledLanguages, next.defaultLanguage);
  next.labelLanguage = normalizeLabelLanguage(next.defaultLanguage);
  next.customLabels = normalizeCustomLabels(next.customLabels);
  next.customEmbeds = normalizeCustomEmbeds(next.customEmbeds).filter((embed) => (
    isCustomSectionVisible({ ...embed, enabled: true })
    || embed.title
    || embed.htmlCode
    || embed.body
    || embed.quoteText
    || embed.ctaText
    || embed.ctaButtonUrl
    || embed.imageUrl
    || embed.portfolioUrl
    || embed.faqItems.some((item) => item.question || item.answer)
    || embed.steps.some((item) => item.title || item.description)
    || embed.serviceItems.some((item) => (
      item.title || item.description || item.imageUrl || (Array.isArray(item.listItems) && item.listItems.some(Boolean))
    ))
  ));

  next.galleryPortfolioUrl = String(next.galleryPortfolioUrl ?? '').trim();
  next.galleryPortfolioLabel = String(next.galleryPortfolioLabel ?? '').trim();

  next.customDomain = normalizeHostname(next.customDomain);
  next.useExternalFirebase = next.useExternalFirebase === true;
  next.externalFirebase = normalizeExternalFirebase(next.externalFirebase);
  Object.assign(next, normalizeHostingDeployFields(next));

  Object.assign(next, normalizeLegalDocuments(next));
  next.translations = normalizePageTranslations(next.translations, next, next.defaultLanguage);
  delete next.activeLanguage;

  next.siteMode = normalizeSiteMode(next.siteMode);
  next.marketing = normalizeMarketingSettings(next.marketing);
  next.seo = normalizeMarketingSeo(next.seo);
  next.marketingRoutes = normalizeMarketingRoutes(next.marketingRoutes);
  next.seoArtifacts = {
    sitemapXml: String(next.seoArtifacts?.sitemapXml ?? ''),
    rssXml: String(next.seoArtifacts?.rssXml ?? ''),
    robotsTxt: String(next.seoArtifacts?.robotsTxt ?? ''),
    generatedAt: String(next.seoArtifacts?.generatedAt ?? ''),
    baseUrl: String(next.seoArtifacts?.baseUrl ?? '').trim().replace(/\/$/, ''),
  };
  next.siteAccess = normalizeSiteAccess(next.siteAccess);

  return next;
}

export function hydratePageForm(data = {}) {
  return normalizePageData({ ...EMPTY_PAGE, ...data });
}
