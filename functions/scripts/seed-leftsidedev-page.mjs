/**
 * Seed LeftSideDev product landing (pages/leftsidedev).
 * Promotes professional landings as a service/outcome — not the CMS admin.
 * LeftSide colorimetry (dark premium + mint accent). Idempotent merge.
 *
 * Usage:
 *   cd functions && node scripts/seed-leftsidedev-page.mjs
 */
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const PROJECT_ID = 'landing-admin-9452e';
const PAGE_ID = 'leftsidedev';
const CONTACT_MAILTO = 'mailto:hello@leftsidedev.site';
const SITE_URL = 'https://leftsidedev.site';
const LOGO_URL = 'https://landing-admin-9452e.web.app/brand-name.png';
const ICON_URL = 'https://landing-admin-9452e.web.app/favicon-circle.png';

/** LeftSide brand — keep in sync with leftsidedev-site / MarketingSite chrome */
const COLORS = {
  ink: '#070B0A',
  panel: '#0E1613',
  surface: '#121A17',
  mist: '#F4F7F5',
  accent: '#7CFFB2',
  muted: '#9BB0A6',
  white: '#FFFFFF',
};

function theme(backgroundColor, textColor, extra = {}) {
  return {
    backgroundColor,
    textColor,
    useGradient: false,
    gradientColor: backgroundColor,
    gradientDirection: 'to-bottom',
    backgroundOpacity: 100,
    ...extra,
  };
}

function slide(partial) {
  return {
    imageUrl: '',
    videoUrl: '',
    title: '',
    text: '',
    showTitle: true,
    showText: true,
    showButtons: true,
    showGradient: true,
    buttonsPosition: 'center',
    showHeroSpecialty: false,
    ...partial,
  };
}

function service(partial) {
  return {
    layout: 'title_description',
    title: '',
    description: '',
    listItems: [],
    imageUrl: '',
    ...partial,
  };
}

const PAGE = {
  name: 'LeftSideDev',
  specialty: 'Landings profesionales',
  vertical: 'generic',
  siteMode: 'landing',
  navMode: 'logo',
  navIconUrl: ICON_URL,
  navLogoUrl: LOGO_URL,
  navIconOnly: false,
  navSpecialty: 'Landings',
  navSpecialtyCase: 'uppercase',
  navShowSpecialty: true,
  navShowCta: true,
  navShowMenu: true,
  navAlign: 'spread',
  navCtaTarget: 'link',
  navCtaLink: CONTACT_MAILTO,
  navCtaBgColor: '#0A5C3A',
  navCtaTextColor: COLORS.mist,
  preHeroEnabled: false,
  heroSectionEnabled: true,
  showHeroSpecialty: false,
  heroSlides: [
    slide({
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&q=80',
      title: 'Tu negocio merece una landing que convierta',
      text: 'Una página clara, rápida y móvil: servicios, confianza y contacto en un solo lugar.',
      showButtons: true,
      buttonsPosition: 'bottom-left',
    }),
    slide({
      imageUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1600&q=80',
      title: 'Presencia online sin ruido',
      text: 'Diseño premium, mensaje directo y canales listos (email, WhatsApp, mapa) para que te encuentren y te escriban.',
      showButtons: true,
      buttonsPosition: 'center',
    }),
  ],
  heroTitle: 'Tu negocio merece una landing que convierta',
  heroSubtitle:
    'Una página clara, rápida y móvil: servicios, confianza y contacto en un solo lugar.',
  aboutSectionEnabled: true,
  aboutShowTitle: true,
  aboutShowTagline: true,
  aboutBioEnabled: true,
  aboutTagline:
    'Landings hechas para profesionales y negocios que quieren verse serios online — y recibir contactos reales.',
  aboutBio:
    'En LeftSideDev diseñamos y publicamos landings profesionales: la cara digital de tu consultorio, estudio o empresa. No es una web genérica llena de secciones vacías: es una página con un propósito — explicar quién eres, qué ofreces y cómo contactarte — con una estética cuidada y una experiencia que funciona igual de bien en el teléfono que en el escritorio. Tú te enfocas en tu oficio; nosotros en que tu presencia online invite a dar el siguiente paso.',
  servicesSectionEnabled: true,
  servicesSectionTitle: 'Qué logras con tu landing',
  servicesSectionText:
    'Resultados concretos para quien necesita una presencia digital limpia, no un proyecto eterno.',
  servicesShowTitle: true,
  servicesShowIntro: true,
  servicesDisplayMode: 'stack',
  servicesCarouselPerView: 3,
  servicesCarouselAutoplay: false,
  // Solid mist cards + dark body type (custom) — readable on LeftSide dark page chrome.
  servicesVisualStyle: 'custom',
  servicesCustomStyle: {
    backgroundColor: '#F4F7F5',
    borderColor: '#070B0A',
    borderOpacity: 0.1,
    borderWidth: 1,
    borderRadius: 16,
    shadow: 'soft',
    hover: 'lift',
    entrance: 'fade',
    gap: 'normal',
  },
  services: [
    service({
      title: 'Primera impresión que vende',
      description:
        'Hero, propuesta de valor y llamados a la acción claros. Quien llega entiende en segundos si eres la opción correcta.',
    }),
    service({
      title: 'Servicios y confianza',
      description:
        'Bloques de servicios, acerca de ti, testimonios y FAQ listos para generar credibilidad sin saturar la página.',
    }),
    service({
      title: 'Contacto sin fricción',
      description:
        'Email, WhatsApp, ubicación y mapa cuando los necesites. El visitante pasa de “me interesa” a escribirte en un toque.',
    }),
    service({
      layout: 'title_list',
      title: 'Pensada para crecer contigo',
      listItems: [
        'Diseño responsive y tipografía legible',
        'Secciones activables según tu negocio',
        'Idioma y etiquetas adaptables (ES / EN)',
        'Dominio propio cuando estés listo',
      ],
    }),
  ],
  catalogSectionEnabled: false,
  gallerySectionEnabled: false,
  videoSectionEnabled: false,
  blogSectionEnabled: false,
  testimonialsEnabled: true,
  testimonialsSectionTitle: 'Para quién es',
  testimonials: [
    {
      title: 'Consultorios y salud',
      quote:
        'Una landing limpia con mis servicios, biografía y WhatsApp. Mis pacientes me encuentran y agendan sin pasar por redes saturadas.',
      imageUrl: '',
    },
    {
      title: 'Estudios y freelancers',
      quote:
        'Necesitaba algo más serio que un link en bio: portafolio breve, servicios y un mail de contacto que se vea profesional.',
      imageUrl: '',
    },
    {
      title: 'Negocios locales',
      quote:
        'Ubicación, horarios implícitos en el mensaje y un CTA claro. La página habla por la marca cuando no puedo contestar el teléfono.',
      imageUrl: '',
    },
  ],
  contactSectionEnabled: true,
  contactMapLayout: 'below',
  location: 'Remoto · LATAM · Global',
  locationMapsUrl: '',
  showLocationMap: false,
  email: 'hello@leftsidedev.site',
  phone: '',
  phoneIsWhatsapp: false,
  socialSectionEnabled: true,
  socialIconOnly: false,
  instagram: '',
  whatsapp: '',
  facebook: '',
  linkedin: 'https://www.linkedin.com/',
  doctoralia: '',
  tiktok: '',
  youtube: '',
  footerSectionEnabled: true,
  termsOfUseEnabled: true,
  privacyPolicyEnabled: true,
  termsOfUseTitle: '',
  termsOfUseBody: '',
  privacyPolicyTitle: '',
  privacyPolicyBody: '',
  analyticsMeasurementId: '',
  // Corporate site lives on leftsidedev-site/; this doc is the product showcase on the template host.
  customDomain: '',
  useExternalFirebase: false,
  labelLanguage: 'es',
  defaultLanguage: 'es',
  enabledLanguages: ['es', 'en'],
  customLabels: {
    es: {
      'nav.bookAppointment': 'Quiero mi landing',
      'about.title': 'Por qué una landing',
      'services.defaultTitle': 'Qué logras con tu landing',
      'services.defaultIntro':
        'Resultados concretos para quien necesita una presencia digital limpia, no un proyecto eterno.',
      'testimonials.defaultTitle': 'Para quién es',
      'testimonials.subtitle': 'Perfiles típicos (quotes ilustrativas).',
      'contact.title': 'Hablemos de tu landing',
      'contact.subtitle':
        'Cuéntanos tu rubro, ciudad e idioma. Te proponemos estructura y tono en una respuesta clara.',
      'hero.contact': 'Escribirnos',
      'hero.learnMore': 'Ver beneficios',
      'placeholders.psychologistName': 'LeftSideDev',
      'placeholders.specialty': 'Landings profesionales',
    },
    en: {
      'nav.bookAppointment': 'Get my landing',
      'about.title': 'Why a landing',
      'services.defaultTitle': 'What your landing delivers',
      'testimonials.defaultTitle': 'Who it’s for',
      'contact.title': 'Let’s talk about your landing',
      'hero.contact': 'Email us',
      'hero.learnMore': 'See benefits',
      'placeholders.psychologistName': 'LeftSideDev',
      'placeholders.specialty': 'Professional landings',
    },
  },
  sectionThemes: {
    page: theme(COLORS.ink, COLORS.mist),
    nav: theme(COLORS.ink, COLORS.mist, { backgroundOpacity: 92 }),
    hero: theme(COLORS.ink, COLORS.mist),
    about: theme(COLORS.panel, COLORS.mist),
    services: theme(COLORS.ink, COLORS.mist),
    testimonials: theme(COLORS.surface, COLORS.mist),
    contact: theme(COLORS.panel, COLORS.mist),
    social: theme(COLORS.panel, COLORS.mist),
    footer: theme(COLORS.ink, COLORS.muted),
  },
  customEmbeds: [
    {
      id: 'lsd-steps',
      enabled: true,
      type: 'steps',
      label: 'Cómo empieza',
      title: 'De la idea a tu landing',
      placement: 'after_services',
      htmlCode: '',
      body: '',
      quoteText: '',
      quoteAttribution: '',
      ctaText: '',
      ctaButtonLabel: '',
      ctaButtonUrl: '',
      faqItems: [],
      steps: [
        {
          title: 'Brief corto',
          description:
            'Nombre, rubro, tono, servicios clave y canales de contacto. Con eso basta para proponer estructura.',
        },
        {
          title: 'Diseño y copy',
          description:
            'Armamos hero, acerca de, servicios y contacto con la colorimetría de tu marca (o la nuestra).',
        },
        {
          title: 'Publicación',
          description:
            'Tu landing queda online, revisable en móvil y lista para compartir el enlace o conectar dominio.',
        },
        {
          title: 'Ajustes vivos',
          description:
            'Cuando cambien servicios o textos, actualizamos la página sin empezar de cero.',
        },
      ],
      imageUrl: '',
      serviceItems: [],
      fullWidth: false,
      sortOrder: 10,
    },
    {
      id: 'lsd-pricing',
      enabled: true,
      type: 'faq',
      label: 'Planes',
      title: 'Planes y precios',
      placement: 'after_testimonials',
      htmlCode: '',
      body: '',
      quoteText: '',
      quoteAttribution: '',
      ctaText: '',
      ctaButtonLabel: '',
      ctaButtonUrl: '',
      // Keep in sync with packages/landing-core/src/billingPlans.js
      faqItems: [
        {
          question: 'Starter — MX$189 / US$10 al mes',
          answer:
            '1 página · 1 ubicación · secciones básicas · vista previa en vivo · LeftSide AI Lite · soporte por email. Ideal para publicar tu primera landing profesional.',
        },
        {
          question: 'Pro — MX$469 / US$25 al mes',
          answer:
            '1 página · ubicaciones ilimitadas · blog, galería, embeds, hosting y subida de imágenes · carrusel y estilos personalizados · mapa lateral · 3 logos IA/mes · 2 códigos QR · LeftSide AI Pro.',
        },
        {
          question: 'Agency — MX$1,399 / US$75 al mes',
          answer:
            'Hasta 5 páginas · ubicaciones ilimitadas · Firebase externo + deploy de hosting · todo lo de Pro · logos IA y QR ilimitados · BYOK de IA · add-on opcional Marketing Site.',
        },
        {
          question: 'Enterprise — a medida',
          answer:
            'Páginas ilimitadas · Marketing Site multi-ruta · onboarding asistido · soporte 24/7. Cotización según volumen y requisitos — escríbenos a hello@leftsidedev.site.',
        },
      ],
      steps: [],
      imageUrl: '',
      serviceItems: [],
      fullWidth: false,
      sortOrder: 15,
    },
    {
      id: 'lsd-faq',
      enabled: true,
      type: 'faq',
      label: 'FAQ',
      title: 'Preguntas frecuentes',
      placement: 'after_testimonials',
      htmlCode: '',
      body: '',
      quoteText: '',
      quoteAttribution: '',
      ctaText: '',
      ctaButtonLabel: '',
      ctaButtonUrl: '',
      faqItems: [
        {
          question: '¿Es una web completa o una landing?',
          answer:
            'Es una landing: una página enfocada en presentación y conversión. Ideal para profesionales y negocios que no necesitan un sitio de 20 secciones.',
        },
        {
          question: '¿Cuánto tarda?',
          answer:
            'Con un brief claro, la primera versión útil suele salir en días, no en meses. Los tiempos exactos dependen del contenido y las revisiones.',
        },
        {
          question: '¿Puedo usar mi dominio?',
          answer:
            'Sí. Puedes empezar con un enlace de LeftSideDev y conectar tu dominio cuando quieras.',
        },
        {
          question: '¿Incluye WhatsApp, mapa o blog?',
          answer:
            'Depende del plan: lo básico entra en Starter; blog, galería y embeds avanzados desde Pro. Activamos solo las secciones que aportan.',
        },
      ],
      steps: [],
      imageUrl: '',
      serviceItems: [],
      fullWidth: false,
      sortOrder: 20,
    },
    {
      id: 'lsd-cta',
      enabled: true,
      type: 'cta',
      label: 'CTA final',
      title: 'Listo para una landing que hable por ti',
      placement: 'before_footer',
      htmlCode: '',
      body: '',
      quoteText: '',
      quoteAttribution: '',
      ctaText:
        'Escríbenos con tu rubro y ciudad. Te respondemos con una propuesta de estructura y siguientes pasos — sin compromiso de plataforma.',
      ctaButtonLabel: 'Escribir a LeftSideDev',
      ctaButtonUrl: CONTACT_MAILTO,
      faqItems: [],
      steps: [],
      imageUrl: '',
      serviceItems: [],
      fullWidth: true,
      sortOrder: 30,
    },
  ],
};

function init() {
  if (getApps().length === 0) {
    initializeApp({
      credential: applicationDefault(),
      projectId: PROJECT_ID,
    });
  }
}

async function clearMarketingRoutes(db, pageId) {
  const col = db.collection('pages').doc(pageId).collection('routes');
  const existing = await col.get();
  if (existing.empty) return 0;
  const batch = db.batch();
  existing.docs.forEach((docSnap) => batch.delete(docSnap.ref));
  await batch.commit();
  return existing.size;
}

async function main() {
  init();
  const db = getFirestore();
  const ref = db.collection('pages').doc(PAGE_ID);

  await ref.set(
    {
      ...PAGE,
      // Explicitly leave marketing mode so the template renders the classic landing.
      marketing: FieldValue.delete(),
      seo: FieldValue.delete(),
      seoArtifacts: FieldValue.delete(),
      updatedAt: new Date().toISOString(),
      seededAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const removedRoutes = await clearMarketingRoutes(db, PAGE_ID);

  console.log(`page ok  ${PAGE_ID}`);
  console.log(`siteMode  landing`);
  console.log(`routes removed  ${removedRoutes}`);
  console.log(`contact  hello@leftsidedev.site`);
  console.log(`live     ${SITE_URL}/?pageId=${PAGE_ID}`);
  console.log(`local    http://localhost:5174/?pageId=${PAGE_ID}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
