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

export function accountHasFeature(account, featureKey, { bypass = false } = {}) {
  if (bypass) return true;
  if (!isBillingAccountActive(account)) {
    // Past due: still allow basic edit of existing pages.
    return featureKey === 'basicSections';
  }
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
