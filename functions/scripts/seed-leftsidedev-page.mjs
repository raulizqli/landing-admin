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
  specialty: 'AI Engineering Studio',
  vertical: 'generic',
  navMode: 'logo',
  navIconUrl: ICON_URL,
  navLogoUrl: LOGO_URL,
  navIconOnly: false,
  navSpecialty: 'AI Engineering Studio',
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
      imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1600&q=80',
      title: 'AI Engineering Studio',
      text: 'We build AI-powered software, custom applications and intelligent automations that help businesses scale.',
      showButtons: true,
      buttonsPosition: 'bottom-left',
    }),
    slide({
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80',
      title: 'Agents · RAG · MCP · Automation',
      text: 'Production systems with guardrails, evals, and measurable ROI—not generic agency slides.',
      showButtons: true,
      buttonsPosition: 'center',
    }),
  ],
  heroTitle: 'AI Engineering Studio',
  heroSubtitle:
    'We build AI-powered software, custom applications and intelligent automations that help businesses scale.',
  aboutSectionEnabled: true,
  aboutBioEnabled: true,
  aboutTagline:
    'LeftSideDev specializes in AI Agents, RAG Systems, MCP Integrations, workflow automation, and custom software—not a generic software development company.',
  aboutBio:
    'We partner with operators and product teams to ship AI-powered products: agents that complete work, RAG systems staff can trust, MCP tool surfaces, Firebase backends, and web/mobile applications. Our Landing CMS product remains available for multi-tenant professional sites—edit with zero-cost mirror preview and publish without redeploying code.',
  servicesSectionEnabled: true,
  servicesSectionTitle: 'What we build',
  servicesSectionText:
    'Specialized AI engineering and custom software—agents, retrieval, automation, and full product delivery.',
  servicesDisplayMode: 'stack',
  servicesCarouselPerView: 3,
  services: [
    service({
      title: 'AI Agents & RAG',
      description:
        'Production agents with tool contracts, guardrails, and evals. RAG with citations, hybrid search, and role-aware retrieval.',
    }),
    service({
      title: 'MCP & Automation',
      description:
        'Model Context Protocol integrations and reliable workflow automation (n8n + custom workers) with human approval gates.',
    }),
    service({
      title: 'Custom software & apps',
      description:
        'Web, mobile, Firebase, React, Angular, Node, and PHP systems engineered for performance, accessibility, and scale.',
    }),
    service({
      layout: 'title_list',
      title: 'Also: Landing CMS',
      listItems: [
        'Multi-tenant landings with mirror preview (zero write-per-key)',
        'Section themes, bilingual labels, vertical presets',
        'Custom domains and Agency+ external Firebase',
        'Plans Starter, Pro, Agency and Enterprise',
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
  labelLanguage: 'en',
  defaultLanguage: 'en',
  enabledLanguages: ['en', 'es'],
  customLabels: {
    en: {
      'nav.bookAppointment': 'Book a Discovery Call',
      'about.title': 'The studio',
      'services.defaultTitle': 'What we build',
      'services.defaultIntro':
        'Specialized AI engineering and custom software—agents, retrieval, automation, and full product delivery.',
      'testimonials.defaultTitle': 'Who we help',
      'testimonials.subtitle': 'Illustrative buyer profiles.',
      'contact.title': 'Let’s talk',
      'contact.subtitle': 'Tell us what you want to build. We will map fit, timeline, and next steps.',
      'hero.contact': 'Book a Discovery Call',
      'hero.learnMore': 'View Case Studies',
      'placeholders.psychologistName': 'LeftSideDev',
      'placeholders.specialty': 'AI Engineering Studio',
    },
    es: {
      'nav.bookAppointment': 'Agendar discovery call',
      'about.title': 'El estudio',
      'services.defaultTitle': 'Qué construimos',
      'services.defaultIntro':
        'Ingeniería de IA y software a medida: agents, retrieval, automatización y productos completos.',
      'testimonials.defaultTitle': 'A quién ayudamos',
      'testimonials.subtitle': 'Perfiles ilustrativos de cliente.',
      'contact.title': 'Hablemos',
      'contact.subtitle': 'Cuéntanos qué quieres construir. Definimos encaje, timeline y siguientes pasos.',
      'hero.contact': 'Agendar discovery call',
      'hero.learnMore': 'Ver casos de estudio',
      'placeholders.psychologistName': 'LeftSideDev',
      'placeholders.specialty': 'AI Engineering Studio',
    },
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
