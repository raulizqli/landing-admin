/**
 * Seed Toqua product landing (pages/toqua).
 * Clones pages/leftsidedev then applies Toqua brand assets, copy, and default landing colorimetry.
 *
 * Usage:
 *   cd functions && node scripts/seed-toqua-page.mjs
 *
 * Generic clone (any page → any id):
 *   node scripts/clone-page.mjs --to <targetId> [--from <sourceId>]
 */
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { clonePageDocument } from './lib/page-clone.mjs';
import { createEmptySectionCustomStyle } from '../../packages/landing-core/src/sectionCustomStyle.js';
import {
  TOQUA_PURPLE,
  TOQUA_WHITE,
  createToquaSectionThemes,
  heroButtonColors,
  serviceWithBrandColors,
} from './lib/toqua-theme.mjs';
const DEFAULT_NAV_CTA_TEXT_COLOR = TOQUA_WHITE;

const PROJECT_ID = 'landing-admin-9452e';
const PAGE_ID = 'toqua';
const ADMIN_BASE = 'https://admin.toqua.site';
const CONTACT_MAILTO = 'mailto:hello@toqua.site';
const SIGNUP_URL = 'https://admin.toqua.site';
const SITE_URL = 'https://web.toqua.site';

const ICON_URL = `${ADMIN_BASE}/brand/toqua-mark-square-dark.png`;
const LOGO_URL = `${ADMIN_BASE}/brand/toqua-lockup-horizontal-light-tagline-short.png`;

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
    ...heroButtonColors(),
    ...partial,
  };
}

function service(partial) {
  return serviceWithBrandColors(partial);
}

const PAGE = {
  name: 'Toqua',
  specialty: 'Páginas profesionales',
  vertical: 'generic',
  siteMode: 'landing',
  navMode: 'logo',
  navIconUrl: ICON_URL,
  navLogoUrl: LOGO_URL,
  navIconOnly: false,
  navSpecialty: 'CREATE · PUBLISH · READY',
  navSpecialtyCase: 'uppercase',
  navShowSpecialty: true,
  navShowCta: true,
  navShowMenu: true,
  navAlign: 'spread',
  navCtaTarget: 'link',
  navCtaLink: SIGNUP_URL,
  navCtaBgColor: DEFAULT_NAV_CTA_BG_COLOR,
  navCtaTextColor: DEFAULT_NAV_CTA_TEXT_COLOR,
  preHeroEnabled: false,
  heroSectionEnabled: true,
  showHeroSpecialty: false,
  heroSlides: [
    slide({
      imageUrl: 'https://images.unsplash.com/photo-1573497019940-168c28acb933?w=1600&q=80',
      title: 'Tu página profesional, lista para que te contacten',
      text: 'Cuenta quién eres, qué ofreces y cómo escribirte — sin pelear con plantillas genéricas ni editores confusos.',
      showButtons: true,
      buttonsPosition: 'bottom-left',
    }),
    slide({
      imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&q=80',
      title: 'Diseño calmado, mensaje claro',
      text: 'Pensado para consultorios y prácticas: psicología, pediatría, odontología, derecho y más.',
      showButtons: true,
      buttonsPosition: 'center',
    }),
  ],
  heroTitle: 'Tu página profesional, lista para que te contacten',
  heroSubtitle:
    'Cuenta quién eres, qué ofreces y cómo escribirte — sin pelear con plantillas genéricas ni editores confusos.',
  aboutSectionEnabled: true,
  aboutShowTitle: true,
  aboutShowTagline: true,
  aboutBioEnabled: true,
  aboutTagline:
    'Toqua te ayuda a crear y publicar la página de tu consultorio en minutos — con textos claros y un diseño que genera confianza.',
  aboutBio:
    'Muchos profesionales dependen del boca a boca, pero cuando alguien los busca en internet la primera impresión importa. Toqua te da una página con secciones pensadas para tu trabajo: quién eres, qué ofreces, cómo contactarte, testimonios y más. Editas en un panel claro, ves los cambios al instante y publicas cuando estés lista. Sin convertirte en diseñadora web.',
  servicesSectionEnabled: true,
  servicesSectionTitle: 'Qué incluye tu página',
  servicesSectionText:
    'Todo lo que un consultorio necesita para presentarse bien en línea, sin secciones vacías ni jerga técnica.',
  servicesShowTitle: true,
  servicesShowIntro: true,
  servicesDisplayMode: 'stack',
  servicesCarouselPerView: 3,
  servicesCarouselAutoplay: false,
  servicesVisualStyle: 'cards',
  servicesCustomStyle: createEmptySectionCustomStyle(),
  services: [
    service({
      title: 'Presentación clara',
      description:
        'Hero, bio y servicios con lenguaje que tus clientes entienden. Una primera impresión honesta y profesional.',
    }),
    service({
      title: 'Contacto sin fricción',
      description:
        'Correo, teléfono o WhatsApp visibles. Un botón principal para que sepan cómo dar el siguiente paso.',
    }),
    service({
      title: 'Secciones que suman',
      description:
        'Testimonios, FAQ, blog o galería cuando los necesites. Ocultas lo que aún no tienes.',
    }),
    service({
      layout: 'title_list',
      title: 'Lista para crecer contigo',
      listItems: [
        'Vista previa en vivo mientras editas',
        'Diseño responsive (móvil primero)',
        'Etiquetas en español o inglés',
        'Dominio propio cuando lo necesites',
      ],
    }),
  ],
  catalogSectionEnabled: false,
  gallerySectionEnabled: false,
  videoSectionEnabled: false,
  blogSectionEnabled: false,
  testimonialsEnabled: true,
  testimonialsSectionTitle: 'Para quién es Toqua',
  testimonials: [
    {
      title: 'Psicología y salud mental',
      quote:
        'Necesitaba una página sobria y clara: servicios, bio y WhatsApp. Mis clientes me encuentran sin depender solo de Instagram.',
      imageUrl: '',
    },
    {
      title: 'Pediatría y consultorios médicos',
      quote:
        'Ubicación, horarios y un tono cercano para padres. La página habla por mí cuando no puedo contestar el teléfono.',
      imageUrl: '',
    },
    {
      title: 'Estudios jurídicos y servicios',
      quote:
        'Algo más serio que un perfil de redes: áreas de práctica, contacto y una imagen que transmite confianza.',
      imageUrl: '',
    },
  ],
  contactSectionEnabled: true,
  contactMapLayout: 'below',
  location: 'México · LATAM · Remoto',
  locationMapsUrl: '',
  showLocationMap: false,
  email: 'hello@toqua.site',
  phone: '',
  phoneIsWhatsapp: false,
  socialSectionEnabled: true,
  socialIconOnly: false,
  instagram: '',
  whatsapp: '',
  facebook: '',
  linkedin: '',
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
  customDomain: '',
  useExternalFirebase: false,
  labelLanguage: 'es',
  defaultLanguage: 'es',
  enabledLanguages: ['es', 'en'],
  customLabels: {
    es: {
      'nav.bookAppointment': 'Crear mi página',
      'about.title': 'Qué es Toqua',
      'services.defaultTitle': 'Qué incluye tu página',
      'services.defaultIntro':
        'Todo lo que un consultorio necesita para presentarse bien en línea, sin secciones vacías ni jerga técnica.',
      'testimonials.defaultTitle': 'Para quién es Toqua',
      'testimonials.subtitle': 'Profesionales que necesitan claridad, no complicaciones.',
      'contact.title': '¿Preguntas sobre Toqua?',
      'contact.subtitle':
        'Escríbenos o crea tu cuenta. Te ayudamos a publicar tu primera página cuando estés lista.',
      'hero.contact': 'Crear mi página',
      'hero.learnMore': 'Ver qué incluye',
      'placeholders.psychologistName': 'Toqua',
      'placeholders.specialty': 'Páginas profesionales',
    },
    en: {
      'nav.bookAppointment': 'Create my page',
      'about.title': 'What Toqua is',
      'services.defaultTitle': 'What your page includes',
      'testimonials.defaultTitle': 'Who Toqua is for',
      'contact.title': 'Questions about Toqua?',
      'hero.contact': 'Create my page',
      'hero.learnMore': 'See what you get',
      'placeholders.psychologistName': 'Toqua',
      'placeholders.specialty': 'Professional pages',
    },
  },
  sectionThemes: createToquaSectionThemes(),
  customEmbeds: [
    {
      id: 'toqua-steps',
      enabled: true,
      type: 'steps',
      label: 'Cómo funciona',
      title: 'De la idea a tu página publicada',
      placement: 'after_services',
      stepsCardBgColor: TOQUA_PURPLE,
      stepsTextColor: TOQUA_WHITE,
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
          title: 'Cuentas tu práctica',
          description:
            'Nombre, especialidad, servicios y cómo prefieres que te contacten. Sin formularios interminables.',
        },
        {
          title: 'Revisas cómo se ve',
          description:
            'Cada cambio se ve al instante en la vista previa. Ajustas textos y fotos con calma.',
        },
        {
          title: 'Publicas y compartes',
          description:
            'Tu página queda en línea con un enlace listo para tarjeta, redes o firma de correo.',
        },
        {
          title: 'Mejoras cuando quieras',
          description:
            'Actualizas horarios, servicios o testimonios sin empezar de cero.',
        },
      ],
      imageUrl: '',
      serviceItems: [],
      fullWidth: false,
      sortOrder: 10,
    },
    {
      id: 'toqua-pricing',
      enabled: true,
      type: 'faq',
      label: 'Planes',
      title: 'Planes y precios',
      placement: 'after_testimonials',
      faqCardBgColor: TOQUA_PURPLE,
      faqTextColor: TOQUA_WHITE,
      htmlCode: '',
      body: '',
      quoteText: '',
      quoteAttribution: '',
      ctaText: '',
      ctaButtonLabel: '',
      ctaButtonUrl: '',
      faqItems: [
        {
          question: 'Starter',
          price: 'MX$189 / US$10 al mes',
          answer:
            '1 página profesional · secciones básicas · vista previa en vivo · ideal para publicar tu primera página.',
        },
        {
          question: 'Pro',
          price: 'MX$469 / US$25 al mes',
          answer:
            '1 página · blog, galería y bloques extra · carrusel y estilos personalizados · mapa lateral · más control visual.',
        },
        {
          question: 'Agency',
          price: 'MX$1,399 / US$75 al mes',
          answer:
            'Hasta 5 páginas · todo lo de Pro · prioridad en soporte · para quien atiende varios espacios o marcas.',
        },
        {
          question: 'Enterprise',
          price: '',
          answer:
            'Varias páginas y roles de equipo · acompañamiento cercano · escríbenos a hello@toqua.site.',
        },
      ],
      steps: [],
      imageUrl: '',
      serviceItems: [],
      fullWidth: false,
      sortOrder: 15,
    },
    {
      id: 'toqua-faq',
      enabled: true,
      type: 'faq',
      label: 'FAQ',
      title: 'Preguntas frecuentes',
      placement: 'after_testimonials',
      faqCardBgColor: TOQUA_PURPLE,
      faqTextColor: TOQUA_WHITE,
      htmlCode: '',
      body: '',
      quoteText: '',
      quoteAttribution: '',
      ctaText: '',
      ctaButtonLabel: '',
      ctaButtonUrl: '',
      faqItems: [
        {
          question: '¿Necesito saber de tecnología?',
          answer:
            'No. Toqua está pensado para profesionales de consultorio, no para diseñadores web. Editas textos e imágenes en un panel claro.',
        },
        {
          question: '¿Cuánto tarda en estar lista?',
          answer:
            'Con tus datos básicos puedes tener una primera versión útil en una sesión. Mejoras cuando quieras.',
        },
        {
          question: '¿Puedo usar mi dominio?',
          answer:
            'Sí. Empiezas con un enlace Toqua y conectas tu dominio propio cuando lo necesites.',
        },
        {
          question: '¿Hay plan gratuito?',
          answer:
            'Puedes crear tu cuenta y preparar la página antes de elegir un plan de pago.',
        },
      ],
      steps: [],
      imageUrl: '',
      serviceItems: [],
      fullWidth: false,
      sortOrder: 20,
    },
    {
      id: 'toqua-cta',
      enabled: true,
      type: 'cta',
      label: 'CTA final',
      title: 'Lista para tu página profesional',
      placement: 'before_footer',
      htmlCode: '',
      body: '',
      quoteText: '',
      quoteAttribution: '',
      ctaText:
        'Crea tu cuenta gratis y empieza hoy. Publica cuando te sientas lista — sin presión ni jerga técnica.',
      ctaButtonLabel: 'Crear mi página',
      ctaButtonUrl: SIGNUP_URL,
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

async function main() {
  init();
  const db = getFirestore();

  const result = await clonePageDocument(db, {
    from: 'leftsidedev',
    to: PAGE_ID,
    merge: PAGE,
    copyRoutes: true,
  });

  await db.collection('pages').doc(PAGE_ID).update({
    marketing: FieldValue.delete(),
    seo: FieldValue.delete(),
    seoArtifacts: FieldValue.delete(),
    seededAt: FieldValue.serverTimestamp(),
  });

  console.log(`page ok  ${PAGE_ID}`);
  console.log(`cloned from  ${result.from}`);
  console.log(`siteMode  landing`);
  console.log(`routes  removed ${result.routes.removed}, copied ${result.routes.copied}`);
  console.log(`logo     ${LOGO_URL}`);
  console.log(`icon     ${ICON_URL}`);
  console.log(`contact  hello@toqua.site`);
  console.log(`live     ${SITE_URL}/?pageId=${PAGE_ID}`);
  console.log(`local    http://localhost:5174/?pageId=${PAGE_ID}`);
}

const isDirectRun = process.argv[1]?.endsWith('seed-toqua-page.mjs');
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
