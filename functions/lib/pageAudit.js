"use strict";
/**
 * Mirror of packages/landing-core/src/pageAudit.js for Cloud Functions.
 * Keep in sync.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAGE_AUDIT_KEYS = void 0;
exports.buildPageAuditSnapshot = buildPageAuditSnapshot;
exports.diffPageAuditSnapshots = diffPageAuditSnapshots;
exports.PAGE_AUDIT_KEYS = [
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
];
function stableStringify(value) {
    if (value === null || value === undefined)
        return "null";
    if (typeof value !== "object")
        return JSON.stringify(value);
    if (Array.isArray(value)) {
        return `[${value.map((item) => stableStringify(item)).join(",")}]`;
    }
    const record = value;
    const keys = Object.keys(record).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}
function valuesEqual(a, b) {
    return stableStringify(a) === stableStringify(b);
}
function buildPageAuditSnapshot(pageData = {}) {
    const source = pageData && typeof pageData === "object" ? pageData : {};
    const snapshot = {};
    for (const key of exports.PAGE_AUDIT_KEYS) {
        if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
            snapshot[key] = source[key];
        }
    }
    return snapshot;
}
function diffPageAuditSnapshots(beforeRaw = {}, afterRaw = {}) {
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
        if (Object.prototype.hasOwnProperty.call(before, key))
            beforeChanged[key] = before[key];
        if (Object.prototype.hasOwnProperty.call(after, key))
            afterChanged[key] = after[key];
    }
    return { before: beforeChanged, after: afterChanged, changedKeys };
}
//# sourceMappingURL=pageAudit.js.map