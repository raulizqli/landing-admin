/**
 * Editorial snapshot + diff for pageAudits.
 * Keep in sync with functions/src/pageAudit.ts
 */

/** Top-level keys included in audit snapshots (no private hosting secrets). */
export const PAGE_AUDIT_KEYS = [
  'name',
  'specialty',
  'vertical',
  'siteMode',
  'labelLanguage',
  'defaultLanguage',
  'customLabels',
  'translations',
  'aboutTagline',
  'aboutBio',
  'aboutBioEnabled',
  'aboutSectionEnabled',
  'email',
  'phone',
  'phoneIsWhatsapp',
  'location',
  'locationMapsUrl',
  'showLocationMap',
  'contactMapLayout',
  'locations',
  'locationsContactMode',
  'locationsDisplayMode',
  'navMode',
  'navIconUrl',
  'navLogoUrl',
  'navIconOnly',
  'navCtaTarget',
  'navShowCta',
  'navShowMenu',
  'preHeroEnabled',
  'preHeroMode',
  'preHeroImageUrl',
  'preHeroTitle',
  'preHeroText',
  'heroSectionEnabled',
  'heroSlides',
  'heroHeightMode',
  'heroTitle',
  'heroSubtitle',
  'servicesSectionEnabled',
  'services',
  'servicesDisplayMode',
  'catalogSectionEnabled',
  'catalogItems',
  'gallerySectionEnabled',
  'galleryItems',
  'galleryPortfolioUrl',
  'galleryPortfolioLabel',
  'videoSectionEnabled',
  'videoUrl',
  'testimonialsEnabled',
  'testimonials',
  'blogSectionEnabled',
  'blogSectionTitle',
  'blogSectionText',
  'blogPosts',
  'socialSectionEnabled',
  'socialLinks',
  'socialIconOnly',
  'contactSectionEnabled',
  'footerSectionEnabled',
  'customEmbeds',
  'customDomain',
  'hostingPublicUrl',
  'hostingProvider',
  'seoArtifacts',
  'analyticsMeasurementId',
  'termsOfUseEnabled',
  'privacyPolicyEnabled',
  'termsOfUseTitle',
  'termsOfUseBody',
  'privacyPolicyTitle',
  'privacyPolicyBody',
];

function stableStringify(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function valuesEqual(a, b) {
  return stableStringify(a) === stableStringify(b);
}

/**
 * Pick a compact editorial subset for audit storage.
 */
export function buildPageAuditSnapshot(pageData = {}) {
  const source = pageData && typeof pageData === 'object' ? pageData : {};
  const snapshot = {};
  for (const key of PAGE_AUDIT_KEYS) {
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
      snapshot[key] = source[key];
    }
  }
  return snapshot;
}

/**
 * @returns {{ before: object, after: object, changedKeys: string[] }}
 */
export function diffPageAuditSnapshots(beforeRaw = {}, afterRaw = {}) {
  const before = buildPageAuditSnapshot(beforeRaw);
  const after = buildPageAuditSnapshot(afterRaw);
  const keySet = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changedKeys = [];

  for (const key of [...keySet].sort()) {
    if (!valuesEqual(before[key], after[key])) {
      changedKeys.push(key);
    }
  }

  const beforeChanged = {};
  const afterChanged = {};
  for (const key of changedKeys) {
    if (Object.prototype.hasOwnProperty.call(before, key)) beforeChanged[key] = before[key];
    if (Object.prototype.hasOwnProperty.call(after, key)) afterChanged[key] = after[key];
  }

  return {
    before: beforeChanged,
    after: afterChanged,
    changedKeys,
  };
}
