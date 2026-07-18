"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncSiteAccessDaily = exports.setBillingMonetization = void 0;
exports.syncAccountSiteAccess = syncAccountSiteAccess;
exports.applyBillingPatchWithSiteAccess = applyBillingPatchWithSiteAccess;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const app_1 = require("firebase-admin/app");
const siteAccessPolicy_js_1 = require("./siteAccessPolicy.js");
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
const USERS_COLLECTION = "users";
const BILLING_ACCOUNTS_COLLECTION = "billingAccounts";
const PAGES_COLLECTIONS = ["pages", "paginas"];
async function getCallerProfile(uid) {
    var _a;
    const snap = await (0, firestore_1.getFirestore)().collection(USERS_COLLECTION).doc(uid).get();
    if (!snap.exists) {
        throw new https_1.HttpsError("permission-denied", "Perfil de usuario no encontrado.");
    }
    return Object.assign({ uid }, ((_a = snap.data()) !== null && _a !== void 0 ? _a : {}));
}
async function writeSiteAccessToPages(pageIds, siteAccess) {
    const db = (0, firestore_1.getFirestore)();
    const unique = [...new Set(pageIds.map((id) => String(id !== null && id !== void 0 ? id : "").trim()).filter(Boolean))];
    for (const pageId of unique) {
        for (const collectionName of PAGES_COLLECTIONS) {
            const ref = db.collection(collectionName).doc(pageId);
            const snap = await ref.get();
            if (snap.exists) {
                await ref.set({ siteAccess }, { merge: true });
            }
        }
    }
}
async function syncAccountSiteAccess(accountId) {
    var _a;
    const db = (0, firestore_1.getFirestore)();
    const ref = db.collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId);
    const snap = await ref.get();
    if (!snap.exists)
        return null;
    const data = (_a = snap.data()) !== null && _a !== void 0 ? _a : {};
    const siteAccess = (0, siteAccessPolicy_js_1.resolveSiteAccessFromAccount)({
        status: data.status,
        unpaidSince: data.unpaidSince,
        monetization: data.monetization,
    });
    await ref.set({
        unpaidSince: siteAccess.unpaidSince,
        siteAccess,
        updatedAt: siteAccess.updatedAt,
    }, { merge: true });
    const pageIds = Array.isArray(data.pageIds) ? data.pageIds.map(String) : [];
    await writeSiteAccessToPages(pageIds, siteAccess);
    return { accountId, siteAccess, pageCount: pageIds.length };
}
/**
 * Apply billing patch and keep unpaidSince + denormalized page siteAccess in sync.
 */
async function applyBillingPatchWithSiteAccess(accountId, patch) {
    var _a, _b;
    const db = (0, firestore_1.getFirestore)();
    const ref = db.collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId);
    const previous = await ref.get();
    const previousData = previous.exists ? (_a = previous.data()) !== null && _a !== void 0 ? _a : {} : {};
    const nextStatus = patch.status !== undefined ? patch.status : previousData.status;
    const unpaidSince = (0, siteAccessPolicy_js_1.nextUnpaidSince)(previousData, nextStatus);
    const monetization = patch.monetization !== undefined
        ? (0, siteAccessPolicy_js_1.normalizeMonetization)(patch.monetization)
        : (0, siteAccessPolicy_js_1.normalizeMonetization)(previousData.monetization);
    const mergedForResolve = {
        status: nextStatus,
        unpaidSince,
        monetization,
    };
    const siteAccess = (0, siteAccessPolicy_js_1.resolveSiteAccessFromAccount)(mergedForResolve);
    await ref.set(Object.assign(Object.assign({}, patch), { unpaidSince: siteAccess.unpaidSince, monetization,
        siteAccess, updatedAt: new Date().toISOString() }), { merge: true });
    const nextSnap = await ref.get();
    const nextData = (_b = nextSnap.data()) !== null && _b !== void 0 ? _b : {};
    const pageIds = Array.isArray(nextData.pageIds) ? nextData.pageIds.map(String) : [];
    await writeSiteAccessToPages(pageIds, siteAccess);
    return Object.assign(Object.assign({ id: accountId }, nextData), { siteAccess });
}
/** Root: mark whether Google Ads publicity is earning enough to keep sites online. */
exports.setBillingMonetization = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const profile = await getCallerProfile(request.auth.uid);
    if (String((_b = profile.role) !== null && _b !== void 0 ? _b : "").trim().toLowerCase() !== "root") {
        throw new https_1.HttpsError("permission-denied", "Solo root puede gestionar monetización.");
    }
    const accountId = String((_d = (_c = request.data) === null || _c === void 0 ? void 0 : _c.accountId) !== null && _d !== void 0 ? _d : "").trim();
    if (!accountId) {
        throw new https_1.HttpsError("invalid-argument", "accountId es obligatorio.");
    }
    const adsRevenueOk = (_f = (_e = request.data) === null || _e === void 0 ? void 0 : _e.monetization) === null || _f === void 0 ? void 0 : _f.adsRevenueOk;
    const forceStage = (_h = (_g = request.data) === null || _g === void 0 ? void 0 : _g.monetization) === null || _h === void 0 ? void 0 : _h.forceStage;
    if (typeof adsRevenueOk !== "boolean" && forceStage === undefined) {
        throw new https_1.HttpsError("invalid-argument", "Debes enviar monetization.adsRevenueOk y/o monetization.forceStage.");
    }
    const previous = await (0, firestore_1.getFirestore)().collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId).get();
    if (!previous.exists) {
        throw new https_1.HttpsError("not-found", `No existe billingAccounts/${accountId}.`);
    }
    const current = (0, siteAccessPolicy_js_1.normalizeMonetization)((_j = previous.data()) === null || _j === void 0 ? void 0 : _j.monetization);
    const next = {
        adsRevenueOk: typeof adsRevenueOk === "boolean" ? adsRevenueOk : current.adsRevenueOk,
        forceStage: forceStage !== undefined
            ? (0, siteAccessPolicy_js_1.normalizeMonetization)({ forceStage }).forceStage
            : current.forceStage,
    };
    const account = await applyBillingPatchWithSiteAccess(accountId, { monetization: next });
    return { account };
});
/** Daily recompute so 6-month / 9-month thresholds apply without new webhooks. */
exports.syncSiteAccessDaily = (0, scheduler_1.onSchedule)("every 24 hours", async () => {
    const snap = await (0, firestore_1.getFirestore)().collection(BILLING_ACCOUNTS_COLLECTION).get();
    for (const doc of snap.docs) {
        try {
            await syncAccountSiteAccess(doc.id);
        }
        catch (error) {
            console.error("syncSiteAccessDaily failed for", doc.id, error);
        }
    }
});
//# sourceMappingURL=siteAccessSync.js.map