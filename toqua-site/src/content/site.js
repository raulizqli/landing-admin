const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

export const SITE = {
  name: 'Toqua',
  legalName: 'Toqua',
  tagline: {
    es: 'Tu página profesional, lista para que te contacten.',
    en: 'Your professional page, ready for clients to reach you.',
  },
  motto: 'CREATE. PUBLISH. READY.',
  url: 'https://toqua.site',
  email: 'hello@toqua.site',
  location: {
    es: 'México · LATAM · Remoto',
    en: 'Mexico · LATAM · Remote',
  },
  ogImage: 'https://toqua.site/og-default.svg',
  foundingYear: 2024,
  locales: {
    es: 'es_MX',
    en: 'en_US',
  },
};

export function getAdminSignupUrl() {
  const fromEnv =
    typeof import.meta !== 'undefined' ? import.meta.env?.VITE_ADMIN_URL?.trim() : '';
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  return isDev ? 'http://localhost:5173' : 'https://admin.toqua.site';
}

export const SUPPORTED_LANGS = ['es', 'en'];
export const DEFAULT_LANG = 'es';

export function isSupportedLang(lang) {
  return SUPPORTED_LANGS.includes(lang);
}
