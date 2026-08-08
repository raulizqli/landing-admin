"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCmsPage = void 0;
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const https_1 = require("firebase-functions/v2/https");
const callableOptions_js_1 = require("./callableOptions.js");
const cmsInbox_js_1 = require("./cmsInbox.js");
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
const USERS_COLLECTION = "users";
const PAGES_COLLECTION = "pages";
const BILLING_ACCOUNTS_COLLECTION = "billingAccounts";
const PAGE_SELF_SERVE_PLANS = new Set(["pro", "agency"]);
const VERTICAL_IDS = new Set([
    "generic",
    "psychology",
    "dental",
    "veterinary",
    "legal",
    "medical",
    "beauty",
    "fitness",
    "education",
    "ecommerce",
]);
function slugifyPageId(value) {
    return String(value !== null && value !== void 0 ? value : "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 64);
}
function isValidPageId(pageId) {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pageId);
}
function normalizePageIdList(values) {
    if (!Array.isArray(values))
        return [];
    return [...new Set(values.map((value) => String(value !== null && value !== void 0 ? value : "").trim()).filter(Boolean))];
}
function normalizePlanId(value) {
    const id = String(value !== null && value !== void 0 ? value : "").trim().toLowerCase();
    if (id === "pro" || id === "agency" || id === "enterprise" || id === "starter")
        return id;
    return "starter";
}
function normalizeVertical(value) {
    const id = String(value !== null && value !== void 0 ? value : "").trim().toLowerCase();
    return VERTICAL_IDS.has(id) ? id : "generic";
}
function isActiveStatus(status) {
    const value = String(status !== null && status !== void 0 ? status : "").trim().toLowerCase();
    return value === "active" || value === "trialing";
}
function isBillingAccountOwner(profile, uid) {
    const accountId = String(profile.accountId || uid).trim();
    return Boolean(uid && accountId && accountId === uid);
}
async function getCallerProfile(uid) {
    var _a;
    const snap = await (0, firestore_1.getFirestore)().collection(USERS_COLLECTION).doc(uid).get();
    if (!snap.exists) {
        throw new https_1.HttpsError("permission-denied", "Perfil de usuario no encontrado.");
    }
    return Object.assign({ uid }, ((_a = snap.data()) !== null && _a !== void 0 ? _a : {}));
}
function buildInitialPageDoc(input) {
    const now = new Date().toISOString();
    return {
        name: input.name,
        specialty: input.specialty,
        vertical: input.vertical,
        useExternalFirebase: false,
        heroSectionEnabled: true,
        aboutSectionEnabled: true,
        servicesSectionEnabled: false,
        catalogSectionEnabled: false,
        gallerySectionEnabled: false,
        videoSectionEnabled: false,
        testimonialsEnabled: false,
        blogSectionEnabled: false,
        contactSectionEnabled: true,
        socialSectionEnabled: true,
        footerSectionEnabled: true,
        preHeroEnabled: false,
        createdAt: now,
        updatedAt: now,
    };
}
const callableOptions = (0, callableOptions_js_1.sensitiveCallableOptions)();
/**
 * Create a CMS page with plan quota enforcement.
 * Root: unrestricted. Pro/Agency account owners: up to pageLimit.
 */
exports.createCmsPage = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const uid = request.auth.uid;
    const profile = await getCallerProfile(uid);
    const isRoot = String((_b = profile.role) !== null && _b !== void 0 ? _b : "").trim().toLowerCase() === "root";
    const isOwner = isBillingAccountOwner(profile, uid);
    const pageId = slugifyPageId((_c = request.data) === null || _c === void 0 ? void 0 : _c.pageId);
    const name = String((_e = (_d = request.data) === null || _d === void 0 ? void 0 : _d.name) !== null && _e !== void 0 ? _e : "").trim();
    const specialty = String((_g = (_f = request.data) === null || _f === void 0 ? void 0 : _f.specialty) !== null && _g !== void 0 ? _g : "").trim();
    const vertical = normalizeVertical((_h = request.data) === null || _h === void 0 ? void 0 : _h.vertical);
    if (!isValidPageId(pageId)) {
        throw new https_1.HttpsError("invalid-argument", "Usa un ID con minúsculas, números y guiones (ej. maria-garcia).");
    }
    if (!name) {
        throw new https_1.HttpsError("invalid-argument", "El nombre es obligatorio.");
    }
    const accountId = String((_j = profile.accountId) !== null && _j !== void 0 ? _j : uid).trim();
    const db = (0, firestore_1.getFirestore)();
    const pageRef = db.collection(PAGES_COLLECTION).doc(pageId);
    const accountRef = db.collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId);
    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    // HttpsError thrown inside runTransaction can be wrapped; capture and rethrow after.
    let denial = null;
    await db.runTransaction(async (tx) => {
        var _a, _b, _c, _d;
        if (denial)
            return;
        const [pageSnap, accountSnap, userSnap] = await Promise.all([
            tx.get(pageRef),
            tx.get(accountRef),
            tx.get(userRef),
        ]);
        if (pageSnap.exists) {
            denial = new https_1.HttpsError("already-exists", `Ya existe una página con ID "${pageId}".`);
            return;
        }
        const accountData = accountSnap.exists ? ((_a = accountSnap.data()) !== null && _a !== void 0 ? _a : {}) : {};
        const planId = normalizePlanId(accountData.plan);
        const pageIds = normalizePageIdList(accountData.pageIds);
        const pageLimit = planId === "enterprise" ? null : planId === "agency" ? 5 : planId === "pro" ? 1 : 1;
        if (!isRoot) {
            if (!isOwner) {
                denial = new https_1.HttpsError("permission-denied", "Solo el dueño de la cuenta puede crear páginas.");
                return;
            }
            if (!PAGE_SELF_SERVE_PLANS.has(planId)) {
                denial = new https_1.HttpsError("permission-denied", "Crear páginas requiere plan Pro o Agency.");
                return;
            }
            if (!isActiveStatus(accountData.status)) {
                denial = new https_1.HttpsError("failed-precondition", "Tu suscripción no está activa. Reactiva el plan para crear páginas.");
                return;
            }
            if (pageLimit != null && pageIds.length >= pageLimit) {
                denial = new https_1.HttpsError("resource-exhausted", `Límite de páginas alcanzado (${pageIds.length}/${pageLimit}).`);
                return;
            }
            if (!accountSnap.exists) {
                denial = new https_1.HttpsError("failed-precondition", "No hay cuenta de billing. Abre Facturación o contacta soporte.");
                return;
            }
        }
        const initial = buildInitialPageDoc({ name, specialty, vertical });
        tx.set(pageRef, initial);
        if (accountSnap.exists) {
            tx.set(accountRef, {
                pageIds: firestore_1.FieldValue.arrayUnion(pageId),
                updatedAt: new Date().toISOString(),
            }, { merge: true });
        }
        const userData = (_b = userSnap.data()) !== null && _b !== void 0 ? _b : {};
        const role = String((_c = userData.role) !== null && _c !== void 0 ? _c : "").trim().toLowerCase();
        const existingPageId = String((_d = userData.pageId) !== null && _d !== void 0 ? _d : "").trim();
        const patch = {
            accountId,
            updatedAt: new Date().toISOString(),
        };
        // Always attach the new page to the creator so CMS list + Firestore canEditPage work
        // for Agency/Pro owners (role user|admin) without a stale empty pageId.
        if (role === "admin" || role === "user" || (isOwner && role !== "root")) {
            patch.assignedPageIds = firestore_1.FieldValue.arrayUnion(pageId);
            if (!existingPageId) {
                patch.pageId = pageId;
            }
        }
        tx.set(userRef, patch, { merge: true });
    });
    if (denial) {
        throw denial;
    }
    const createdSnap = await pageRef.get();
    const pageData = ((_k = createdSnap.data()) !== null && _k !== void 0 ? _k : {});
    try {
        await (0, cmsInbox_js_1.writePageAuditAndNotify)({
            pageId,
            actor: {
                uid,
                role: String((_l = profile.role) !== null && _l !== void 0 ? _l : ""),
                email: String((_m = profile.email) !== null && _m !== void 0 ? _m : ""),
                displayName: String((_o = profile.displayName) !== null && _o !== void 0 ? _o : ""),
            },
            before: {},
            after: pageData,
            action: "page_create",
            notify: true,
        });
    }
    catch (auditError) {
        console.error("createCmsPage audit skipped:", auditError);
    }
    return {
        ok: true,
        pageId,
        page: Object.assign({ id: pageId }, pageData),
        accountId,
    };
});
//# sourceMappingURL=cmsPages.js.map