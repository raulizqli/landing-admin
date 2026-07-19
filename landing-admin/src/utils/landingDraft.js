import { sanitizeAiText } from './aiAssist';
import { normalizeVertical } from '@raulizqli/landing-core/verticals';

export const LANDING_BRIEF_TEMPLATE = `Tipo de negocio o profesional:
Nombre de la marca o profesional:
Objetivo principal de la landing:
Público ideal:
Servicios principales:
Diferenciador o propuesta de valor:
Tono de comunicación:
Ubicación y modalidad de atención:
Acción que debe realizar el visitante:
Datos, palabras o restricciones importantes:`;

export function getLandingBriefAnswers(value) {
  return String(value ?? '')
    .split(/\r?\n/)
    .map((line) => line.slice(line.indexOf(':') + 1).trim())
    .filter(Boolean);
}

export function hasMeaningfulLandingBrief(value) {
  const answers = getLandingBriefAnswers(value);
  return answers.length >= 4 && answers.join(' ').length >= 60;
}

function normalizeServices(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 6).map((item) => ({
    layout: 'title_description',
    title: sanitizeAiText(item?.title),
    description: sanitizeAiText(item?.description),
    listItems: [],
    imageUrl: '',
  })).filter((item) => item.title || item.description);
}

export function normalizeLandingDraft(result, fallback = {}) {
  const source = result?.draft && typeof result.draft === 'object' ? result.draft : result || {};
  const hero = source.hero && typeof source.hero === 'object' ? source.hero : {};
  const about = source.about && typeof source.about === 'object' ? source.about : {};
  const servicesSection = source.servicesSection && typeof source.servicesSection === 'object'
    ? source.servicesSection
    : {};
  const seo = source.seo && typeof source.seo === 'object' ? source.seo : {};
  const services = normalizeServices(source.services);

  return {
    name: sanitizeAiText(source.name) || String(fallback.name ?? '').trim(),
    specialty: sanitizeAiText(source.specialty) || String(fallback.specialty ?? '').trim(),
    vertical: normalizeVertical(source.vertical || fallback.vertical),
    heroSlides: [{
      imageUrl: '',
      title: sanitizeAiText(hero.title),
      text: sanitizeAiText(hero.text),
      showTitle: true,
      showText: true,
      showButtons: true,
      buttonsPosition: 'bottom-left',
    }],
    aboutTagline: sanitizeAiText(about.tagline),
    aboutBio: sanitizeAiText(about.bio),
    servicesSectionEnabled: services.length > 0,
    servicesSectionTitle: sanitizeAiText(servicesSection.title) || 'Servicios',
    servicesSectionText: sanitizeAiText(servicesSection.text),
    services,
    seo: {
      defaultTitle: sanitizeAiText(seo.title),
      defaultDescription: sanitizeAiText(seo.description),
      ogImageUrl: '',
    },
  };
}
