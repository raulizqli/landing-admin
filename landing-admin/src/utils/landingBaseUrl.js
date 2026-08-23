/** Prod default host for client landings (?pageId=...) when no hosting/custom domain is set. */
export const PROD_DEFAULT_LANDING_BASE_URL = 'https://web.toqua.site';
/** Public Toqua product marketing site (not the CMS admin). */
export const PROD_DEFAULT_MARKETING_URL = 'https://toqua.site';

const DEV_DEFAULT_LANDING_BASE_URL = 'http://localhost:5174';
const DEV_DEFAULT_MARKETING_URL = 'http://localhost:5176';

export function normalizePublicBaseUrl(raw) {
  const url = String(raw ?? '').trim();
  if (!url) return '';
  if (url.includes('?') || url.includes('#')) return url;
  return url.replace(/\/+$/, '');
}

/** Base URL for opening/previewing landings (template host). */
export function getLandingBaseUrl() {
  const fromEnv = normalizePublicBaseUrl(import.meta.env.VITE_TEMPLATE_PREVIEW_URL);
  if (fromEnv) return fromEnv;
  return import.meta.env.DEV ? DEV_DEFAULT_LANDING_BASE_URL : PROD_DEFAULT_LANDING_BASE_URL;
}

/** Default public marketing URL (toqua-site). */
export function getDefaultMarketingShowcaseUrl() {
  if (import.meta.env.DEV) {
    return DEV_DEFAULT_MARKETING_URL;
  }
  return PROD_DEFAULT_MARKETING_URL;
}
