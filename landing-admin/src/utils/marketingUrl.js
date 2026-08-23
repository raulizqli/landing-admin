/**
 * Public URLs for the login «back to site» link (corporate / marketing).
 * Admin host `/` itself is session-aware: guests → /login, signed-in → /app.
 *
 * Priority:
 * 1. VITE_CORPORATE_SITE_URL (toqua-site / product marketing)
 * 2. VITE_MARKETING_URL / showcase fallback
 */

import { getDefaultMarketingShowcaseUrl, PROD_DEFAULT_MARKETING_URL } from './landingBaseUrl.js';

/** Legacy LeftSideDev studio URLs — product admin should link to Toqua marketing instead. */
const LEGACY_STUDIO_URLS = new Set([
  'https://leftsidedev.site',
  'http://localhost:5175',
]);

function normalizePublicUrl(raw) {
  const url = String(raw ?? '').trim();
  if (!url) return '';
  // Keep `/?query` intact; only strip a bare trailing slash.
  if (url.includes('?') || url.includes('#')) return url;
  return url.replace(/\/$/, '');
}

/** Corporate / studio site. Empty when not configured. */
export function getCorporateSiteUrl() {
  const url = normalizePublicUrl(import.meta.env.VITE_CORPORATE_SITE_URL);
  if (!url || LEGACY_STUDIO_URLS.has(url)) return '';
  return url;
}

/** Marketing / CMS showcase template URL. */
export function getMarketingUrl() {
  const fromEnv = normalizePublicUrl(import.meta.env.VITE_MARKETING_URL);
  if (fromEnv && !LEGACY_STUDIO_URLS.has(fromEnv)) return fromEnv;
  return getDefaultMarketingShowcaseUrl();
}

/**
 * Destination for login «back to site».
 * Corporate when configured; otherwise the template/marketing URL.
 */
export function getRootPublicUrl() {
  const corporate = getCorporateSiteUrl();
  if (corporate) return corporate;
  return getMarketingUrl() || PROD_DEFAULT_MARKETING_URL;
}

/**
 * Whether hard-redirecting to a public URL is safe.
 * Same-origin targets must not use location.replace — that loops forever when
 * the admin CMS is served on the same hostname.
 */
export function isExternalPublicUrl(
  publicUrl = getRootPublicUrl(),
  currentOrigin = typeof window !== 'undefined' ? window.location.origin : '',
) {
  const url = String(publicUrl ?? '').trim();
  const origin = String(currentOrigin ?? '').trim();
  if (!url) return false;
  if (!origin) return true;

  try {
    return new URL(url, origin).origin !== new URL(origin).origin;
  } catch {
    return false;
  }
}

/** @deprecated Prefer isExternalPublicUrl */
export const isExternalMarketingUrl = isExternalPublicUrl;
