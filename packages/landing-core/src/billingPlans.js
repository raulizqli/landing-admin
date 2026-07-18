/**
 * SaaS billing plans / entitlements for the landings CMS.
 * Keep in sync with Cloud Functions checkout price mapping (env).
 */

export const BILLING_PLANS = [
  {
    id: 'starter',
    rank: 1,
    pageLimit: 1,
    monthlyPriceUsd: 19,
    monthlyPriceMxn: 349,
    features: {
      basicSections: true,
      blog: false,
      galleryPortfolio: false,
      customEmbeds: false,
      servicesCarouselAutoplay: false,
      contactMapBeside: false,
      externalFirebase: false,
      hostingDeploy: false,
      prioritySupport: false,
      support247: false,
      unlimitedPages: false,
      marketingSite: false,
    },
  },
  {
    id: 'pro',
    rank: 2,
    pageLimit: 1,
    monthlyPriceUsd: 49,
    monthlyPriceMxn: 899,
    features: {
      basicSections: true,
      blog: true,
      galleryPortfolio: true,
      customEmbeds: true,
      servicesCarouselAutoplay: true,
      contactMapBeside: true,
      externalFirebase: false,
      hostingDeploy: false,
      prioritySupport: false,
      support247: false,
      unlimitedPages: false,
      marketingSite: false,
    },
  },
  {
    id: 'agency',
    rank: 3,
    pageLimit: 5,
    monthlyPriceUsd: 129,
    monthlyPriceMxn: 2499,
    features: {
      basicSections: true,
      blog: true,
      galleryPortfolio: true,
      customEmbeds: true,
      servicesCarouselAutoplay: true,
      contactMapBeside: true,
      externalFirebase: true,
      hostingDeploy: true,
      prioritySupport: true,
      support247: false,
      unlimitedPages: false,
      marketingSite: false,
    },
  },
  {
    id: 'enterprise',
    rank: 4,
    pageLimit: null,
    monthlyPriceUsd: null,
    monthlyPriceMxn: null,
    features: {
      basicSections: true,
      blog: true,
      galleryPortfolio: true,
      customEmbeds: true,
      servicesCarouselAutoplay: true,
      contactMapBeside: true,
      externalFirebase: true,
      hostingDeploy: true,
      prioritySupport: true,
      support247: true,
      unlimitedPages: true,
      marketingSite: true,
    },
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
export function getSubscriptionHealth(account, { bypass = false } = {}) {
  const plan = getBillingPlan(account?.plan);
  const status = normalizeBillingStatus(account?.status);
  const pageCount = Array.isArray(account?.pageIds) ? account.pageIds.length : 0;
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
    // Past due: still allow basic edit of existing pages.
    return featureKey === 'basicSections';
  }
  if (accountHasAddon(account, featureKey)) return true;
  return planHasFeature(account.plan, featureKey);
}

export function getAccountPageLimit(account, { bypass = false } = {}) {
  if (bypass) return null;
  const plan = getBillingPlan(account?.plan);
  if (plan.features.unlimitedPages || plan.pageLimit == null) return null;
  return plan.pageLimit;
}

export function canAccountCreatePage(account, currentPageCount = 0, { bypass = false } = {}) {
  if (bypass) return true;
  if (!isBillingAccountActive(account)) return false;
  const limit = getAccountPageLimit(account);
  if (limit == null) return true;
  return Number(currentPageCount) < limit;
}

export function listBillingPlansForDisplay() {
  return BILLING_PLANS.map((plan) => ({ ...plan }));
}
