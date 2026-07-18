
import { getVerticalLabelOverrides } from './verticals.js';

export const LABEL_LANGUAGES = ['es', 'en'];

/** Neutral base catalog. Industry tone comes from `vertical` overrides (+ customLabels). */
export const LABEL_CATALOGS = {
  es: {
    'nav.bookAppointment': 'Reservar cita',
    'nav.menuOpen': 'Abrir menú',
    'nav.menuClose': 'Cerrar menú',
    'nav.menuVideo': 'Video',
    'placeholders.psychologistName': 'Nombre del profesional',
    'placeholders.specialty': 'Especialidad',
    'placeholders.aboutTagline': 'Una propuesta clara, cercana y profesional.',
    'placeholders.aboutBio': 'Texto descriptivo de la sección.',
    'hero.carouselAria': 'Carrusel principal',
    'hero.contact': 'Contactar',
    'hero.learnMore': 'Conocer más',
    'hero.slidePrevious': 'Diapositiva anterior',
    'hero.slideNext': 'Diapositiva siguiente',
    'hero.slideGoTo': 'Ir a diapositiva {n}',
    'about.title': 'Acerca de',
    'contact.title': 'Contacto',
    'contact.subtitle': 'Escríbeme o llámame para agendar una primera conversación.',
    'contact.location': 'Ubicación',
    'contact.email': 'Email',
    'contact.phone': 'Teléfono',
    'contact.whatsapp': 'WhatsApp',
    'contact.sendMessage': 'Enviar mensaje',
    'contact.mapTitle': 'Mapa de ubicación',
    'social.title': 'Redes sociales',
    'social.subtitle': 'Sígueme y conecta conmigo en mis canales.',
    'services.defaultTitle': 'Servicios',
    'services.defaultIntro': 'Lo que ofrecemos y cómo podemos ayudarte.',
    'services.carouselPrevious': 'Anterior',
    'services.carouselNext': 'Siguiente',
    'services.viewMore': 'Ver más',
    'services.viewLess': 'Ver menos',
    'catalog.defaultTitle': 'Catálogo',
    'catalog.defaultIntro': 'Explora opciones disponibles y encuentra la que mejor se adapte a ti.',
    'catalog.noImage': 'Sin imagen',
    'catalog.viewMore': 'Ver más',
    'catalog.productAlt': 'Producto del catálogo',
    'gallery.defaultTitle': 'Galería',
    'gallery.defaultIntro': 'Un vistazo al espacio y al trabajo.',
    'gallery.imageAlt': 'Imagen de la galería',
    'gallery.close': 'Cerrar imagen',
    'gallery.viewPortfolio': 'Ver portafolio completo',
    'testimonials.defaultTitle': 'Testimonios',
    'testimonials.subtitle': 'Experiencias compartidas por clientes.',
    'blog.defaultTitle': 'Blog',
    'blog.defaultIntro': 'Noticias, artículos y novedades.',
    'blog.imageAlt': 'Imagen del artículo',
    'preHero.ariaLabel': 'Presentación',
    'footer.rightsReserved': 'Todos los derechos reservados.',
    'footer.legalClose': 'Cerrar',
    'footer.poweredBy': 'Powered by',
    'booking.whatsappMessage': 'Hola, me gustaría agendar una cita.',
    'booking.mailtoSubject': 'Consulta de cita',
    'phone.whatsappMessage': 'Hola, me gustaría contactarte.',
  },
  en: {
    'nav.bookAppointment': 'Book appointment',
    'nav.menuOpen': 'Open menu',
    'nav.menuClose': 'Close menu',
    'nav.menuVideo': 'Video',
    'placeholders.psychologistName': 'Professional name',
    'placeholders.specialty': 'Specialty',
    'placeholders.aboutTagline': 'A clear, approachable, and professional offer.',
    'placeholders.aboutBio': 'Descriptive section text.',
    'hero.carouselAria': 'Main carousel',
    'hero.contact': 'Contact',
    'hero.learnMore': 'Learn more',
    'hero.slidePrevious': 'Previous slide',
    'hero.slideNext': 'Next slide',
    'hero.slideGoTo': 'Go to slide {n}',
    'about.title': 'About',
    'contact.title': 'Contact',
    'contact.subtitle': 'Write or call me to schedule a first conversation.',
    'contact.location': 'Location',
    'contact.email': 'Email',
    'contact.phone': 'Phone',
    'contact.whatsapp': 'WhatsApp',
    'contact.sendMessage': 'Send message',
    'contact.mapTitle': 'Location map',
    'social.title': 'Social media',
    'social.subtitle': 'Follow and connect with me on my channels.',
    'services.defaultTitle': 'Services',
    'services.defaultIntro': 'What we offer and how we can help.',
    'services.carouselPrevious': 'Previous',
    'services.carouselNext': 'Next',
    'services.viewMore': 'View more',
    'services.viewLess': 'View less',
    'catalog.defaultTitle': 'Catalog',
    'catalog.defaultIntro': 'Explore available options and find what fits you best.',
    'catalog.noImage': 'No image',
    'catalog.viewMore': 'View more',
    'catalog.productAlt': 'Catalog product',
    'gallery.defaultTitle': 'Gallery',
    'gallery.defaultIntro': 'A glimpse of the space and the work.',
    'gallery.imageAlt': 'Gallery image',
    'gallery.close': 'Close image',
    'gallery.viewPortfolio': 'View full portfolio',
    'testimonials.defaultTitle': 'Testimonials',
    'testimonials.subtitle': 'Experiences shared by clients.',
    'blog.defaultTitle': 'Blog',
    'blog.defaultIntro': 'News, articles, and updates.',
    'blog.imageAlt': 'Article image',
    'preHero.ariaLabel': 'Introduction',
    'footer.rightsReserved': 'All rights reserved.',
    'footer.legalClose': 'Close',
    'footer.poweredBy': 'Powered by',
    'booking.whatsappMessage': 'Hello, I would like to book an appointment.',
    'booking.mailtoSubject': 'Appointment inquiry',
    'phone.whatsappMessage': 'Hello, I would like to get in touch.',
  },
};

export const LABEL_GROUPS = [
  {
    id: 'navigation',
    title: { es: 'Etiquetas de navegación', en: 'Navigation labels' },
    keys: ['nav.bookAppointment', 'nav.menuOpen', 'nav.menuClose', 'nav.menuVideo'],
  },
  {
    id: 'hero',
    title: { es: 'Etiquetas del hero', en: 'Hero labels' },
    keys: [
      'hero.carouselAria',
      'hero.contact',
      'hero.learnMore',
      'hero.slidePrevious',
      'hero.slideNext',
      'hero.slideGoTo',
    ],
  },
  {
    id: 'about',
    title: { es: 'Etiquetas de acerca de', en: 'About labels' },
    keys: ['about.title'],
  },
  {
    id: 'preHero',
    title: { es: 'Etiquetas pre-hero', en: 'Pre-hero labels' },
    keys: ['preHero.ariaLabel'],
  },
  {
    id: 'services',
    title: { es: 'Etiquetas de servicios', en: 'Services labels' },
    keys: [
      'services.defaultTitle',
      'services.defaultIntro',
      'services.carouselPrevious',
      'services.carouselNext',
      'services.viewMore',
      'services.viewLess',
    ],
  },
  {
    id: 'catalog',
    title: { es: 'Etiquetas de catálogo', en: 'Catalog labels' },
    keys: [
      'catalog.defaultTitle',
      'catalog.defaultIntro',
      'catalog.viewMore',
      'catalog.noImage',
      'catalog.productAlt',
    ],
  },
  {
    id: 'gallery',
    title: { es: 'Etiquetas de galería', en: 'Gallery labels' },
    keys: [
      'gallery.defaultTitle',
      'gallery.defaultIntro',
      'gallery.imageAlt',
      'gallery.close',
      'gallery.viewPortfolio',
    ],
  },
  {
    id: 'testimonials',
    title: { es: 'Etiquetas de testimonios', en: 'Testimonials labels' },
    keys: ['testimonials.defaultTitle', 'testimonials.subtitle'],
  },
  {
    id: 'blog',
    title: { es: 'Etiquetas de blog', en: 'Blog labels' },
    keys: ['blog.defaultTitle', 'blog.defaultIntro', 'blog.imageAlt'],
  },
  {
    id: 'contact',
    title: { es: 'Etiquetas de contacto', en: 'Contact labels' },
    keys: [
      'contact.title',
      'contact.subtitle',
      'contact.location',
      'contact.email',
      'contact.phone',
      'contact.whatsapp',
      'contact.sendMessage',
      'contact.mapTitle',
    ],
  },
  {
    id: 'social',
    title: { es: 'Etiquetas de redes', en: 'Social labels' },
    keys: ['social.title', 'social.subtitle'],
  },
  {
    id: 'placeholders',
    title: { es: 'Textos de respaldo', en: 'Fallback texts' },
    keys: ['placeholders.psychologistName', 'placeholders.specialty'],
  },
  {
    id: 'messages',
    title: { es: 'Mensajes automáticos', en: 'Automatic messages' },
    keys: ['booking.whatsappMessage', 'booking.mailtoSubject', 'phone.whatsappMessage'],
  },
  {
    id: 'footer',
    title: { es: 'Etiquetas del pie', en: 'Footer labels' },
    keys: ['footer.rightsReserved', 'footer.legalClose', 'footer.poweredBy'],
  },
];

/** Admin field captions (not shown on the public landing). */
export const LABEL_ADMIN_NAMES = {
  es: {
    'nav.bookAppointment': 'Botón reservar cita',
    'nav.menuOpen': 'Abrir menú',
    'nav.menuClose': 'Cerrar menú',
    'nav.menuVideo': 'Ítem menú video',
    'placeholders.psychologistName': 'Nombre (respaldo)',
    'placeholders.specialty': 'Especialidad (respaldo)',
    'placeholders.aboutTagline': 'Frase / destacado (respaldo)',
    'placeholders.aboutBio': 'Texto descriptivo (respaldo)',
    'hero.carouselAria': 'Aria carrusel',
    'hero.contact': 'Botón contactar',
    'hero.learnMore': 'Botón conocer más',
    'hero.slidePrevious': 'Anterior diapositiva',
    'hero.slideNext': 'Siguiente diapositiva',
    'hero.slideGoTo': 'Ir a diapositiva ({n})',
    'about.title': 'Título de la sección (Acerca de)',
    'contact.title': 'Título contacto',
    'contact.subtitle': 'Subtítulo contacto',
    'contact.location': 'Etiqueta ubicación',
    'contact.email': 'Etiqueta email',
    'contact.phone': 'Etiqueta teléfono',
    'contact.whatsapp': 'Etiqueta WhatsApp',
    'contact.sendMessage': 'Botón enviar mensaje',
    'contact.mapTitle': 'Título mapa',
    'social.title': 'Título redes',
    'social.subtitle': 'Subtítulo redes',
    'services.defaultTitle': 'Título servicios (por defecto)',
    'services.defaultIntro': 'Intro servicios (por defecto)',
    'services.carouselPrevious': 'Botón anterior (carrusel servicios)',
    'services.carouselNext': 'Botón siguiente (carrusel servicios)',
    'services.viewMore': 'Ver más (descripción servicio)',
    'services.viewLess': 'Ver menos (descripción servicio)',
    'catalog.defaultTitle': 'Título catálogo (por defecto)',
    'catalog.defaultIntro': 'Intro catálogo (por defecto)',
    'catalog.noImage': 'Sin imagen',
    'catalog.viewMore': 'Ver más',
    'catalog.productAlt': 'Alt producto',
    'gallery.defaultTitle': 'Título galería (por defecto)',
    'gallery.defaultIntro': 'Intro galería (por defecto)',
    'gallery.imageAlt': 'Alt imagen galería',
    'gallery.close': 'Cerrar imagen',
    'gallery.viewPortfolio': 'Botón ver portafolio',
    'testimonials.defaultTitle': 'Título testimonios (por defecto)',
    'testimonials.subtitle': 'Subtítulo testimonios',
    'blog.defaultTitle': 'Título blog (por defecto)',
    'blog.defaultIntro': 'Intro blog (por defecto)',
    'blog.imageAlt': 'Alt imagen blog',
    'preHero.ariaLabel': 'Aria pre-hero',
    'footer.rightsReserved': 'Derechos reservados',
    'footer.legalClose': 'Cerrar diálogo legal',
    'footer.poweredBy': 'Powered by',
    'booking.whatsappMessage': 'Mensaje WhatsApp (cita)',
    'booking.mailtoSubject': 'Asunto email',
    'phone.whatsappMessage': 'Mensaje WhatsApp (teléfono)',
  },
  en: {
    'nav.bookAppointment': 'Book appointment button',
    'nav.menuOpen': 'Open menu',
    'nav.menuClose': 'Close menu',
    'nav.menuVideo': 'Video menu item',
    'placeholders.psychologistName': 'Name (fallback)',
    'placeholders.specialty': 'Specialty (fallback)',
    'placeholders.aboutTagline': 'Tagline (fallback)',
    'placeholders.aboutBio': 'Description text (fallback)',
    'hero.carouselAria': 'Carousel aria',
    'hero.contact': 'Contact button',
    'hero.learnMore': 'Learn more button',
    'hero.slidePrevious': 'Previous slide',
    'hero.slideNext': 'Next slide',
    'hero.slideGoTo': 'Go to slide ({n})',
    'about.title': 'Section title (About)',
    'contact.title': 'Contact title',
    'contact.subtitle': 'Contact subtitle',
    'contact.location': 'Location label',
    'contact.email': 'Email label',
    'contact.phone': 'Phone label',
    'contact.whatsapp': 'WhatsApp label',
    'contact.sendMessage': 'Send message button',
    'contact.mapTitle': 'Map title',
    'social.title': 'Social title',
    'social.subtitle': 'Social subtitle',
    'services.defaultTitle': 'Services title (default)',
    'services.defaultIntro': 'Services intro (default)',
    'services.carouselPrevious': 'Previous (services carousel)',
    'services.carouselNext': 'Next (services carousel)',
    'services.viewMore': 'View more (service description)',
    'services.viewLess': 'View less (service description)',
    'catalog.defaultTitle': 'Catalog title (default)',
    'catalog.defaultIntro': 'Catalog intro (default)',
    'catalog.noImage': 'No image',
    'catalog.viewMore': 'View more',
    'catalog.productAlt': 'Product alt',
    'gallery.defaultTitle': 'Gallery title (default)',
    'gallery.defaultIntro': 'Gallery intro (default)',
    'gallery.imageAlt': 'Gallery image alt',
    'gallery.close': 'Close image',
    'gallery.viewPortfolio': 'View portfolio button',
    'testimonials.defaultTitle': 'Testimonials title (default)',
    'testimonials.subtitle': 'Testimonials subtitle',
    'blog.defaultTitle': 'Blog title (default)',
    'blog.defaultIntro': 'Blog intro (default)',
    'blog.imageAlt': 'Blog image alt',
    'preHero.ariaLabel': 'Pre-hero aria',
    'footer.rightsReserved': 'Rights reserved',
    'footer.legalClose': 'Close legal dialog',
    'footer.poweredBy': 'Powered by',
    'booking.whatsappMessage': 'WhatsApp message (booking)',
    'booking.mailtoSubject': 'Email subject',
    'phone.whatsappMessage': 'WhatsApp message (phone)',
  },
};

export function normalizeLabelLanguage(value) {
  return value === 'en' ? 'en' : 'es';
}

export function getLabelGroupTitle(group, language = 'es') {
  const lang = normalizeLabelLanguage(language);
  const title = group?.title;
  if (!title) return '';
  if (typeof title === 'string') return title;
  return title[lang] || title.es || title.en || '';
}

export function getLabelAdminName(key, language = 'es') {
  const lang = normalizeLabelLanguage(language);
  return LABEL_ADMIN_NAMES[lang]?.[key]
    || LABEL_ADMIN_NAMES.es?.[key]
    || key;
}

function isFlatCustomLabels(value) {
  return Object.keys(value).some((key) => key.includes('.'));
}

export function normalizeCustomLabels(value) {
  if (!value || typeof value !== 'object') {
    return { es: {}, en: {} };
  }

  if (isFlatCustomLabels(value)) {
    const flat = {};
    Object.entries(value).forEach(([key, labelValue]) => {
      const trimmed = String(labelValue ?? '').trim();
      if (trimmed) flat[key] = trimmed;
    });
    return { es: flat, en: {} };
  }

  const next = { es: {}, en: {} };
  LABEL_LANGUAGES.forEach((lang) => {
    const bucket = value[lang];
    if (!bucket || typeof bucket !== 'object') return;
    Object.entries(bucket).forEach(([key, labelValue]) => {
      const trimmed = String(labelValue ?? '').trim();
      if (trimmed) next[lang][key] = trimmed;
    });
  });
  return next;
}

export function sanitizeCustomLabelsForSave(customLabels, language) {
  const normalized = normalizeCustomLabels(customLabels);
  const lang = normalizeLabelLanguage(language);
  const bucket = { ...normalized[lang] };
  Object.keys(bucket).forEach((key) => {
    if (!String(bucket[key] ?? '').trim()) delete bucket[key];
  });
  return {
    ...normalized,
    [lang]: bucket,
  };
}

export function resolvePageLabels(page = {}) {
  const lang = normalizeLabelLanguage(page.labelLanguage);
  const base = LABEL_CATALOGS[lang] ?? LABEL_CATALOGS.es;
  const verticalOverrides = getVerticalLabelOverrides(page.vertical, lang);
  const customByLang = normalizeCustomLabels(page.customLabels);
  const customOverrides = customByLang[lang] ?? {};

  return {
    __language: lang,
    ...base,
    ...verticalOverrides,
    ...customOverrides,
  };
}

export function getLabel(labels, key, vars = {}) {
  if (key === '__language') return '';
  const lang = normalizeLabelLanguage(labels?.__language);
  const catalog = LABEL_CATALOGS[lang] ?? LABEL_CATALOGS.es;
  let text = labels?.[key] ?? catalog[key] ?? LABEL_CATALOGS.es[key] ?? key;
  Object.entries(vars).forEach(([name, value]) => {
    text = text.replace(`{${name}}`, String(value));
  });
  return text;
}

export function getCatalogLabel(language, key) {
  const lang = normalizeLabelLanguage(language);
  return LABEL_CATALOGS[lang]?.[key] ?? LABEL_CATALOGS.es[key] ?? key;
}

/** Default label for a page before customLabels (base + vertical). */
export function getDefaultLabelForPage(page = {}, key) {
  const labels = resolvePageLabels({
    ...page,
    customLabels: { es: {}, en: {} },
  });
  return labels[key] ?? getCatalogLabel(page.labelLanguage, key);
}

export function getCustomLabelValue(customLabels, language, key) {
  const lang = normalizeLabelLanguage(language);
  const normalized = normalizeCustomLabels(customLabels);
  return normalized[lang]?.[key] ?? '';
}

export function setCustomLabelValue(customLabels, language, key, value) {
  const lang = normalizeLabelLanguage(language);
  const base = normalizeCustomLabels(customLabels);
  const nextValue = String(value ?? '');
  const nextBucket = { ...(base[lang] || {}) };

  // Keep spaces while typing; only clear when the field is empty.
  if (nextValue.length === 0) {
    delete nextBucket[key];
  } else {
    nextBucket[key] = nextValue;
  }

  return {
    es: { ...(base.es || {}) },
    en: { ...(base.en || {}) },
    [lang]: nextBucket,
  };
}
