/**
 * Seed demo pages + users for QA on project landing-admin-9452e.
 * Idempotent: upserts pages by id; upserts Auth users by email.
 *
 * Usage:
 *   cd functions && node scripts/seed-demo-cms.mjs
 */
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const PROJECT_ID = 'landing-admin-9452e';
const DEFAULT_PASSWORD = 'DemoTest123!';

function slide(partial) {
  return {
    imageUrl: '',
    title: '',
    text: '',
    showTitle: true,
    showText: true,
    showButtons: true,
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

const BASE_PAGE = {
  navMode: 'profile',
  navIconUrl: '',
  navLogoUrl: '',
  navIconOnly: false,
  navSpecialty: '',
  navSpecialtyCase: 'uppercase',
  navShowCta: true,
  navShowMenu: false,
  navAlign: 'spread',
  navCtaTarget: 'email',
  navCtaLink: '',
  navCtaBgColor: '#4A5D4E',
  navCtaTextColor: '#FFFFFF',
  preHeroEnabled: false,
  preHeroMode: 'banner',
  preHeroImageSide: 'left',
  preHeroImageUrl: '',
  preHeroTitle: '',
  preHeroText: '',
  heroSectionEnabled: true,
  aboutBioEnabled: true,
  aboutSectionEnabled: true,
  servicesDisplayMode: 'stack',
  servicesCarouselPerView: 3,
  servicesCarouselAutoplay: false,
  catalogSectionEnabled: false,
  catalogSectionTitle: '',
  catalogSectionText: '',
  catalogItems: [],
  gallerySectionEnabled: false,
  gallerySectionTitle: '',
  gallerySectionText: '',
  galleryPortfolioUrl: '',
  galleryPortfolioLabel: '',
  galleryItems: [],
  videoSectionEnabled: false,
  videoSectionTitle: '',
  videoSectionText: '',
  videoSectionUrl: '',
  testimonialsEnabled: false,
  testimonialsSectionTitle: '',
  testimonials: [],
  blogSectionEnabled: false,
  blogSectionTitle: '',
  blogSectionText: '',
  blogPosts: [],
  contactSectionEnabled: true,
  contactMapLayout: 'below',
  socialSectionEnabled: true,
  instagram: '',
  facebook: '',
  linkedin: '',
  doctoralia: '',
  tiktok: '',
  useExternalFirebase: false,
  labelLanguage: 'es',
  customLabels: { es: {}, en: {} },
};

const PAGES = [
  {
    id: 'clinica-vet-aurora',
    data: {
      ...BASE_PAGE,
      name: 'Clínica Veterinaria Aurora',
      specialty: 'Medicina veterinaria integral',
      vertical: 'veterinary',
      aboutTagline: 'Cuidado cercano y profesional para tus compañeros de vida.',
      aboutBio:
        'En Clínica Veterinaria Aurora combinamos experiencia clínica con un trato cálido. Ofrecemos consulta general, vacunación, cirugía menor y hospitalización diurna para perros, gatos y animales pequeños.',
      heroSlides: [
        slide({
          imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1600&q=80',
          title: 'Salud animal con cariño',
          text: 'Agenda la visita de tu mascota con nuestro equipo veterinario.',
        }),
      ],
      heroTitle: 'Salud animal con cariño',
      heroSubtitle: 'Agenda la visita de tu mascota con nuestro equipo veterinario.',
      servicesSectionEnabled: true,
      servicesSectionTitle: 'Servicios veterinarios',
      servicesSectionText: 'Atención preventiva y tratamientos pensados para el bienestar animal.',
      services: [
        service({
          title: 'Consulta general',
          description: 'Chequeo clínico, diagnóstico y plan de seguimiento.',
        }),
        service({
          layout: 'title_list',
          title: 'Vacunas y prevención',
          listItems: ['Esquema canino y felino', 'Desparasitación', 'Certificados de viaje'],
        }),
        service({
          title: 'Cirugía menor',
          description: 'Procedimientos ambulatorios con monitoreo postoperatorio.',
        }),
      ],
      email: 'citas@clinicaaurora.demo',
      phone: '525555010101',
      phoneIsWhatsapp: true,
      whatsapp: '525555010101',
      location: 'Av. Insurgentes Sur 1200, CDMX',
      locationMapsUrl: 'https://maps.google.com/?q=Ciudad+de+Mexico',
      showLocationMap: true,
      navIconUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop',
    },
  },
  {
    id: 'estudio-legal-horizon',
    data: {
      ...BASE_PAGE,
      name: 'Estudio Legal Horizon',
      specialty: 'Derecho civil y corporativo',
      vertical: 'legal',
      aboutTagline: 'Asesoría jurídica clara, estratégica y confiable.',
      aboutBio:
        'Horizon acompaña a personas y empresas en conflictos civiles, contratos y gobernanza corporativa. Trabajamos con comunicación directa y estrategias realistas para cada caso.',
      heroSlides: [
        slide({
          imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&q=80',
          title: 'Defendemos tus intereses',
          text: 'Consulta inicial para evaluar tu situación legal con transparencia.',
        }),
      ],
      heroTitle: 'Defendemos tus intereses',
      heroSubtitle: 'Consulta inicial para evaluar tu situación legal con transparencia.',
      servicesSectionEnabled: true,
      servicesSectionTitle: 'Áreas de práctica',
      servicesSectionText: 'Acompañamiento legal en lo civil, mercantil y consultoría preventiva.',
      services: [
        service({
          title: 'Derecho civil',
          description: 'Contratos, arrendamientos, responsabilidad civil y mediación.',
        }),
        service({
          layout: 'title_list',
          title: 'Derecho corporativo',
          listItems: ['Constitución de sociedades', 'Acuerdos de socios', 'Revisión contractual'],
        }),
        service({
          title: 'Litigio',
          description: 'Representación ante tribunales y negociación de acuerdos.',
        }),
      ],
      email: 'contacto@horizonlegal.demo',
      phone: '525555020202',
      phoneIsWhatsapp: true,
      whatsapp: '525555020202',
      location: 'Reforma 350, Piso 12, CDMX',
      locationMapsUrl: 'https://maps.google.com/?q=Paseo+de+la+Reforma+CDMX',
      showLocationMap: true,
      linkedin: 'https://linkedin.com/',
      navIconUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop',
    },
  },
  {
    id: 'electroinstal-norte',
    data: {
      ...BASE_PAGE,
      name: 'ElectroInstal Norte',
      specialty: 'Instalaciones eléctricas residenciales e industriales',
      vertical: 'generic',
      aboutTagline: 'Proyectos eléctricos seguros, eficientes y a tiempo.',
      aboutBio:
        'Somos una empresa especializada en instalaciones eléctricas nuevas, modernización de tableros, cableado estructurado e iluminación LED. Atendemos obras residenciales, comercios e industria ligera con personal certificado.',
      heroSlides: [
        slide({
          imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1600&q=80',
          title: 'Energía bien instalada',
          text: 'Cotiza tu proyecto de instalación o mantenimiento eléctrico.',
        }),
      ],
      heroTitle: 'Energía bien instalada',
      heroSubtitle: 'Cotiza tu proyecto de instalación o mantenimiento eléctrico.',
      servicesSectionEnabled: true,
      servicesSectionTitle: 'Servicios eléctricos',
      servicesSectionText: 'Desde el diseño hasta la puesta en marcha, con normativa vigente.',
      services: [
        service({
          title: 'Instalación residencial',
          description: 'Cableado, contactos, alumbrado y tableros para hogares y departamentos.',
        }),
        service({
          layout: 'title_list',
          title: 'Comercio e industria',
          listItems: ['Tableros de distribución', 'Iluminación LED', 'Mantenimiento preventivo'],
        }),
        service({
          title: 'Diagnóstico y fallas',
          description: 'Detección de cortocircuitos, sobrecargas y mejora de seguridad eléctrica.',
        }),
      ],
      email: 'ventas@electroinstal.demo',
      phone: '525555030303',
      phoneIsWhatsapp: true,
      whatsapp: '525555030303',
      location: 'Parque Industrial Norte, Monterrey, NL',
      locationMapsUrl: 'https://maps.google.com/?q=Monterrey+Nuevo+Leon',
      showLocationMap: true,
      facebook: 'https://facebook.com/',
      navIconUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=200&h=200&fit=crop',
    },
  },
];

const USERS = [
  {
    email: 'user.vet@demo.leftsidedev.test',
    displayName: 'Usuario Vet Demo',
    role: 'user',
    pageId: 'clinica-vet-aurora',
    assignedPageIds: [],
  },
  {
    email: 'user.legal@demo.leftsidedev.test',
    displayName: 'Usuario Legal Demo',
    role: 'user',
    pageId: 'estudio-legal-horizon',
    assignedPageIds: [],
  },
  {
    email: 'user.electric@demo.leftsidedev.test',
    displayName: 'Usuario Eléctrico Demo',
    role: 'user',
    pageId: 'electroinstal-norte',
    assignedPageIds: [],
  },
  {
    email: 'admin.demo@demo.leftsidedev.test',
    displayName: 'Admin Demo',
    role: 'admin',
    pageId: '',
    assignedPageIds: ['clinica-vet-aurora', 'estudio-legal-horizon', 'electroinstal-norte'],
  },
];

function init() {
  if (getApps().length === 0) {
    initializeApp({
      credential: applicationDefault(),
      projectId: PROJECT_ID,
    });
  }
}

async function upsertPage(db, { id, data }) {
  const ref = db.collection('pages').doc(id);
  await ref.set(
    {
      ...data,
      updatedAt: new Date().toISOString(),
      seededAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log(`page ok  ${id}`);
}

async function upsertUser(auth, db, user) {
  const email = user.email.toLowerCase();
  let uid;
  let created = false;

  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    await auth.updateUser(uid, {
      displayName: user.displayName,
      password: DEFAULT_PASSWORD,
      emailVerified: true,
      disabled: false,
    });
  } catch (err) {
    if (err?.code !== 'auth/user-not-found') throw err;
    const createdUser = await auth.createUser({
      email,
      password: DEFAULT_PASSWORD,
      displayName: user.displayName,
      emailVerified: true,
    });
    uid = createdUser.uid;
    created = true;
  }

  await db.collection('users').doc(uid).set(
    {
      email,
      displayName: user.displayName,
      role: user.role,
      assignedPageIds: user.role === 'admin' ? user.assignedPageIds : [],
      pageId: user.role === 'user' ? user.pageId : '',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: new Date().toISOString(),
      seeded: true,
    },
    { merge: true },
  );

  console.log(`user ${created ? 'created' : 'updated'}  ${email}  (${user.role})  uid=${uid}`);
}

async function main() {
  init();
  const auth = getAuth();
  const db = getFirestore();

  console.log(`Seeding project ${PROJECT_ID}…\n`);

  for (const page of PAGES) {
    await upsertPage(db, page);
  }

  console.log('');
  for (const user of USERS) {
    await upsertUser(auth, db, user);
  }

  console.log('\nDone. Password for all accounts:');
  console.log(`  ${DEFAULT_PASSWORD}`);
  for (const user of USERS) {
    const pages =
      user.role === 'admin' ? user.assignedPageIds.join(', ') : user.pageId;
    console.log(`  ${user.email.padEnd(40)} ${user.role.padEnd(6)} → ${pages}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
