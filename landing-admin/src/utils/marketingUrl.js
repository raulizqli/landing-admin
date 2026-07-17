/**
 * Public LeftSideDev marketing URL for guest redirects from admin `/`.
 */
export function getMarketingUrl() {
  const fromEnv = String(import.meta.env.VITE_MARKETING_URL ?? '').trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (import.meta.env.DEV) {
    return 'http://localhost:5174?pageId=leftsidedev';
  }

  return 'https://leftsidedev.site';
}

/**
 * Whether hard-redirecting to the marketing URL is safe.
 * Same-origin targets must not use location.replace — that loops forever when
 * the admin CMS is served on the marketing hostname (e.g. leftsidedev.site).
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
