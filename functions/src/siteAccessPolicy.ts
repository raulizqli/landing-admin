/**
 * Mirror of packages/landing-core/src/siteAccess.js for Cloud Functions sync.
 * Keep thresholds in sync when changing the core module.
 */

export const SITE_ACCESS_ADS_AFTER_DAYS = 180;
export const SITE_ACCESS_OFFLINE_AFTER_DAYS = 270;

const DAY_MS = 24 * 60 * 60 * 1000;

export type SiteAccessStage = "paid" | "grace" | "ads" | "offline";

export interface SiteAccessSnapshot {
  stage: SiteAccessStage;
  unpaidSince: string | null;
  adsEnabled: boolean;
  offline: boolean;
  updatedAt: string;
}

export interface MonetizationSettings {
  adsRevenueOk: boolean;
  forceStage: "" | "grace" | "ads" | "offline";
}

function parseTime(value: unknown, fallback: number): number {
  if (!value) return fallback;
  const ms = new Date(String(value)).getTime();
  return Number.isFinite(ms) ? ms : fallback;
}

export function normalizeMonetization(value: unknown): MonetizationSettings {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const force = String(source.forceStage ?? "").trim().toLowerCase();
  return {
    adsRevenueOk: source.adsRevenueOk === true,
    forceStage: force === "grace" || force === "ads" || force === "offline" ? force : "",
  };
}

export function nextUnpaidSince(
  previousAccount: { unpaidSince?: unknown },
  nextStatus: unknown,
  now: number | string = Date.now(),
): string | null {
  const status = String(nextStatus ?? "").trim().toLowerCase();
  if (status === "active" || status === "trialing") return null;
  if (previousAccount.unpaidSince) return String(previousAccount.unpaidSince);
  return new Date(parseTime(now, Date.now())).toISOString();
}

export function resolveSiteAccessFromAccount(
  account: {
    status?: unknown;
    unpaidSince?: unknown;
    monetization?: unknown;
  },
  now: number | string = Date.now(),
): SiteAccessSnapshot {
  const monetization = normalizeMonetization(account.monetization);
  const status = String(account.status ?? "").trim().toLowerCase();
  const paid = status === "active" || status === "trialing";
  const nowMs = parseTime(now, Date.now());
  const updatedAt = new Date(nowMs).toISOString();

  if (paid) {
    return {
      stage: "paid",
      unpaidSince: null,
      adsEnabled: false,
      offline: false,
      updatedAt,
    };
  }

  if (monetization.forceStage === "offline") {
    return {
      stage: "offline",
      unpaidSince: account.unpaidSince ? String(account.unpaidSince) : updatedAt,
      adsEnabled: false,
      offline: true,
      updatedAt,
    };
  }

  if (monetization.forceStage === "ads") {
    return {
      stage: "ads",
      unpaidSince: account.unpaidSince ? String(account.unpaidSince) : updatedAt,
      adsEnabled: true,
      offline: false,
      updatedAt,
    };
  }

  if (monetization.forceStage === "grace") {
    return {
      stage: "grace",
      unpaidSince: account.unpaidSince ? String(account.unpaidSince) : updatedAt,
      adsEnabled: false,
      offline: false,
      updatedAt,
    };
  }

  const unpaidSince = account.unpaidSince ? String(account.unpaidSince) : updatedAt;
  const elapsedDays = Math.max(0, (nowMs - parseTime(unpaidSince, nowMs)) / DAY_MS);

  if (elapsedDays >= SITE_ACCESS_OFFLINE_AFTER_DAYS && !monetization.adsRevenueOk) {
    return {
      stage: "offline",
      unpaidSince,
      adsEnabled: false,
      offline: true,
      updatedAt,
    };
  }

  if (elapsedDays >= SITE_ACCESS_ADS_AFTER_DAYS) {
    return {
      stage: "ads",
      unpaidSince,
      adsEnabled: true,
      offline: false,
      updatedAt,
    };
  }

  return {
    stage: "grace",
    unpaidSince,
    adsEnabled: false,
    offline: false,
    updatedAt,
  };
}
