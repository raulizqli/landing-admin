/**
 * Mirror of packages/landing-core/src/pageAudit.js for Cloud Functions.
 * Keep in sync.
 */

export const PAGE_AUDIT_KEYS = [
  "name",
  "specialty",
  "vertical",
  "siteMode",
  "labelLanguage",
  "defaultLanguage",
  "customLabels",
  "translations",
  "aboutTagline",
  "aboutBio",
  "aboutBioEnabled",
  "aboutSectionEnabled",
  "email",
  "phone",
  "phoneIsWhatsapp",
  "location",
  "locationMapsUrl",
  "showLocationMap",
  "contactMapLayout",
  "locations",
  "locationsContactMode",
  "locationsDisplayMode",
  "navMode",
  "navIconUrl",
  "navLogoUrl",
  "navIconOnly",
  "navCtaTarget",
  "navShowCta",
  "navShowMenu",
  "preHeroEnabled",
  "preHeroMode",
  "preHeroImageUrl",
  "preHeroTitle",
  "preHeroText",
  "heroSectionEnabled",
  "heroSlides",
  "heroHeightMode",
  "heroTitle",
  "heroSubtitle",
  "servicesSectionEnabled",
  "services",
  "servicesDisplayMode",
  "catalogSectionEnabled",
  "catalogItems",
  "gallerySectionEnabled",
  "galleryItems",
  "galleryPortfolioUrl",
  "galleryPortfolioLabel",
  "videoSectionEnabled",
  "videoSectionUrl",
  "videoSectionItems",
  "videoUrl",
  "testimonialsEnabled",
  "testimonials",
  "blogSectionEnabled",
  "blogSectionTitle",
  "blogSectionText",
  "blogPosts",
  "socialSectionEnabled",
  "socialLinks",
  "socialIconOnly",
  "contactSectionEnabled",
  "contactFormEnabled",
  "contactFormProjectTypes",
  "floatingWhatsappEnabled",
  "footerSectionEnabled",
  "customEmbeds",
  "customDomain",
  "hostingPublicUrl",
  "hostingProvider",
  "seoArtifacts",
  "analyticsMeasurementId",
  "termsOfUseEnabled",
  "privacyPolicyEnabled",
  "termsOfUseTitle",
  "termsOfUseBody",
  "privacyPolicyTitle",
  "privacyPolicyBody",
  "expeditionIssuerName",
  "expeditionLicenseNumber",
  "expeditionDocuments",
] as const;

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b);
}

export function buildPageAuditSnapshot(pageData: Record<string, unknown> = {}): Record<string, unknown> {
  const source = pageData && typeof pageData === "object" ? pageData : {};
  const snapshot: Record<string, unknown> = {};
  for (const key of PAGE_AUDIT_KEYS) {
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
      snapshot[key] = source[key];
    }
  }
  return snapshot;
}

export function diffPageAuditSnapshots(
  beforeRaw: Record<string, unknown> = {},
  afterRaw: Record<string, unknown> = {},
): { before: Record<string, unknown>; after: Record<string, unknown>; changedKeys: string[] } {
  const before = buildPageAuditSnapshot(beforeRaw);
  const after = buildPageAuditSnapshot(afterRaw);
  const keySet = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changedKeys: string[] = [];

  for (const key of [...keySet].sort()) {
    if (!valuesEqual(before[key], after[key])) {
      changedKeys.push(key);
    }
  }

  const beforeChanged: Record<string, unknown> = {};
  const afterChanged: Record<string, unknown> = {};
  for (const key of changedKeys) {
    if (Object.prototype.hasOwnProperty.call(before, key)) beforeChanged[key] = before[key];
    if (Object.prototype.hasOwnProperty.call(after, key)) afterChanged[key] = after[key];
  }

  return { before: beforeChanged, after: afterChanged, changedKeys };
}
