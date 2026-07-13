
import { createEmptySlide } from './heroSlides';
import { normalizeTestimonials } from './testimonials';
import { normalizeServices } from './services';
import { normalizeCatalogItems } from './catalog';
import { normalizeSectionThemes } from './sectionBackground';
import { normalizeExternalFirebase } from './externalFirebase';
import { normalizeHostname } from './hostname';
import { normalizeCustomLabels, normalizeLabelLanguage } from './labels';
import { normalizeCustomEmbeds } from './customEmbeds';

export const EMPTY_PAGE = {
  name: '',
  specialty: '',
  navMode: 'profile',
  navIconUrl: '',
  navLogoUrl: '',
  navIconOnly: false,
  navCtaTarget: 'email',
  navCtaLink: '',
  preHeroEnabled: false,
  preHeroMode: 'banner',
  preHeroImageUrl: '',
  preHeroTitle: '',
  preHeroText: '',
  heroSlides: [createEmptySlide()],
  aboutTagline: '',
  aboutBio: '',
  servicesSectionEnabled: false,
  servicesSectionTitle: '',
  servicesSectionText: '',
  services: [],
  catalogSectionEnabled: false,
  catalogSectionTitle: '',
  catalogSectionText: '',
  catalogItems: [],
  videoSectionEnabled: false,
  videoSectionTitle: '',
  videoSectionText: '',
  videoSectionUrl: '',
  testimonialsEnabled: false,
  testimonialsSectionTitle: '',
  testimonials: [],
  location: '',
  locationMapsUrl: '',
  showLocationMap: false,
  email: '',
  phone: '',
  phoneIsWhatsapp: false,
  instagram: '',
  whatsapp: '',
  facebook: '',
  linkedin: '',
  doctoralia: '',
  tiktok: '',
  youtube: '',
  socialIconOnly: false,
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
  sectionThemes: {},
  labelLanguage: 'es',
  customLabels: { es: {}, en: {} },
  customEmbeds: [],
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

export function normalizeHeroSlide(slide = {}) {
  return {
    imageUrl: slide.imageUrl || slide.imagenUrl || '',
    videoUrl: slide.videoUrl || slide.videoLink || '',
    title: slide.title || '',
    text: slide.text || slide.texto || '',
    showTitle: slide.showTitle ?? Boolean(slide.mostrarTitulo),
    showText: slide.showText ?? Boolean(slide.mostrarTexto),
    showButtons: slide.showButtons ?? slide.mostrarBotones !== false,
  };
}

function normalizeHeroSlidesFromLegacy(data) {
  const title = String(data?.heroTitle ?? '').trim();
  const text = String(data?.heroSubtitle ?? '').trim();
  const showButtons = data?.heroMostrarBotones !== false;

  if (!title && !text) {
    return [createEmptySlide()];
  }

  return [{
    imageUrl: '',
    title,
    text,
    showTitle: Boolean(title),
    showText: Boolean(text),
    showButtons,
  }];
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
  if (next.navCtaTarget !== undefined) {
    next.navCtaTarget = normalizeNavCtaTarget(next.navCtaTarget);
  }

  if (Array.isArray(next.heroSlides) && next.heroSlides.length > 0) {
    next.heroSlides = next.heroSlides.map(normalizeHeroSlide);
  } else if (next.heroTitle || next.heroSubtitle) {
    next.heroSlides = normalizeHeroSlidesFromLegacy(next);
  } else if (!Array.isArray(next.heroSlides)) {
    next.heroSlides = [createEmptySlide()];
  }

  next.testimonials = normalizeTestimonials(next.testimonials);
  next.services = normalizeServices(next.services);
  next.catalogItems = normalizeCatalogItems(next.catalogItems);

  next.navIconOnly = next.navIconOnly === true;
  next.preHeroEnabled = next.preHeroEnabled === true;
  next.servicesSectionEnabled = next.servicesSectionEnabled === true;
  next.catalogSectionEnabled = next.catalogSectionEnabled === true;
  next.videoSectionEnabled = next.videoSectionEnabled === true;
  next.testimonialsEnabled = next.testimonialsEnabled === true;
  next.showLocationMap = next.showLocationMap === true;
  next.phoneIsWhatsapp = next.phoneIsWhatsapp === true;
  next.socialIconOnly = next.socialIconOnly === true;

  next.sectionThemes = normalizeSectionThemes(next.sectionThemes);

  next.labelLanguage = normalizeLabelLanguage(next.labelLanguage);
  next.customLabels = normalizeCustomLabels(next.customLabels);
  next.customEmbeds = normalizeCustomEmbeds(next.customEmbeds)
    .filter((embed) => embed.htmlCode);

  next.customDomain = normalizeHostname(next.customDomain);
  next.useExternalFirebase = next.useExternalFirebase === true;
  next.externalFirebase = normalizeExternalFirebase(next.externalFirebase);

  return next;
}

export function hydratePageForm(data = {}) {
  return normalizePageData({ ...EMPTY_PAGE, ...data });
}
