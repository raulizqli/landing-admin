/**
 * Seed Stilette landing (pages/stilette).
 * Nails, Spa & More — content from public Facebook + owner contact details.
 *
 * Usage:
 *   cd functions && node scripts/seed-stilette-page.mjs
 */
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const PROJECT_ID = 'landing-admin-9452e';
const PAGE_ID = 'stilette';
const SITE_URL = 'https://web.toqua.site';

const COLORS = {
  forest: '#2F4A3A',
  gold: '#C4A574',
  cream: '#F4F1EA',
  ink: '#2A342D',
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
  name: 'Stilette',
  specialty: 'Nails, Spa & More',
  vertical: 'beauty',
  siteMode: 'landing',
  navMode: 'profile',
  navIconUrl: '',
  navLogoUrl: '',
  navIconOnly: false,
  navSpecialty: 'Nails · Spa',
  navSpecialtyCase: 'uppercase',
  navShowSpecialty: true,
  navShowCta: true,
  navShowMenu: false,
  navAlign: 'spread',
  navCtaTarget: 'whatsapp',
  navCtaLink: '',
  navCtaBgColor: COLORS.forest,
  navCtaTextColor: COLORS.cream,
  preHeroEnabled: false,
  heroSectionEnabled: true,
  showHeroSpecialty: true,
  heroSlides: [
    slide({
      imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1600&q=80',
      title: 'Resalta lo mejor de ti',
      text: 'Manicura, spa y rituales de cuidado en un espacio pensado para que salgas más tú.',
    }),
    slide({
      imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289f926e2?w=1600&q=80',
      title: 'Nails, spa & more',
      text: 'Un momento de pausa, con detalle, calma y estilo.',
      buttonsPosition: 'center',
    }),
  ],
  heroTitle: 'Resalta lo mejor de ti',
  heroSubtitle: 'Manicura, spa y rituales de cuidado en un espacio pensado para que salgas más tú.',
  aboutSectionEnabled: true,
  aboutShowTitle: true,
  aboutShowTagline: true,
  aboutBioEnabled: true,
  aboutTagline: 'Nails, spa & more — con calma, detalle y estilo.',
  aboutBio:
    'En Stilette nuestra misión es ayudar a quienes nos visitan a resaltar lo mejor de sí. Cuidamos uñas, piel y momentos de pausa con un trato cercano y un ambiente cálido, para que cada cita se sienta como un pequeño lujo cotidiano.',
  servicesSectionEnabled: true,
  servicesSectionTitle: 'Servicios',
  servicesSectionText: 'Tratamientos pensados para resaltar tu estilo, sin prisa y con cuidado.',
  servicesShowTitle: true,
  servicesShowIntro: true,
  servicesDisplayMode: 'stack',
  servicesCarouselPerView: 3,
  servicesCarouselAutoplay: false,
  servicesVisualStyle: 'cards',
  services: [
    service({
      title: 'Uñas',
      description: 'Manicura y pedicura con acabado limpio, tendencia y duración.',
    }),
    service({
      title: 'Spa',
      description: 'Rituales de relajación para desconectar y volver al cuerpo.',
    }),
    service({
      title: 'Cuidado extra',
      description: 'Detalles de belleza que complementan tu look, según lo que necesites ese día.',
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
  location: 'Tampico 160',
  locationMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tampico+160',
  showLocationMap: true,
  locations: [],
  locationsContactMode: 'shared',
  locationsDisplayMode: 'list',
  email: '',
  phone: '528130750554',
  phoneIsWhatsapp: true,
  socialSectionEnabled: true,
  socialIconOnly: false,
  instagram: 'stilette.beauty',
  whatsapp: '528130750554',
  facebook: 'stilette.beauty',
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
      'nav.bookAppointment': 'Reservar cita',
      'about.title': 'Sobre Stilette',
      'contact.title': 'Agenda tu cita',
      'contact.subtitle': 'Escríbenos por WhatsApp o visítanos en Tampico 160.',
      'hero.contact': 'Reservar cita',
      'social.title': 'Síguenos',
      'social.subtitle': 'Mira nuestro trabajo en Instagram y Facebook.',
    },
    en: {},
  },
  seo: {
    defaultTitle: 'Stilette | Nails, Spa & More',
    defaultDescription:
      'Salón de uñas y spa. Te ayudamos a resaltar lo mejor de ti en un espacio cálido, profesional y relajado. Tampico 160.',
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
  console.log(`phone    ${PAGE.phone}`);
  console.log(`ig       ${PAGE.instagram}`);
  console.log(`live     ${SITE_URL}/?pageId=${PAGE_ID}`);
  console.log(`local    http://localhost:5174/?pageId=${PAGE_ID}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
