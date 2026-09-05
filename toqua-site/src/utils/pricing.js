import { normalizeLang } from './i18n';

/** Keep in sync with BILLING_ANNUAL_DISCOUNT in packages/landing-core/src/billingPlans.js */
export const BILLING_ANNUAL_DISCOUNT = 0.2;

export function yearlyPriceFromMonthly(monthly) {
  if (monthly == null || monthly === '') return null;
  const n = Number(monthly);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 12 * (1 - BILLING_ANNUAL_DISCOUNT));
}

export function normalizeBillingInterval(value) {
  return String(value ?? '').trim().toLowerCase() === 'year' ? 'year' : 'month';
}

/** ES → MXN; EN → USD */
export function getPlanPriceCurrency(lang) {
  return normalizeLang(lang) === 'en' ? 'usd' : 'mxn';
}

export function getPlanPriceAmount(plan, lang, interval = 'month') {
  const currency = getPlanPriceCurrency(lang);
  const monthly = currency === 'mxn' ? plan.priceMxn : plan.priceUsd;
  if (monthly == null) return null;
  return normalizeBillingInterval(interval) === 'year'
    ? yearlyPriceFromMonthly(monthly)
    : monthly;
}

export function planHasDisplayPrice(plan) {
  return getPlanPriceAmount(plan, 'es') != null || getPlanPriceAmount(plan, 'en') != null;
}

export function formatPlanAmount(amount, lang) {
  const currency = getPlanPriceCurrency(lang);
  const formatted = Number(amount).toLocaleString(currency === 'mxn' ? 'es-MX' : 'en-US');
  return currency === 'mxn' ? `$${formatted} MXN` : `$${formatted} USD`;
}

/**
 * @returns {{ main: string, period: string | null, isCustom: boolean }}
 */
export function formatPlanPrice(plan, lang, interval = 'month') {
  if (plan.priceLabel) {
    return { main: plan.priceLabel, period: null, isCustom: true };
  }

  const amount = getPlanPriceAmount(plan, lang, interval);
  if (amount == null) {
    return { main: plan.priceLabel || '', period: null, isCustom: true };
  }

  const resolved = normalizeLang(lang);
  const yearly = normalizeBillingInterval(interval) === 'year';
  return {
    main: formatPlanAmount(amount, lang),
    period: yearly
      ? (resolved === 'es' ? '/ año' : '/ yr')
      : (resolved === 'es' ? '/ mes' : '/ mo'),
    isCustom: false,
  };
}

export function getPlanSchemaPrice(plan, lang) {
  const amount = getPlanPriceAmount(plan, lang, 'month');
  const currency = getPlanPriceCurrency(lang);
  return {
    price: String(amount),
    priceCurrency: currency === 'mxn' ? 'MXN' : 'USD',
  };
}
