"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBillingAccountAddons = exports.assertMarketingSiteAccess = void 0;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
const USERS_COLLECTION = "users";
const BILLING_ACCOUNTS_COLLECTION = "billingAccounts";
const PLANS_WITH_MARKETING_SITE = new Set(["enterprise"]);
function normalizePlanId(value) {
    const id = String(value !== null && value !== void 0 ? value : "").trim().toLowerCase();
    if (id === "starter" || id === "pro" || id === "agency" || id === "enterprise")
        return id;
    return "starter";
}
function normalizeStatus(value) {
    const status = String(value !== null && value !== void 0 ? value : "").trim().toLowerCase();
    if (status === "active" || status === "trialing" || status === "past_due" || status === "canceled" || status === "incomplete") {
        return status;
    }
    return "incomplete";
}
function isAccountActive(status) {
    return status === "active" || status === "trialing";
}
function accountHasMarketingSite(account) {
    var _a;
    if (!isAccountActive(normalizeStatus(account.status)))
        return false;
    if (((_a = account === null || account === void 0 ? void 0 : account.addons) === null || _a === void 0 ? void 0 : _a.marketingSite) === true)
        return true;
    return PLANS_WITH_MARKETING_SITE.has(normalizePlanId(account.plan));
}
function normalizePageIdList(values) {
    if (!Array.isArray(values))
        return [];
    return [...new Set(values.map((value) => String(value !== null && value !== void 0 ? value : "").trim()).filter(Boolean))];
}
function canAccessPage(profile, pageId) {
    var _a, _b;
    const role = String((_a = profile.role) !== null && _a !== void 0 ? _a : "").trim().toLowerCase();
    if (role === "root")
        return true;
    if (role === "admin") {
        return normalizePageIdList(profile.assignedPageIds).includes(pageId);
    }
    if (role === "user") {
        const single = String((_b = profile.pageId) !== null && _b !== void 0 ? _b : "").trim();
        if (single)
            return single === pageId;
        return normalizePageIdList(profile.assignedPageIds)[0] === pageId;
    }
    return false;
}
async function getCallerProfile(uid) {
    var _a;
    const snap = await (0, firestore_1.getFirestore)().collection(USERS_COLLECTION).doc(uid).get();
    if (!snap.exists) {
        throw new https_1.HttpsError("permission-denied", "Perfil de usuario no encontrado.");
    }
    return Object.assign({ uid }, ((_a = snap.data()) !== null && _a !== void 0 ? _a : {}));
}
async function loadBillingAccount(accountId) {
    var _a;
    const snap = await (0, firestore_1.getFirestore)().collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId).get();
    if (!snap.exists) {
        throw new https_1.HttpsError("failed-precondition", "Cuenta de billing no encontrada.");
    }
    return Object.assign({ id: accountId }, ((_a = snap.data()) !== null && _a !== void 0 ? _a : {}));
}
/**
 * Hard gate before publishing Marketing Site data.
 * Root bypasses; others need Enterprise plan or Agency marketingSite add-on.
 */
exports.assertMarketingSiteAccess = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d, _e, _f;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const pageId = String((_c = (_b = request.data) === null || _b === void 0 ? void 0 : _b.pageId) !== null && _c !== void 0 ? _c : "").trim();
    if (!pageId) {
        throw new https_1.HttpsError("invalid-argument", "pageId es obligatorio.");
    }
    const profile = await getCallerProfile(request.auth.uid);
    if (!canAccessPage(profile, pageId)) {
        throw new https_1.HttpsError("permission-denied", "No tienes acceso a esta página.");
    }
    const role = String((_d = profile.role) !== null && _d !== void 0 ? _d : "").trim().toLowerCase();
    if (role === "root") {
        return { ok: true, source: "root", pageId };
    }
    const accountId = String((_e = profile.accountId) !== null && _e !== void 0 ? _e : profile.uid).trim();
    const account = await loadBillingAccount(accountId);
    if (!accountHasMarketingSite(account)) {
        throw new https_1.HttpsError("permission-denied", "Marketing Site requiere plan Enterprise o el add-on marketingSite en Agency.");
    }
    const source = ((_f = account.addons) === null || _f === void 0 ? void 0 : _f.marketingSite) === true ? "addon" : "plan";
    return { ok: true, source, pageId, accountId, plan: normalizePlanId(account.plan) };
});
/** Root-only: toggle paid add-ons on a billing account (e.g. Agency + marketingSite). */
exports.setBillingAccountAddons = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const profile = await getCallerProfile(request.auth.uid);
    if (String((_b = profile.role) !== null && _b !== void 0 ? _b : "").trim().toLowerCase() !== "root") {
        throw new https_1.HttpsError("permission-denied", "Solo root puede gestionar add-ons de billing.");
    }
    const accountId = String((_d = (_c = request.data) === null || _c === void 0 ? void 0 : _c.accountId) !== null && _d !== void 0 ? _d : "").trim();
    if (!accountId) {
        throw new https_1.HttpsError("invalid-argument", "accountId es obligatorio.");
    }
    const marketingSite = (_f = (_e = request.data) === null || _e === void 0 ? void 0 : _e.addons) === null || _f === void 0 ? void 0 : _f.marketingSite;
    if (typeof marketingSite !== "boolean") {
        throw new https_1.HttpsError("invalid-argument", "addons.marketingSite debe ser boolean.");
    }
    const ref = (0, firestore_1.getFirestore)().collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId);
    const snap = await ref.get();
    if (!snap.exists) {
        throw new https_1.HttpsError("not-found", `No existe billingAccounts/${accountId}.`);
    }
    const existing = (((_g = snap.data()) === null || _g === void 0 ? void 0 : _g.addons) && typeof ((_h = snap.data()) === null || _h === void 0 ? void 0 : _h.addons) === "object")
        ? Object.assign({}, (_j = snap.data()) === null || _j === void 0 ? void 0 : _j.addons) : {};
    if (marketingSite) {
        existing.marketingSite = true;
    }
    else {
        delete existing.marketingSite;
    }
    const now = new Date().toISOString();
    await ref.set({ addons: existing, updatedAt: now }, { merge: true });
    const next = await ref.get();
    return { account: Object.assign({ id: accountId }, ((_k = next.data()) !== null && _k !== void 0 ? _k : {})) };
});
//# sourceMappingURL=marketingEntitlement.js.map