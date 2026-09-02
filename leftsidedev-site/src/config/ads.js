import { SITE } from '../content/site';

export const GOOGLE_ADS_CLIENT = String(
  import.meta.env.VITE_GOOGLE_ADS_CLIENT || SITE.googleAdsenseAccount || '',
).trim();

export const GOOGLE_ADS_SLOT = String(import.meta.env.VITE_GOOGLE_ADS_SLOT || '').trim();

export function isAdSenseConfigured() {
  return Boolean(GOOGLE_ADS_CLIENT && GOOGLE_ADS_SLOT);
}
