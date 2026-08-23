/**
 * Seed Nuditos Tejidos landing (pages/nuditos-tejidos).
 * Handmade crochet shop — content from public Facebook (amigurumis.and.more)
 * and matching Instagram (@nuditos.tejidos).
 *
 * Usage:
 *   cd functions && node scripts/seed-nuditos-tejidos-page.mjs
 */
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const PROJECT_ID = 'landing-admin-9452e';
const PAGE_ID = 'nuditos-tejidos';
const SITE_URL = 'https://web.toqua.site';
const FACEBOOK_URL = 'https://www.facebook.com/amigurumis.and.more/';

const COLORS = {
  terracotta: '#A65D45',
  cream: '#F6F0E6',
  ink: '#3D3229',
  sage: '#6B7A62',
};

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
    buttonsPosition: 'bottom-left',
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
  name: 'Nuditos Tejidos',
  specialty: 'Crochet, amigurumis y tejidos a mano',
  vertical: 'ecommerce',
  siteMode: 'landing',
  navMode: 'profile',
  navIconUrl: '',
  navLogoUrl: '',
  navIconOnly: false,
  navSpecialty: 'Hecho a mano',
  navSpecialtyCase: 'uppercase',
  navShowSpecialty: true,
  navShowCta: true,
  navShowMenu: false,
  navAlign: 'spread',
  navCtaTarget: 'link',
  navCtaLink: FACEBOOK_URL,
  navCtaBgColor: COLORS.terracotta,
  navCtaTextColor: COLORS.cream,
  preHeroEnabled: false,
  heroSectionEnabled: true,
  showHeroSpecialty: true,
  heroSlides: [
    slide({
      imageUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=1600&q=80',
      title: 'Tejidos con amor',
      text: 'Amigurumis y piezas 100% hechas a mano, a elección del cliente. Desde García, N.L., para todo México.',
    }),
    slide({
      imageUrl: 'https://images.unsplash.com/photo-1450297166380-cabe620bfd3c?w=1600&q=80',
      title: 'Crochet, palillo y telar',
      text: 'Cada nudito se teje con calma, color y detalle. Pide el tuyo o elige un diseño a medida.',
      buttonsPosition: 'center',
    }),
  ],
  heroTitle: 'Tejidos con amor',
  heroSubtitle:
    'Amigurumis y piezas 100% hechas a mano, a elección del cliente. Desde García, N.L., para todo México.',
  aboutSectionEnabled: true,
  aboutShowTitle: true,
  aboutShowTagline: true,
  aboutBioEnabled: true,
  aboutTagline: 'Emprendedoras de Monterrey, apasionadas por el crochet.',
  aboutBio:
    'Nuditos Tejidos nace en García, Nuevo León, de manos que aman el crochet. Somos una tienda en línea: tejemos amigurumis, accesorios y piezas a medida —en crochet, palillo y telar— con materiales elegidos junto a ti. Cada pedido es único, hecho a mano y enviado a todo México.',
  servicesSectionEnabled: true,
  servicesSectionTitle: 'Qué tejemos',
  servicesSectionText: 'Piezas artesanales, pedidos a tu gusto y envíos a toda la República.',
  servicesShowTitle: true,
  servicesShowIntro: true,
  servicesDisplayMode: 'stack',
  servicesCarouselPerView: 3,
  servicesCarouselAutoplay: false,
  servicesVisualStyle: 'cards',
  services: [
    service({
      title: 'Amigurumis',
      description: 'Muñecos y figuras tejidas a mano, con detalle, color y personalidad.',
    }),
    service({
      title: 'Pedidos personalizados',
      description: '100% a elección del cliente: diseño, tamaño y paleta, puntada a puntada.',
    }),
    service({
      title: 'Crochet, palillo y telar',
      description: 'Accesorios y piezas para regalar o decorar, según la técnica que mejor viste tu idea.',
    }),
    service({
      title: 'Envíos a todo México',
      description: 'Tienda en línea desde García, N.L. Pedidos por Facebook e Instagram.',
    }),
  ],
  catalogSectionEnabled: false,
  gallerySectionEnabled: false,
  videoSectionEnabled: false,
  blogSectionEnabled: false,
  testimonialsEnabled: false,
  contactSectionEnabled: true,
  contactShowTitle: true,
  contactShowSubtitle: true,
  contactMapLayout: 'below',
  location: 'García, Nuevo León',
  locationMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Garc%C3%ADa+Nuevo+Le%C3%B3n',
  showLocationMap: true,
  locations: [],
  locationsContactMode: 'shared',
  locationsDisplayMode: 'list',
  email: '',
  phone: '',
  phoneIsWhatsapp: false,
  socialSectionEnabled: true,
  socialIconOnly: false,
  instagram: 'nuditos.tejidos',
  whatsapp: '',
  facebook: 'amigurumis.and.more',
  linkedin: '',
  doctoralia: '',
  tiktok: '',
  youtube: '',
  footerSectionEnabled: true,
  termsOfUseEnabled: true,
  privacyPolicyEnabled: true,
  analyticsMeasurementId: '',
  customDomain: '',
  useExternalFirebase: false,
  labelLanguage: 'es',
  defaultLanguage: 'es',
  enabledLanguages: ['es'],
  customLabels: {
    es: {
      'nav.bookAppointment': 'Hacer pedido',
      'about.title': 'Sobre Nuditos',
      'contact.title': 'Haz tu pedido',
      'contact.subtitle':
        'Escríbenos por Facebook o Instagram. Tejemos a medida y enviamos a todo México.',
      'hero.contact': 'Hacer pedido',
      'social.title': 'Síguenos',
      'social.subtitle': 'Mira nuestras piezas en Facebook e Instagram.',
      'booking.whatsappMessage': 'Hola, me gustaría un tejido personalizado.',
      'booking.mailtoSubject': 'Pedido Nuditos Tejidos',
    },
    en: {},
  },
  seo: {
    defaultTitle: 'Nuditos Tejidos | Crochet y amigurumis a mano',
    defaultDescription:
      'Tienda en línea de amigurumis y tejidos 100% hechos a mano. Pedidos personalizados en crochet, palillo y telar. Envíos a todo México desde García, N.L.',
    ogImageUrl: '',
    canonicalBaseUrl: '',
  },
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
  console.log(`fb       ${PAGE.facebook}`);
  console.log(`ig       ${PAGE.instagram}`);
  console.log(`live     ${SITE_URL}/?pageId=${PAGE_ID}`);
  console.log(`local    http://localhost:5174/?pageId=${PAGE_ID}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
