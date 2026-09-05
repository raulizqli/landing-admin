/**
 * Seed / starter content for Valhalla Recording Studio.
 * Import into admin (paste fields) or use createCmsPage + merge.
 * Assets (logo, photos, exact YouTube URLs) must be supplied by the client.
 */

import { DEFAULT_CONTACT_FORM_PROJECT_TYPES } from './contactInquiry.js';
import { createEmptySlide } from './heroSlides.js';
import { createEmptyService } from './services.js';
import { createEmptyTestimonial } from './testimonials.js';
import { createEmptyVideoItem } from './videoSection.js';

const DARK_PAGE = {
  backgroundColor: '#0B0C0E',
  textColor: '#F4F1EA',
  useGradient: false,
  gradientColor: '#121418',
  gradientDirection: 'to-bottom',
};

const DARK_SECTION = {
  backgroundColor: '#121418',
  textColor: '#F4F1EA',
  useGradient: false,
  gradientColor: '#16181C',
  gradientDirection: 'to-bottom',
};

const DARK_ALT = {
  backgroundColor: '#16181C',
  textColor: '#F4F1EA',
  useGradient: false,
  gradientColor: '#0B0C0E',
  gradientDirection: 'to-bottom',
};

/** @returns {Record<string, unknown>} partial page document ready to merge into EMPTY_PAGE */
export function createValhallaRecordingStudioSeed(overrides = {}) {
  return {
    name: 'Valhalla Recording Studio',
    specialty: 'Grabación, mezcla y mastering',
    vertical: 'generic',
    navMode: 'logo',
    navShowCta: true,
    navCtaTarget: 'whatsapp',
    navCtaBgColor: '#C9A227',
    navCtaTextColor: '#0B0C0E',
    navShowSpecialty: true,
    heroSectionEnabled: true,
    heroHeightMode: 'fixed',
    heroSlides: [
      {
        ...createEmptySlide(),
        title: 'Tu sonido, a nivel profesional',
        text: 'Grabación, mezcla y mastering en un espacio creativo pensado para bandas, solistas y creadores.',
        showTitle: true,
        showText: true,
        showButtons: true,
        buttonsMode: 'custom',
        customButtonLabel: 'Cotizar Proyecto',
        customButtonSection: 'contact',
        buttonBgColor: '#C9A227',
        buttonTextColor: '#0B0C0E',
        videoUrl: '',
        imageUrl: '',
      },
    ],
    aboutSectionEnabled: true,
    aboutShowTitle: true,
    aboutShowTagline: true,
    aboutBioEnabled: true,
    aboutTagline: 'Un estudio donde la calidad de audio y el ambiente creativo empujan tu proyecto al siguiente nivel.',
    aboutBio:
      'Cabina tratada acústicamente, cadena de micrófonos de alta gama y una sala cómoda para escribir, ensayar y producir. Trabajamos sesión a sesión o por proyecto completo: tracking, edición, mezcla y mastering listo para plataformas.',
    servicesSectionEnabled: true,
    servicesShowTitle: true,
    servicesShowIntro: true,
    servicesSectionTitle: 'Servicios',
    servicesSectionText: 'Del primer take al master final — o el espacio para crear contenido con sonido limpio.',
    servicesDisplayMode: 'stack',
    servicesVisualStyle: 'cards',
    services: [
      createEmptyService({
        layout: 'title_description',
        title: 'Grabación',
        description: 'Voces e instrumentos con micrófonos de calidad, aislamiento y tratamiento acústico.',
      }),
      createEmptyService({
        layout: 'title_description',
        title: 'Mezcla y mastering',
        description: 'Listo para streaming: volumen competitivo, claridad y balance comercial.',
      }),
      createEmptyService({
        layout: 'title_description',
        title: 'Producción y arreglos',
        description: 'Acompañamos la canción desde la idea: estructura, sonido y dirección artística.',
      }),
      createEmptyService({
        layout: 'title_description',
        title: 'Ensayo y contenido',
        description: 'Espacio para ensayar o grabar podcasts / reels con ambientación profesional.',
      }),
    ],
    videoSectionEnabled: true,
    videoSectionTitle: 'Sesiones y tours',
    videoSectionText: 'Mira el estudio en acción. Suscríbete en YouTube @valhallarecordingstudio.',
    videoSectionItems: [
      // Replace with real video URLs from the channel
      createEmptyVideoItem({ caption: 'Tour del estudio (pega URL de YouTube)' }),
    ],
    videoSectionCarouselAutoplay: false,
    gallerySectionEnabled: true,
    galleryShowTitle: true,
    galleryShowIntro: true,
    gallerySectionTitle: 'El estudio',
    gallerySectionText: 'Cabina, consola y áreas comunes.',
    galleryItems: [],
    testimonialsEnabled: true,
    testimonialsShowTitle: true,
    testimonialsShowSubtitle: true,
    testimonialsSectionTitle: 'Artistas que ya grabaron aquí',
    testimonials: [
      {
        ...createEmptyTestimonial(),
        title: 'Artista · Banda',
        quote: 'Reemplaza con un testimonio real con permiso del cliente.',
      },
    ],
    contactSectionEnabled: true,
    contactShowTitle: true,
    contactShowSubtitle: true,
    contactFormEnabled: true,
    contactFormProjectTypes: DEFAULT_CONTACT_FORM_PROJECT_TYPES.map((item) => ({ ...item })),
    floatingWhatsappEnabled: true,
    phoneIsWhatsapp: true,
    phoneCountry: 'mx',
    phone: '',
    whatsapp: '',
    email: '',
    youtube: 'valhallarecordingstudio',
    facebook: '',
    socialSectionEnabled: true,
    socialIconOnly: true,
    catalogSectionEnabled: false,
    blogSectionEnabled: false,
    preHeroEnabled: false,
    labelLanguage: 'es',
    defaultLanguage: 'es',
    customLabels: {
      es: {
        'nav.bookAppointment': 'Reservar Sesión',
        'hero.contact': 'Cotizar Proyecto',
        'about.title': 'El estudio',
        'contact.title': 'Cotiza tu proyecto',
        'contact.subtitle': 'Cuéntanos qué quieres grabar y te respondemos por WhatsApp.',
        'contact.formSubmit': 'Enviar cotización',
        'booking.whatsappMessage': 'Hola Valhalla, me gustaría cotizar una sesión / proyecto.',
        'phone.whatsappMessage': 'Hola Valhalla, me gustaría información del estudio.',
        'testimonials.defaultTitle': 'Artistas que ya grabaron aquí',
        'social.title': 'Síguenos',
        'social.subtitle': 'YouTube y Facebook — sesiones, reels y detrás de cámaras.',
      },
      en: {},
    },
    sectionThemes: {
      page: { ...DARK_PAGE },
      nav: { ...DARK_PAGE, backgroundOpacity: 90 },
      hero: { backgroundColor: '#0B0C0E', textColor: '#FFFFFF', useGradient: false, gradientColor: '#121418', gradientDirection: 'to-bottom' },
      about: { ...DARK_SECTION },
      services: { ...DARK_SECTION },
      gallery: { ...DARK_ALT },
      video: { ...DARK_ALT },
      testimonials: { ...DARK_SECTION },
      contact: { ...DARK_ALT },
      social: { ...DARK_PAGE },
      footer: { ...DARK_PAGE },
    },
    ...overrides,
  };
}
