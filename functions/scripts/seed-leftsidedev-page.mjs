/**
 * Seed LeftSideDev sales landing (pages/leftsidedev).
 * Idempotent merge.
 *
 * Usage:
 *   cd functions && node scripts/seed-leftsidedev-page.mjs
 */
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const PROJECT_ID = 'landing-admin-9452e';
const PAGE_ID = 'leftsidedev';
const ADMIN_LOGIN_URL = 'https://landing-admin-9452e.web.app/login';
const SITE_URL = 'https://leftsidedev.site';
const LOGO_URL = 'https://landing-admin-9452e.web.app/brand-name.png';
const ICON_URL = 'https://landing-admin-9452e.web.app/favicon-circle.png';

const COLORS = {
  black: '#000000',
  ink: '#081810',
  charcoal: '#101820',
  forest: '#102818',
  green: '#40B850',
  greenDeep: '#289848',
  white: '#FFFFFF',
  mist: '#F4F1EA',
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
  specialty: 'Landing CMS multi-tenant',
  vertical: 'generic',
  navMode: 'logo',
  navIconUrl: ICON_URL,
  navLogoUrl: LOGO_URL,
  navIconOnly: false,
  navSpecialty: 'Landing CMS',
  navSpecialtyCase: 'uppercase',
  navShowCta: true,
  navShowMenu: true,
  navAlign: 'spread',
  navCtaTarget: 'link',
  navCtaLink: ADMIN_LOGIN_URL,
  navCtaBgColor: COLORS.green,
  navCtaTextColor: COLORS.white,
  preHeroEnabled: false,
  heroSectionEnabled: true,
  showHeroSpecialty: false,
  heroSlides: [
    slide({
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&q=80',
      title: 'Landings profesionales sin redeploy',
      text: 'Editor multi-tenant con vista previa al instante. Publica en Firestore y conecta tu dominio.',
      showButtons: true,
      buttonsPosition: 'bottom-left',
    }),
    slide({
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80',
      title: 'Un CMS. Muchas landings.',
      text: 'Ideal para consultorios, agencias y equipos que gestionan varios sitios desde un solo panel.',
      showButtons: true,
      buttonsPosition: 'center',
    }),
  ],
  heroTitle: 'Landings profesionales sin redeploy',
  heroSubtitle: 'Editor multi-tenant con vista previa al instante. Publica en Firestore y conecta tu dominio.',
  aboutSectionEnabled: true,
  aboutBioEnabled: true,
  aboutTagline: 'Construimos herramientas claras para que publiques landings que venden, sin pelearte con el hosting en cada cambio.',
  aboutBio:
    'LeftSideDev Landing CMS es un ecosistema multi-tenant: un panel central, plantillas limpias y Firebase. Editas textos, colores, secciones y etiquetas con preview espejo en milisegundos. Guardar y publicar escribe en Firestore — tus clientes ven el cambio sin volver a desplegar código.',
  servicesSectionEnabled: true,
  servicesSectionTitle: 'Qué incluye el producto',
  servicesSectionText: 'Todo lo necesario para operar landings de profesionales y agencias desde un solo lugar.',
  servicesDisplayMode: 'stack',
  servicesCarouselPerView: 3,
  services: [
    service({
      title: 'Editor sección a sección',
      description:
        'Navbar, hero, acerca de, servicios, galería, blog, contacto y más. Colores, textos y visibilidad por bloque, con vista previa que sigue lo que editas.',
    }),
    service({
      title: 'Preview espejo (costo cero)',
      description:
        'El monitor del admin renderiza el mismo componente de la landing con el estado local del formulario. Sin lecturas extra a Firestore en cada tecla.',
    }),
    service({
      title: 'Verticales y bilingüe',
      description:
        'Presets por industria (salud, legal, dental…) y etiquetas en español o inglés, personalizables por página.',
    }),
    service({
      layout: 'title_list',
      title: 'Listo para escalar',
      listItems: [
        'Hosting multi-dominio o sitio por cliente',
        'Firebase externo opcional (Agency+)',
        'Analytics GA4 por landing',
        'Planes Starter, Pro, Agency y Enterprise',
      ],
    }),
  ],
  catalogSectionEnabled: false,
  gallerySectionEnabled: false,
  videoSectionEnabled: false,
  blogSectionEnabled: false,
  testimonialsEnabled: true,
  testimonialsSectionTitle: 'Quién ya lo usaría',
  testimonials: [
    {
      title: 'Ana · Agencia boutique',
      quote:
        'Podría entregar landings a tres clientes el mismo día y editar textos sin tocar Vercel. El preview del admin lo cambia todo.',
      imageUrl: '',
    },
    {
      title: 'Luis · Consultorio',
      quote:
        'Quería algo limpio, con mi dominio y WhatsApp. El CMS cubre secciones sin necesitar un desarrollador a cada cambio.',
      imageUrl: '',
    },
    {
      title: 'María · Studio creativo',
      quote:
        'La galería, el blog y los embeds personalizados dan flexibilidad sin abandonar un diseño terapéutico y profesional.',
      imageUrl: '',
    },
  ],
  contactSectionEnabled: true,
  contactMapLayout: 'below',
  location: 'Remoto · LATAM',
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
  customDomain: 'leftsidedev.site',
  useExternalFirebase: false,
  labelLanguage: 'es',
  customLabels: {
    es: {
      'nav.bookAppointment': 'Empezar ahora',
      'about.title': 'El producto',
      'services.defaultTitle': 'Qué incluye el producto',
      'services.defaultIntro': 'Todo lo necesario para operar landings de profesionales y agencias desde un solo lugar.',
      'testimonials.defaultTitle': 'Quién ya lo usaría',
      'testimonials.subtitle': 'Ejemplos de perfil de cliente (quotes ilustrativas).',
      'contact.title': 'Hablemos',
      'contact.subtitle': 'Cuéntanos cuántas landings necesitas. Te orientamos al plan adecuado.',
      'hero.contact': 'Contactar',
      'hero.learnMore': 'Ver cómo funciona',
      'placeholders.psychologistName': 'LeftSideDev',
      'placeholders.specialty': 'Landing CMS multi-tenant',
    },
    en: {},
  },
  sectionThemes: {
    page: theme(COLORS.mist, COLORS.charcoal),
    nav: theme(COLORS.ink, COLORS.white, { backgroundOpacity: 92 }),
    hero: theme(COLORS.black, COLORS.white),
    about: theme(COLORS.mist, COLORS.charcoal),
    services: theme(COLORS.white, COLORS.charcoal),
    testimonials: theme(COLORS.forest, COLORS.white),
    contact: theme(COLORS.mist, COLORS.charcoal),
    social: theme(COLORS.mist, COLORS.charcoal),
    footer: theme(COLORS.ink, COLORS.white),
  },
  customEmbeds: [
    {
      id: 'lsd-steps',
      enabled: true,
      type: 'steps',
      label: 'Cómo funciona',
      title: 'Cómo funciona',
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
          title: 'Crea la página',
          description: 'Define el ID (slug), nombre y vertical. Queda lista en Firestore en segundos.',
        },
        {
          title: 'Edita con preview',
          description: 'Ajusta textos, colores y secciones. La vista previa refleja cada cambio al instante.',
        },
        {
          title: 'Publica',
          description: 'Un clic en Guardar y Publicar. Sin rebuild del template para cambios de contenido.',
        },
        {
          title: 'Conecta tu dominio',
          description: 'Asigna customDomain y enlaza Hosting. Un deploy, muchas landings.',
        },
      ],
      imageUrl: '',
      serviceItems: [],
      fullWidth: false,
      sortOrder: 10,
    },
    {
      id: 'lsd-faq',
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
      faqItems: [
        {
          question: '¿Qué incluye Starter? (MX$349 / US$19 al mes)',
          answer: '1 página con secciones básicas para publicar una landing profesional rápidamente.',
        },
        {
          question: '¿Qué añade Pro? (MX$899 / US$49 al mes)',
          answer: 'Blog, embeds personalizados, galería con portafolio externo, mapa lateral y autoplay en carrusel de servicios.',
        },
        {
          question: '¿Qué ofrece Agency? (MX$2499 / US$129 al mes)',
          answer: 'Hasta 5 páginas, Firebase externo, deploy de hosting desde el panel y soporte prioritario.',
        },
        {
          question: '¿Y Enterprise?',
          answer: 'Páginas ilimitadas, todo lo anterior y soporte 24/7. Activación a medida — escríbenos.',
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
      title: 'Empieza hoy',
      placement: 'before_footer',
      htmlCode: '',
      body: '',
      quoteText: '',
      quoteAttribution: '',
      ctaText: 'Entra al panel, crea tu primera landing y publica en minutos. ¿Necesitas Agency o Enterprise? Hablemos.',
      ctaButtonLabel: 'Ir al login',
      ctaButtonUrl: ADMIN_LOGIN_URL,
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
  const ref = db.collection('pages').doc(PAGE_ID);

  await ref.set(
    {
      ...PAGE,
      updatedAt: new Date().toISOString(),
      seededAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  console.log(`page ok  ${PAGE_ID}`);
  console.log(`customDomain  ${PAGE.customDomain}`);
  console.log(`marketing    ${SITE_URL}`);
  console.log(`admin login  ${ADMIN_LOGIN_URL}`);
  console.log(`local preview http://localhost:5174?pageId=${PAGE_ID}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
