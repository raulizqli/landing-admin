/**
 * Public LeftSideDev marketing URL (login «back to site» link).
 *
 * Prefer the template hosting URL while leftsidedev.site still points at the
 * admin CMS — otherwise same-origin links just bounce back to /login.
 */
export function getMarketingUrl() {
  const fromEnv = String(import.meta.env.VITE_MARKETING_URL ?? '').trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (import.meta.env.DEV) {
    return 'http://localhost:5174?pageId=leftsidedev';
  }

  return 'https://landing-template-9452e.web.app?pageId=leftsidedev';
}

/**
 * Whether the marketing URL is on a different origin than the admin.
 * Used to hide «back to site» when it would only reload the CMS.
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
