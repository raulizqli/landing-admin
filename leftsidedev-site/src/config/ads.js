import { SITE } from '../content/site';

export const GOOGLE_ADS_CLIENT = String(
  import.meta.env.VITE_GOOGLE_ADS_CLIENT || SITE.googleAdsenseAccount || '',
).trim();

export const GOOGLE_ADS_SLOT = String(import.meta.env.VITE_GOOGLE_ADS_SLOT || '').trim();

/** Optional second unit (e.g. above FAQ). Falls back to bottom banner slot. */
export const GOOGLE_ADS_SLOT_INPAGE = String(
  import.meta.env.VITE_GOOGLE_ADS_SLOT_INPAGE || import.meta.env.VITE_GOOGLE_ADS_SLOT || '',
).trim();

export function isAdSenseConfigured() {
  return Boolean(GOOGLE_ADS_CLIENT && GOOGLE_ADS_SLOT);
}

export function isInpageAdConfigured() {
  return Boolean(GOOGLE_ADS_CLIENT && GOOGLE_ADS_SLOT_INPAGE);
}
