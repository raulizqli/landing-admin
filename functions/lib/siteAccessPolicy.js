"use strict";
/**
 * Mirror of packages/landing-core/src/siteAccess.js for Cloud Functions sync.
 * Keep thresholds in sync when changing the core module.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SITE_ACCESS_OFFLINE_AFTER_DAYS = exports.SITE_ACCESS_ADS_AFTER_DAYS = void 0;
exports.normalizeMonetization = normalizeMonetization;
exports.nextUnpaidSince = nextUnpaidSince;
exports.resolveSiteAccessFromAccount = resolveSiteAccessFromAccount;
exports.SITE_ACCESS_ADS_AFTER_DAYS = 180;
exports.SITE_ACCESS_OFFLINE_AFTER_DAYS = 270;
const DAY_MS = 24 * 60 * 60 * 1000;
function parseTime(value, fallback) {
    if (!value)
        return fallback;
    const ms = new Date(String(value)).getTime();
    return Number.isFinite(ms) ? ms : fallback;
}
function normalizeMonetization(value) {
    var _a;
    const source = value && typeof value === "object" ? value : {};
    const force = String((_a = source.forceStage) !== null && _a !== void 0 ? _a : "").trim().toLowerCase();
    return {
        adsRevenueOk: source.adsRevenueOk === true,
        forceStage: force === "grace" || force === "ads" || force === "offline" ? force : "",
    };
}
function nextUnpaidSince(previousAccount, nextStatus, now = Date.now()) {
    const status = String(nextStatus !== null && nextStatus !== void 0 ? nextStatus : "").trim().toLowerCase();
    if (status === "active" || status === "trialing")
        return null;
    if (previousAccount.unpaidSince)
        return String(previousAccount.unpaidSince);
    return new Date(parseTime(now, Date.now())).toISOString();
}
function resolveSiteAccessFromAccount(account, now = Date.now()) {
    var _a;
    const monetization = normalizeMonetization(account.monetization);
    const status = String((_a = account.status) !== null && _a !== void 0 ? _a : "").trim().toLowerCase();
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
    if (elapsedDays >= exports.SITE_ACCESS_OFFLINE_AFTER_DAYS && !monetization.adsRevenueOk) {
        return {
            stage: "offline",
            unpaidSince,
            adsEnabled: false,
            offline: true,
            updatedAt,
        };
    }
    if (elapsedDays >= exports.SITE_ACCESS_ADS_AFTER_DAYS) {
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
//# sourceMappingURL=siteAccessPolicy.js.map