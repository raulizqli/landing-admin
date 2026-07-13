
export const LABEL_LANGUAGES = ['es', 'en'];

export const LABEL_CATALOGS = {
  es: {
    'nav.bookAppointment': 'Reservar cita',
    'placeholders.psychologistName': 'Nombre de la psicóloga',
    'placeholders.specialty': 'Especialidad',
    'placeholders.aboutTagline': 'Cada proceso es único, y mereces ser escuchada con atención y cuidado.',
    'placeholders.aboutBio': 'Biografía profesional.',
    'hero.carouselAria': 'Carrusel principal',
    'hero.contact': 'Contactar',
    'hero.learnMore': 'Conocer más',
    'hero.slidePrevious': 'Diapositiva anterior',
    'hero.slideNext': 'Diapositiva siguiente',
    'hero.slideGoTo': 'Ir a diapositiva {n}',
    'about.title': 'Sobre mí',
    'contact.title': 'Contacto',
    'contact.subtitle': 'Estoy aquí para acompañarte. Escríbeme o llámame para agendar una primera consulta.',
    'contact.location': 'Ubicación',
    'contact.email': 'Email',
    'contact.phone': 'Teléfono',
    'contact.whatsapp': 'WhatsApp',
    'contact.sendMessage': 'Enviar mensaje',
    'contact.mapTitle': 'Mapa de ubicación',
    'social.title': 'Redes sociales',
    'social.subtitle': 'Sígueme y conecta conmigo en mis canales.',
    'services.defaultTitle': 'Servicios y áreas de atención',
    'services.defaultIntro': 'Temas y acompañamientos que podemos trabajar juntas.',
    'catalog.defaultTitle': 'Catálogo',
    'catalog.defaultIntro': 'Explora opciones disponibles y encuentra la que mejor se adapte a ti.',
    'catalog.noImage': 'Sin imagen',
    'catalog.viewMore': 'Ver más',
    'catalog.productAlt': 'Producto del catálogo',
    'testimonials.defaultTitle': 'Testimonios',
    'testimonials.subtitle': 'Experiencias compartidas con respeto y confidencialidad.',
    'preHero.ariaLabel': 'Presentación',
    'footer.rightsReserved': 'Todos los derechos reservados.',
    'booking.whatsappMessage': 'Hola, me gustaría agendar una cita.',
    'booking.mailtoSubject': 'Consulta de cita',
    'phone.whatsappMessage': 'Hola, me gustaría contactarte.',
  },
  en: {
    'nav.bookAppointment': 'Book appointment',
    'placeholders.psychologistName': 'Professional name',
    'placeholders.specialty': 'Specialty',
    'placeholders.aboutTagline': 'Every process is unique, and you deserve to be heard with care and attention.',
    'placeholders.aboutBio': 'Professional biography.',
    'hero.carouselAria': 'Main carousel',
    'hero.contact': 'Contact',
    'hero.learnMore': 'Learn more',
    'hero.slidePrevious': 'Previous slide',
    'hero.slideNext': 'Next slide',
    'hero.slideGoTo': 'Go to slide {n}',
    'about.title': 'About me',
    'contact.title': 'Contact',
    'contact.subtitle': 'I am here to support you. Write or call me to schedule a first consultation.',
    'contact.location': 'Location',
    'contact.email': 'Email',
    'contact.phone': 'Phone',
    'contact.whatsapp': 'WhatsApp',
    'contact.sendMessage': 'Send message',
    'contact.mapTitle': 'Location map',
    'social.title': 'Social media',
    'social.subtitle': 'Follow and connect with me on my channels.',
    'services.defaultTitle': 'Services and areas of care',
    'services.defaultIntro': 'Topics and support we can work on together.',
    'catalog.defaultTitle': 'Catalog',
    'catalog.defaultIntro': 'Explore available options and find what fits you best.',
    'catalog.noImage': 'No image',
    'catalog.viewMore': 'View more',
    'catalog.productAlt': 'Catalog product',
    'testimonials.defaultTitle': 'Testimonials',
    'testimonials.subtitle': 'Experiences shared with respect and confidentiality.',
    'preHero.ariaLabel': 'Introduction',
    'footer.rightsReserved': 'All rights reserved.',
    'booking.whatsappMessage': 'Hello, I would like to book an appointment.',
    'booking.mailtoSubject': 'Appointment inquiry',
    'phone.whatsappMessage': 'Hello, I would like to get in touch.',
  },
};

export const LABEL_GROUPS = [
  {
    id: 'navigation',
    title: 'Navegación',
    keys: ['nav.bookAppointment'],
  },
  {
    id: 'hero',
    title: 'Hero',
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
    title: 'Sobre mí',
    keys: ['about.title', 'placeholders.aboutTagline', 'placeholders.aboutBio'],
  },
  {
    id: 'sections',
    title: 'Secciones',
    keys: [
      'services.defaultTitle',
      'services.defaultIntro',
      'catalog.defaultTitle',
      'catalog.defaultIntro',
      'catalog.viewMore',
      'catalog.noImage',
      'catalog.productAlt',
      'testimonials.defaultTitle',
      'testimonials.subtitle',
      'contact.title',
      'contact.subtitle',
      'social.title',
      'social.subtitle',
      'preHero.ariaLabel',
    ],
  },
  {
    id: 'contact',
    title: 'Contacto',
    keys: [
      'contact.location',
      'contact.email',
      'contact.phone',
      'contact.whatsapp',
      'contact.sendMessage',
      'contact.mapTitle',
    ],
  },
  {
    id: 'placeholders',
    title: 'Textos de respaldo',
    keys: ['placeholders.psychologistName', 'placeholders.specialty'],
  },
  {
    id: 'messages',
    title: 'Mensajes automáticos',
    keys: ['booking.whatsappMessage', 'booking.mailtoSubject', 'phone.whatsappMessage'],
  },
  {
    id: 'footer',
    title: 'Pie de página',
    keys: ['footer.rightsReserved'],
  },
];

export const LABEL_ADMIN_NAMES = {
  'nav.bookAppointment': 'Botón reservar cita',
  'placeholders.psychologistName': 'Nombre (respaldo)',
  'placeholders.specialty': 'Especialidad (respaldo)',
  'placeholders.aboutTagline': 'Frase sobre mí (respaldo)',
  'placeholders.aboutBio': 'Biografía (respaldo)',
  'hero.carouselAria': 'Aria carrusel',
  'hero.contact': 'Botón contactar',
  'hero.learnMore': 'Botón conocer más',
  'hero.slidePrevious': 'Anterior diapositiva',
  'hero.slideNext': 'Siguiente diapositiva',
  'hero.slideGoTo': 'Ir a diapositiva ({n})',
  'about.title': 'Título sobre mí',
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
  'catalog.defaultTitle': 'Título catálogo (por defecto)',
  'catalog.defaultIntro': 'Intro catálogo (por defecto)',
  'catalog.noImage': 'Sin imagen',
  'catalog.viewMore': 'Ver más',
  'catalog.productAlt': 'Alt producto',
  'testimonials.defaultTitle': 'Título testimonios (por defecto)',
  'testimonials.subtitle': 'Subtítulo testimonios',
  'preHero.ariaLabel': 'Aria pre-hero',
  'footer.rightsReserved': 'Derechos reservados',
  'booking.whatsappMessage': 'Mensaje WhatsApp (cita)',
  'booking.mailtoSubject': 'Asunto email',
  'phone.whatsappMessage': 'Mensaje WhatsApp (teléfono)',
};

export function normalizeLabelLanguage(value) {
  return value === 'en' ? 'en' : 'es';
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
  const customByLang = normalizeCustomLabels(page.customLabels);
  const overrides = customByLang[lang] ?? {};

  return {
    ...base,
    ...overrides,
  };
}

export function getLabel(labels, key, vars = {}) {
  const catalog = LABEL_CATALOGS.es;
  let text = labels?.[key] ?? catalog[key] ?? key;
  Object.entries(vars).forEach(([name, value]) => {
    text = text.replace(`{${name}}`, String(value));
  });
  return text;
}

export function getCatalogLabel(language, key) {
  const lang = normalizeLabelLanguage(language);
  return LABEL_CATALOGS[lang]?.[key] ?? LABEL_CATALOGS.es[key] ?? key;
}

export function getCustomLabelValue(customLabels, language, key) {
  const normalized = normalizeCustomLabels(customLabels);
  const lang = normalizeLabelLanguage(language);
  return normalized[lang]?.[key] ?? '';
}

export function setCustomLabelValue(customLabels, language, key, value) {
  const normalized = normalizeCustomLabels(customLabels);
  const lang = normalizeLabelLanguage(language);
  const trimmed = String(value ?? '').trim();
  const nextBucket = { ...normalized[lang] };

  if (trimmed) {
    nextBucket[key] = trimmed;
  } else {
    delete nextBucket[key];
  }

  return {
    ...normalized,
    [lang]: nextBucket,
  };
}
