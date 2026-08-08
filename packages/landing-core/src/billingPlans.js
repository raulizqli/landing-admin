/**
 * SaaS billing plans / entitlements for TapSite.
 * Keep in sync with Cloud Functions checkout price mapping (env).
 */

import {
  createEmptyMonetization,
  normalizeMonetization,
  resolveSiteAccessFromAccount,
} from './siteAccess.js';

export const BILLING_PLANS = [
  {
    id: 'starter',
    rank: 1,
    pageLimit: 1,
    locationLimit: 1,
    qrCodeLimit: 0,
    monthlyPriceUsd: 10,
    monthlyPriceMxn: 189,
    aiMonthlyGenerationsLite: 30,
    aiMonthlyGenerations: 0,
    features: {
      basicSections: true,
      blog: false,
      galleryPortfolio: false,
      customEmbeds: false,
      servicesCarouselAutoplay: false,
      customSectionVisualStyle: false,
      contactMapBeside: false,
      externalFirebase: false,
      hostingDeploy: false,
      imageUpload: false,
      prioritySupport: false,
      support247: false,
      unlimitedPages: false,
      marketingSite: false,
      aiAssistLite: true,
      aiAssist: false,
      aiByok: false,
      qrCodes: false,
    },
    aiLogoMonthlyLimit: 0,
  },
  {
    id: 'pro',
    rank: 2,
    pageLimit: 1,
    locationLimit: null,
    qrCodeLimit: 2,
    monthlyPriceUsd: 25,
    monthlyPriceMxn: 469,
    aiMonthlyGenerationsLite: 30,
    aiMonthlyGenerations: 50,
    features: {
      basicSections: true,
      blog: true,
      galleryPortfolio: true,
      customEmbeds: true,
      servicesCarouselAutoplay: true,
      customSectionVisualStyle: true,
      contactMapBeside: true,
      externalFirebase: false,
      hostingDeploy: true,
      imageUpload: true,
      prioritySupport: false,
      support247: false,
      unlimitedPages: false,
      marketingSite: false,
      aiAssistLite: true,
      aiAssist: true,
      aiByok: false,
      qrCodes: true,
    },
    aiLogoMonthlyLimit: 3,
  },
  {
    id: 'agency',
    rank: 3,
    pageLimit: 5,
    locationLimit: null,
    qrCodeLimit: null,
    monthlyPriceUsd: 75,
    monthlyPriceMxn: 1399,
    aiMonthlyGenerationsLite: 30,
    aiMonthlyGenerations: 200,
    features: {
      basicSections: true,
      blog: true,
      galleryPortfolio: true,
      customEmbeds: true,
      servicesCarouselAutoplay: true,
      customSectionVisualStyle: true,
      contactMapBeside: true,
      externalFirebase: true,
      hostingDeploy: true,
      imageUpload: true,
      prioritySupport: true,
      support247: false,
      unlimitedPages: false,
      marketingSite: false,
      aiAssistLite: true,
      aiAssist: true,
      aiByok: true,
      qrCodes: true,
    },
    aiLogoMonthlyLimit: null,
  },
  {
    id: 'enterprise',
    rank: 4,
    pageLimit: null,
    locationLimit: null,
    qrCodeLimit: null,
    monthlyPriceUsd: null,
    monthlyPriceMxn: null,
    aiMonthlyGenerationsLite: 30,
    aiMonthlyGenerations: null,
    features: {
      basicSections: true,
      blog: true,
      galleryPortfolio: true,
      customEmbeds: true,
      servicesCarouselAutoplay: true,
      customSectionVisualStyle: true,
      contactMapBeside: true,
      externalFirebase: true,
      hostingDeploy: true,
      imageUpload: true,
      prioritySupport: true,
      support247: true,
      unlimitedPages: true,
      marketingSite: true,
      aiAssistLite: true,
      aiAssist: true,
      aiByok: true,
      qrCodes: true,
    },
    aiLogoMonthlyLimit: null,
  },
];

export const BILLING_PLAN_IDS = BILLING_PLANS.map((plan) => plan.id);
export const DEFAULT_BILLING_PLAN = 'starter';
export const BILLING_ACCOUNT_STATUSES = ['trialing', 'active', 'past_due', 'canceled', 'incomplete'];

const PLAN_BY_ID = new Map(BILLING_PLANS.map((plan) => [plan.id, plan]));

export function normalizeBillingPlanId(value) {
  const id = String(value ?? '').trim().toLowerCase();
  return PLAN_BY_ID.has(id) ? id : DEFAULT_BILLING_PLAN;
}

export function getBillingPlan(planId) {
  return PLAN_BY_ID.get(normalizeBillingPlanId(planId)) ?? PLAN_BY_ID.get(DEFAULT_BILLING_PLAN);
}

export function normalizeBillingStatus(value) {
  const status = String(value ?? '').trim().toLowerCase();
  return BILLING_ACCOUNT_STATUSES.includes(status) ? status : 'incomplete';
}

export function isBillingAccountActive(account) {
  const status = normalizeBillingStatus(account?.status);
  return status === 'active' || status === 'trialing';
}

/**
 * Admin-facing subscription health for banners / confirmation UI.
 * When payment lapses: existing pages are kept (public sites stay up),
 * but the account falls to free-tier CMS access (basic edit only, no new pages).
 */
export function getSubscriptionHealth(account, { bypass = false, extraPageIds = [] } = {}) {
  const plan = getBillingPlan(account?.plan);
  const status = normalizeBillingStatus(account?.status);
  const pageCount = getAccountPageCount(account, { extraPageIds, bypass: false });
  const pageLimit = getAccountPageLimit(account, { bypass });
  const periodEnd = account?.currentPeriodEnd
    ? String(account.currentPeriodEnd)
    : null;

  if (bypass) {
    return {
      state: 'bypass',
      paid: true,
      freeTier: false,
      status: 'active',
      planId: plan.id,
      pageCount,
      pageLimit: null,
      currentPeriodEnd: periodEnd,
      canCreatePages: true,
      canEditExistingBasics: true,
      siteAccess: resolveSiteAccessFromAccount({ ...account, status: 'active' }),
    };
  }

  if (status === 'active') {
    return {
      state: 'ok',
      paid: true,
      freeTier: false,
      status,
      planId: plan.id,
      pageCount,
      pageLimit,
      currentPeriodEnd: periodEnd,
      canCreatePages: canAccountCreatePage(account, pageCount, { bypass: false }),
      canEditExistingBasics: true,
      siteAccess: resolveSiteAccessFromAccount(account),
    };
  }

  if (status === 'trialing') {
    return {
      state: 'trialing',
      paid: true,
      freeTier: false,
      status,
      planId: plan.id,
      pageCount,
      pageLimit,
      currentPeriodEnd: periodEnd,
      canCreatePages: canAccountCreatePage(account, pageCount, { bypass: false }),
      canEditExistingBasics: true,
      siteAccess: resolveSiteAccessFromAccount(account),
    };
  }

  // past_due | canceled | incomplete — keep pages, free-tier CMS
  return {
    state: status === 'past_due' ? 'past_due' : status === 'canceled' ? 'canceled' : 'incomplete',
    paid: false,
    freeTier: true,
    status,
    planId: plan.id,
    pageCount,
    pageLimit,
    currentPeriodEnd: periodEnd,
    canCreatePages: false,
    canEditExistingBasics: true,
    siteAccess: resolveSiteAccessFromAccount(account),
  };
}

/** Known paid add-ons that can unlock plan features (e.g. Agency + marketingSite). */
export const BILLING_ADDON_KEYS = ['marketingSite'];

export function normalizeBillingAddons(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const addons = {};
  for (const key of BILLING_ADDON_KEYS) {
    if (source[key] === true) addons[key] = true;
  }
  return addons;
}

/** Public AI provider config (never includes raw apiKey in client normalize). */
export function normalizeAiProviderPublic(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const mode = String(source.mode ?? 'platform').trim().toLowerCase() === 'byok' ? 'byok' : 'platform';
  const provider = String(source.provider ?? '').trim().toLowerCase();
  return {
    mode,
    provider: provider || '',
    model: String(source.model ?? '').trim(),
    baseUrl: String(source.baseUrl ?? '').trim(),
    apiKeyLast4: String(source.apiKeyLast4 ?? '').trim(),
    hasKey: source.hasKey === true || Boolean(source.apiKey),
    updatedAt: source.updatedAt ? String(source.updatedAt) : null,
  };
}

export function createEmptyBillingAccount(overrides = {}) {
  const planId = normalizeBillingPlanId(overrides.plan || DEFAULT_BILLING_PLAN);
  return {
    id: String(overrides.id ?? '').trim(),
    name: String(overrides.name ?? '').trim(),
    ownerUid: String(overrides.ownerUid ?? '').trim(),
    plan: planId,
    status: normalizeBillingStatus(overrides.status || 'incomplete'),
    provider: normalizeBillingProvider(overrides.provider),
    currency: normalizeBillingCurrency(overrides.currency),
    stripeCustomerId: String(overrides.stripeCustomerId ?? '').trim(),
    stripeSubscriptionId: String(overrides.stripeSubscriptionId ?? '').trim(),
    mercadoPagoPreapprovalId: String(overrides.mercadoPagoPreapprovalId ?? '').trim(),
    mercadoPagoPayerEmail: String(overrides.mercadoPagoPayerEmail ?? '').trim(),
    pageIds: Array.isArray(overrides.pageIds)
      ? [...new Set(overrides.pageIds.map((id) => String(id ?? '').trim()).filter(Boolean))]
      : [],
    addons: normalizeBillingAddons(overrides.addons),
    unpaidSince: overrides.unpaidSince ? String(overrides.unpaidSince) : null,
    monetization: normalizeMonetization(overrides.monetization ?? createEmptyMonetization()),
    aiProvider: normalizeAiProviderPublic(overrides.aiProvider),
    currentPeriodEnd: overrides.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: overrides.cancelAtPeriodEnd === true,
    createdAt: overrides.createdAt ?? null,
    updatedAt: overrides.updatedAt ?? null,
  };
}

export function normalizeBillingProvider(value) {
  const provider = String(value ?? '').trim().toLowerCase();
  if (provider === 'stripe' || provider === 'mercadopago' || provider === 'manual') return provider;
  return '';
}

export function normalizeBillingCurrency(value) {
  const currency = String(value ?? '').trim().toLowerCase();
  return currency === 'mxn' ? 'mxn' : 'usd';
}

/**
 * Default checkout/display currency from admin UI locale.
 * English → USD; Spanish (and any other) → MXN.
 */
export function defaultBillingCurrencyForLocale(locale) {
  const lang = String(locale ?? '').trim().toLowerCase().slice(0, 2);
  return lang === 'en' ? 'usd' : 'mxn';
}

export function normalizeBillingAccount(id, data = {}) {
  return createEmptyBillingAccount({ ...data, id: id || data.id });
}

export function planHasFeature(planId, featureKey) {
  const plan = getBillingPlan(planId);
  return Boolean(plan?.features?.[featureKey]);
}

export function accountHasAddon(account, addonKey) {
  return account?.addons?.[addonKey] === true;
}

export function accountHasFeature(account, featureKey, { bypass = false } = {}) {
  if (bypass) return true;
  if (!isBillingAccountActive(account)) {
    // Past due / free tier: basic edit + AI Lite (free/Ollama models only).
    return featureKey === 'basicSections' || featureKey === 'aiAssistLite';
  }
  if (accountHasAddon(account, featureKey)) return true;
  return planHasFeature(account.plan, featureKey);
}

export function getAiMonthlyQuota(account, lane = 'lite', { bypass = false } = {}) {
  if (bypass) return null;
  const plan = getBillingPlan(account?.plan);
  if (lane === 'full') {
    return plan.aiMonthlyGenerations == null ? null : Number(plan.aiMonthlyGenerations) || 0;
  }
  return Number(plan.aiMonthlyGenerationsLite ?? 30) || 0;
}

export function getAccountPageLimit(account, { bypass = false } = {}) {
  if (bypass) return null;
  const plan = getBillingPlan(account?.plan);
  if (plan.features.unlimitedPages || plan.pageLimit == null) return null;
  return plan.pageLimit;
}

/** Max contact locations. Free/Starter = 1; Pro+ = unlimited (null). */
export function getAccountLocationLimit(account, { bypass = false } = {}) {
  if (bypass) return null;
  // Free-tier / unpaid: keep a single location (same as Starter).
  if (!isBillingAccountActive(account)) return 1;
  const plan = getBillingPlan(account?.plan);
  if (plan.locationLimit == null) return null;
  return Number(plan.locationLimit) || 0;
}

/**
 * Monthly AI logo generations.
 * Pro = 3; Agency/Enterprise = unlimited (null); Starter = 0.
 */
export function getAccountAiLogoLimit(account, { bypass = false } = {}) {
  if (bypass) return null;
  if (!isBillingAccountActive(account)) return 0;
  const plan = getBillingPlan(account?.plan);
  if (plan.aiLogoMonthlyLimit == null) return null;
  return Number(plan.aiLogoMonthlyLimit) || 0;
}

/**
 * Concurrent QR codes the admin can generate/download.
 * Pro = 2; Agency/Enterprise = unlimited (null); Starter/unpaid = 0.
 */
export function getAccountQrCodeLimit(account, { bypass = false } = {}) {
  if (bypass) return null;
  if (!isBillingAccountActive(account)) return 0;
  if (!planHasFeature(account?.plan, 'qrCodes')) return 0;
  const plan = getBillingPlan(account?.plan);
  if (plan.qrCodeLimit == null) return null;
  return Number(plan.qrCodeLimit) || 0;
}

/**
 * Canonical page id list for quota UI / enforcement.
 * Prefers billingAccounts.pageIds and merges any extra ids (e.g. profile assignments)
 * so legacy pages assigned before pageIds tracking still count.
 */
export function normalizeAccountPageIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((id) => String(id ?? '').trim()).filter(Boolean))];
}

export function resolveAccountPageIds(account, extraPageIds = []) {
  return normalizeAccountPageIds([
    ...(Array.isArray(account?.pageIds) ? account.pageIds : []),
    ...(Array.isArray(extraPageIds) ? extraPageIds : []),
  ]);
}

export function getAccountPageCount(account, { extraPageIds = [], bypass = false } = {}) {
  if (bypass) return 0;
  return resolveAccountPageIds(account, extraPageIds).length;
}

/**
 * Page ids known on a CMS user profile (admin list + single-page user).
 */
export function pageIdsFromUserProfile(profile = {}) {
  const fromList = normalizeAccountPageIds(profile?.assignedPageIds);
  const single = String(profile?.pageId ?? '').trim();
  return normalizeAccountPageIds([...fromList, single]);
}

export function canAccountCreatePage(account, currentPageCount = 0, { bypass = false } = {}) {
  if (bypass) return true;
  if (!isBillingAccountActive(account)) return false;
  const limit = getAccountPageLimit(account);
  if (limit == null) return true;
  return Number(currentPageCount) < limit;
}

/** Plans whose account owner may self-serve create pages (within pageLimit). */
export const PAGE_SELF_SERVE_PLAN_IDS = ['pro', 'agency'];
const PAGE_SELF_SERVE_PLAN_SET = new Set(PAGE_SELF_SERVE_PLAN_IDS);

export function isPageSelfServePlan(planId) {
  return PAGE_SELF_SERVE_PLAN_SET.has(String(planId ?? '').trim().toLowerCase());
}

/**
 * Pro/Agency account owners may create pages up to plan pageLimit.
 * Root bypass remains unlimited.
 */
export function canOwnerSelfServeCreatePage(
  account,
  currentPageCount = 0,
  { isOwner = false, bypass = false } = {},
) {
  if (bypass) return true;
  if (!isOwner) return false;
  if (!isPageSelfServePlan(getBillingPlan(account?.plan).id)) return false;
  return canAccountCreatePage(account, currentPageCount, { bypass: false });
}

export function listBillingPlansForDisplay() {
  return BILLING_PLANS.map((plan) => ({ ...plan }));
}
