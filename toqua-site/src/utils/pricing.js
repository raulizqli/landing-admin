import { normalizeLang } from './i18n';

/** ES → MXN; EN → USD */
export function getPlanPriceCurrency(lang) {
  return normalizeLang(lang) === 'en' ? 'usd' : 'mxn';
}

export function getPlanPriceAmount(plan, lang) {
  const currency = getPlanPriceCurrency(lang);
  return currency === 'mxn' ? plan.priceMxn : plan.priceUsd;
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
export function formatPlanPrice(plan, lang) {
  if (plan.priceLabel) {
    return { main: plan.priceLabel, period: null, isCustom: true };
  }

  const amount = getPlanPriceAmount(plan, lang);
  if (amount == null) {
    return { main: plan.priceLabel || '', period: null, isCustom: true };
  }

  const resolved = normalizeLang(lang);
  return {
    main: formatPlanAmount(amount, lang),
    period: resolved === 'es' ? '/ mes' : '/ mo',
    isCustom: false,
  };
}

export function getPlanSchemaPrice(plan, lang) {
  const amount = getPlanPriceAmount(plan, lang);
  const currency = getPlanPriceCurrency(lang);
  return {
    price: String(amount),
    priceCurrency: currency === 'mxn' ? 'MXN' : 'USD',
  };
}
