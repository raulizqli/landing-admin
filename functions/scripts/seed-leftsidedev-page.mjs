/**
 * Seed LeftSideDev as CMS Marketing Site (pages/leftsidedev + routes).
 * Idempotent merge. Showcase is edited from admin after seeding.
 *
 * Usage:
 *   cd functions && node scripts/seed-leftsidedev-page.mjs
 */
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import {
  createMarketingSiteSkeleton,
  marketingRouteToFirestore,
} from '../../packages/landing-core/src/marketingSite.js';
import { buildMarketingSeoArtifacts } from '../../packages/landing-core/src/marketingSeo.js';

const PROJECT_ID = 'landing-admin-9452e';
const PAGE_ID = 'leftsidedev';
const ADMIN_LOGIN_URL = 'https://landing-admin-9452e.web.app/login';
const SITE_URL = 'https://leftsidedev.site';
const LOGO_URL = 'https://landing-admin-9452e.web.app/brand-name.png';
const ICON_URL = 'https://landing-admin-9452e.web.app/favicon-circle.png';

const COLORS = {
  ink: '#070B0A',
  panel: '#0E1613',
  mist: '#F4F7F5',
  accent: '#7CFFB2',
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

const MARKETING_ROUTES = createMarketingSiteSkeleton({
  name: 'LeftSideDev',
  brand: 'AI Engineering Studio',
});

const PAGE = {
  name: 'LeftSideDev',
  specialty: 'AI Engineering Studio',
  vertical: 'generic',
  siteMode: 'marketing',
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
  navCtaLink: '/contact',
  navCtaBgColor: COLORS.accent,
  navCtaTextColor: COLORS.ink,
  preHeroEnabled: false,
  heroSectionEnabled: false,
  aboutSectionEnabled: false,
  servicesSectionEnabled: false,
  catalogSectionEnabled: false,
  gallerySectionEnabled: false,
  videoSectionEnabled: false,
  blogSectionEnabled: false,
  testimonialsEnabled: false,
  contactSectionEnabled: false,
  socialSectionEnabled: true,
  footerSectionEnabled: true,
  termsOfUseEnabled: true,
  privacyPolicyEnabled: true,
  location: 'Remote · LATAM · Global',
  email: 'hello@leftsidedev.site',
  phone: '',
  phoneIsWhatsapp: false,
  socialIconOnly: false,
  instagram: '',
  whatsapp: '',
  facebook: '',
  linkedin: 'https://www.linkedin.com/',
  doctoralia: '',
  tiktok: '',
  youtube: '',
  analyticsMeasurementId: '',
  customDomain: 'leftsidedev.site',
  useExternalFirebase: false,
  labelLanguage: 'en',
  defaultLanguage: 'en',
  enabledLanguages: ['en', 'es'],
  marketing: {
    enabledRouteTypes: [
      'home',
      'services_index',
      'service',
      'case_studies_index',
      'case_study',
      'blog_index',
      'blog_post',
      'estimate',
      'resources',
      'contact',
    ],
    primaryCta: { label: 'Book a Discovery Call', href: '/contact', external: false },
    secondaryCta: { label: 'View Case Studies', href: '/case-studies', external: false },
    stickyCtaEnabled: true,
    floatingContactEnabled: true,
    calendlyUrl: '',
    newsletterEnabled: true,
    stats: [
      { value: '120+', label: 'Projects Delivered' },
      { value: '7+', label: 'Years of Experience' },
      { value: '40+', label: 'Technologies' },
      { value: '98%', label: 'Client Satisfaction' },
    ],
    specializations: [
      'AI Agents',
      'RAG Systems',
      'MCP Integrations',
      'Workflow Automation',
      'Custom Software',
      'Web Applications',
      'Mobile Applications',
      'Cloud Solutions',
      'Firebase',
      'Enterprise Systems',
    ],
    techStack: [
      'OpenAI',
      'Anthropic',
      'LangGraph',
      'MCP',
      'React',
      'Angular',
      'Node.js',
      'Firebase',
      'PostgreSQL',
      'n8n',
      'TypeScript',
    ],
    processSteps: [
      { title: 'Discover', description: 'Map goals, constraints, data sources, and success metrics.' },
      { title: 'Architect', description: 'Design agents, RAG pipelines, APIs, data model, and security boundaries.' },
      { title: 'Build', description: 'Ship in short iterations with demos, observability, and production-ready code.' },
      { title: 'Scale', description: 'Harden, automate, document, and transfer ownership.' },
    ],
  },
  seo: {
    defaultTitle: 'LeftSideDev — AI Engineering Studio',
    defaultDescription:
      'We build AI-powered software, custom applications and intelligent automations that help businesses scale.',
    ogImageUrl: `${SITE_URL}/og-default.svg`,
    canonicalBaseUrl: SITE_URL,
  },
  customLabels: {
    en: {
      'nav.bookAppointment': 'Book a Discovery Call',
      'placeholders.psychologistName': 'LeftSideDev',
      'placeholders.specialty': 'AI Engineering Studio',
    },
    es: {
      'nav.bookAppointment': 'Agendar discovery call',
      'placeholders.psychologistName': 'LeftSideDev',
      'placeholders.specialty': 'AI Engineering Studio',
    },
  },
  sectionThemes: {
    page: theme(COLORS.ink, COLORS.mist),
    nav: theme(COLORS.ink, COLORS.mist, { backgroundOpacity: 90 }),
    footer: theme(COLORS.panel, COLORS.mist),
  },
  customEmbeds: [],
  // CMS product login still reachable for operators
  hostingPublicUrl: SITE_URL,
};

function init() {
  if (getApps().length === 0) {
    initializeApp({
      credential: applicationDefault(),
      projectId: PROJECT_ID,
    });
  }
}

async function writeRoutes(db, pageId, routes) {
  const batch = db.batch();
  const col = db.collection('pages').doc(pageId).collection('routes');
  const existing = await col.get();
  const keep = new Set(routes.map((route) => route.id));
  existing.docs.forEach((docSnap) => {
    if (!keep.has(docSnap.id)) batch.delete(docSnap.ref);
  });
  routes.forEach((route) => {
    const payload = marketingRouteToFirestore(route);
    batch.set(col.doc(route.id), payload, { merge: true });
  });
  await batch.commit();
}

async function main() {
  init();
  const db = getFirestore();
  const ref = db.collection('pages').doc(PAGE_ID);
  const seoArtifacts = buildMarketingSeoArtifacts({
    ...PAGE,
    marketingRoutes: MARKETING_ROUTES,
  });

  await ref.set(
    {
      ...PAGE,
      seoArtifacts,
      updatedAt: new Date().toISOString(),
      seededAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await writeRoutes(db, PAGE_ID, MARKETING_ROUTES);

  console.log(`page ok  ${PAGE_ID}`);
  console.log(`siteMode  marketing`);
  console.log(`routes    ${MARKETING_ROUTES.length}`);
  console.log(`customDomain  ${PAGE.customDomain}`);
  console.log(`sitemap   ${SITE_URL}/sitemap.xml`);
  console.log(`rss       ${SITE_URL}/rss.xml`);
  console.log(`admin     ${ADMIN_LOGIN_URL}`);
  console.log(`local     http://localhost:5174/?pageId=${PAGE_ID}`);
  console.log('Note: deploy firestore rules + functions + template hosting for SEO feeds.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
