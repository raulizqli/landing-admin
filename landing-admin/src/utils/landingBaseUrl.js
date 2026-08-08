/** Prod default host for client landings (?pageId=...) when no hosting/custom domain is set. */
export const PROD_DEFAULT_LANDING_BASE_URL = 'https://us.leftsidedev.site';

const DEV_DEFAULT_LANDING_BASE_URL = 'http://localhost:5174';

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

/** Default marketing showcase URL (?pageId=leftsidedev) in prod. */
export function getDefaultMarketingShowcaseUrl() {
  if (import.meta.env.DEV) {
    return `${DEV_DEFAULT_LANDING_BASE_URL}/?pageId=leftsidedev`;
  }
  return `${PROD_DEFAULT_LANDING_BASE_URL}/?pageId=leftsidedev`;
}
