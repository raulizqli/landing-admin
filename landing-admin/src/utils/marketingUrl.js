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
