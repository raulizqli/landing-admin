/**
 * Public LeftSideDev marketing / sales landing URL.
 * Used for guest redirects from admin `/` and the login «back to site» link.
 */
export const DEFAULT_PRODUCTION_MARKETING_URL =
  'https://landing-template-9452e.web.app/?pageId=leftsidedev';

function normalizeMarketingUrl(raw) {
  const url = String(raw ?? '').trim();
  if (!url) return '';
  // Keep `/?query` intact; only strip a bare trailing slash.
  if (url.includes('?') || url.includes('#')) return url;
  return url.replace(/\/$/, '');
}

export function getMarketingUrl() {
  const fromEnv = normalizeMarketingUrl(import.meta.env.VITE_MARKETING_URL);
  if (fromEnv) return fromEnv;

  if (import.meta.env.DEV) {
    return 'http://localhost:5174/?pageId=leftsidedev';
  }

  return DEFAULT_PRODUCTION_MARKETING_URL;
}

/**
 * Whether hard-redirecting to the marketing URL is safe.
 * Same-origin targets must not use location.replace — that loops forever when
 * the admin CMS is served on the marketing hostname.
 */
export function isExternalMarketingUrl(
  marketingUrl = getMarketingUrl(),
  currentOrigin = typeof window !== 'undefined' ? window.location.origin : '',
) {
  const url = String(marketingUrl ?? '').trim();
  const origin = String(currentOrigin ?? '').trim();
  if (!url) return false;
  if (!origin) return true;

  try {
    return new URL(url, origin).origin !== new URL(origin).origin;
  } catch {
    return false;
  }
}
