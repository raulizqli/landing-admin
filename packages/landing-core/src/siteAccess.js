/**
 * Public site access policy after unpaid subscription periods.
 *
 * Timeline (from unpaidSince):
 *  0–6 months  → grace (online, no ads)
 *  6–9 months  → ads (online + Google Ad / publicity banner for platform revenue)
 *  9+ months   → offline, unless ops marks adsRevenueOk (ads keep generating revenue)
 */

export const SITE_ACCESS_STAGES = ['paid', 'grace', 'ads', 'offline'];

/** Days unpaid before Google Ads / publicity banner appears. */
export const SITE_ACCESS_ADS_AFTER_DAYS = 180;

/**
 * Days unpaid before the site goes offline when ad revenue is not confirmed.
 * Default = 6 months grace + 3 months ads without revenue.
 */
export const SITE_ACCESS_OFFLINE_AFTER_DAYS = 270;

const DAY_MS = 24 * 60 * 60 * 1000;

export function createEmptyMonetization(overrides = {}) {
  const force = String(overrides.forceStage ?? '').trim().toLowerCase();
  return {
    adsRevenueOk: overrides.adsRevenueOk === true,
    forceStage: SITE_ACCESS_STAGES.includes(force) && force !== 'paid' ? force : '',
  };
}

export function normalizeMonetization(value = {}) {
  return createEmptyMonetization(value && typeof value === 'object' ? value : {});
}

export function createEmptySiteAccess(overrides = {}) {
  const stage = String(overrides.stage ?? 'paid').trim().toLowerCase();
  return {
    stage: SITE_ACCESS_STAGES.includes(stage) ? stage : 'paid',
    unpaidSince: overrides.unpaidSince ? String(overrides.unpaidSince) : null,
    adsEnabled: overrides.adsEnabled === true,
    offline: overrides.offline === true,
    updatedAt: overrides.updatedAt ? String(overrides.updatedAt) : null,
  };
}

export function normalizeSiteAccess(value = {}) {
  return createEmptySiteAccess(value && typeof value === 'object' ? value : {});
}

function parseTime(value, fallback) {
  if (!value) return fallback;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : fallback;
}

/**
 * Resolve public site access from a billing account snapshot.
 * @param {object} account
 * @param {{ now?: Date|number|string }} [options]
 */
export function resolveSiteAccessFromAccount(account = {}, { now = Date.now() } = {}) {
  const monetization = normalizeMonetization(account.monetization);
  const status = String(account.status ?? '').trim().toLowerCase();
  const paid = status === 'active' || status === 'trialing';
  const nowMs = parseTime(now, Date.now());

  if (paid) {
    return createEmptySiteAccess({
      stage: 'paid',
      unpaidSince: null,
      adsEnabled: false,
      offline: false,
      updatedAt: new Date(nowMs).toISOString(),
    });
  }

  if (monetization.forceStage === 'offline') {
    return createEmptySiteAccess({
      stage: 'offline',
      unpaidSince: account.unpaidSince || new Date(nowMs).toISOString(),
      adsEnabled: false,
      offline: true,
      updatedAt: new Date(nowMs).toISOString(),
    });
  }

  if (monetization.forceStage === 'ads') {
    return createEmptySiteAccess({
      stage: 'ads',
      unpaidSince: account.unpaidSince || new Date(nowMs).toISOString(),
      adsEnabled: true,
      offline: false,
      updatedAt: new Date(nowMs).toISOString(),
    });
  }

  if (monetization.forceStage === 'grace') {
    return createEmptySiteAccess({
      stage: 'grace',
      unpaidSince: account.unpaidSince || new Date(nowMs).toISOString(),
      adsEnabled: false,
      offline: false,
      updatedAt: new Date(nowMs).toISOString(),
    });
  }

  const unpaidSince = account.unpaidSince || new Date(nowMs).toISOString();
  const unpaidMs = parseTime(unpaidSince, nowMs);
  const elapsedDays = Math.max(0, (nowMs - unpaidMs) / DAY_MS);

  if (elapsedDays >= SITE_ACCESS_OFFLINE_AFTER_DAYS && !monetization.adsRevenueOk) {
    return createEmptySiteAccess({
      stage: 'offline',
      unpaidSince,
      adsEnabled: false,
      offline: true,
      updatedAt: new Date(nowMs).toISOString(),
    });
  }

  if (elapsedDays >= SITE_ACCESS_ADS_AFTER_DAYS) {
    return createEmptySiteAccess({
      stage: 'ads',
      unpaidSince,
      adsEnabled: true,
      offline: false,
      updatedAt: new Date(nowMs).toISOString(),
    });
  }

  return createEmptySiteAccess({
    stage: 'grace',
    unpaidSince,
    adsEnabled: false,
    offline: false,
    updatedAt: new Date(nowMs).toISOString(),
  });
}

/**
 * Patch helpers when billing status transitions.
 * Clears unpaidSince on paid; stamps it when first becoming unpaid.
 */
export function nextUnpaidSince(previousAccount = {}, nextStatus, { now = Date.now() } = {}) {
  const status = String(nextStatus ?? '').trim().toLowerCase();
  if (status === 'active' || status === 'trialing') return null;
  if (previousAccount.unpaidSince) return String(previousAccount.unpaidSince);
  return new Date(parseTime(now, Date.now())).toISOString();
}

export function siteAccessAllowsPublicView(siteAccess) {
  const access = normalizeSiteAccess(siteAccess);
  return !access.offline && access.stage !== 'offline';
}

export function siteAccessShowsAds(siteAccess) {
  const access = normalizeSiteAccess(siteAccess);
  return access.adsEnabled || access.stage === 'ads';
}
