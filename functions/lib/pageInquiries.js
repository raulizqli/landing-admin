"use strict";
/**
 * Public landing inquiry submissions (quote / session requests).
 * Writes under pages/{pageId}/inquiries via Admin SDK only.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPageInquiries = exports.submitPageInquiry = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const callableOptions_js_1 = require("./callableOptions.js");
const cmsInbox_js_1 = require("./cmsInbox.js");
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
const PAGES_COLLECTION = "pages";
const PAGES_LEGACY_COLLECTION = "paginas";
const NOTIFICATIONS_COLLECTION = "notifications";
const USERS_COLLECTION = "users";
const MAX_NAME = 120;
const MAX_MESSAGE = 2000;
const MAX_CONTACT = 120;
const MAX_PROJECT_TYPE = 80;
const MAX_LIST = 50;
const callableOptions = (0, callableOptions_js_1.sensitiveCallableOptions)({ enforceAppCheck: false });
const listCallableOptions = (0, callableOptions_js_1.sensitiveCallableOptions)();
function sanitize(value, max) {
    return String(value !== null && value !== void 0 ? value : "").trim().slice(0, max);
}
function normalizeRole(role) {
    return String(role !== null && role !== void 0 ? role : "").trim().toLowerCase();
}
function normalizePageIdList(values) {
    if (!Array.isArray(values))
        return [];
    return [...new Set(values.map((value) => String(value !== null && value !== void 0 ? value : "").trim()).filter(Boolean))];
}
async function resolvePageCollection(pageId) {
    const db = (0, firestore_1.getFirestore)();
    const pagesSnap = await db.collection(PAGES_COLLECTION).doc(pageId).get();
    if (pagesSnap.exists)
        return PAGES_COLLECTION;
    const legacySnap = await db.collection(PAGES_LEGACY_COLLECTION).doc(pageId).get();
    if (legacySnap.exists)
        return PAGES_LEGACY_COLLECTION;
    return null;
}
async function getCallerProfile(uid) {
    var _a;
    const snap = await (0, firestore_1.getFirestore)().collection(USERS_COLLECTION).doc(uid).get();
    if (!snap.exists) {
        throw new https_1.HttpsError("permission-denied", "Perfil de usuario no encontrado.");
    }
    return Object.assign({ uid }, ((_a = snap.data()) !== null && _a !== void 0 ? _a : {}));
}
function canEditPage(profile, pageId) {
    var _a;
    const role = normalizeRole(profile.role);
    if (role === "root")
        return true;
    const assigned = normalizePageIdList(profile.assignedPageIds);
    if (assigned.includes(pageId))
        return true;
    if (role === "user" && String((_a = profile.pageId) !== null && _a !== void 0 ? _a : "").trim() === pageId)
        return true;
    return false;
}
function validateInquiry(raw) {
    var _a, _b;
    const name = sanitize(raw.name, MAX_NAME);
    const projectType = sanitize(raw.projectType, MAX_PROJECT_TYPE);
    const contact = sanitize(raw.contact, MAX_CONTACT);
    const message = sanitize(raw.message, MAX_MESSAGE);
    const honeypot = String((_b = (_a = raw.website) !== null && _a !== void 0 ? _a : raw.honeypot) !== null && _b !== void 0 ? _b : "").trim();
    if (honeypot) {
        return { ok: false, spam: true };
    }
    if (!name || !projectType || !contact || !message) {
        return { ok: false, spam: false };
    }
    return {
        ok: true,
        data: { name, projectType, contact, message },
    };
}
exports.submitPageInquiry = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c, _d;
    const pageId = String((_b = (_a = request.data) === null || _a === void 0 ? void 0 : _a.pageId) !== null && _b !== void 0 ? _b : "").trim();
    if (!pageId || pageId.length > 128) {
        throw new https_1.HttpsError("invalid-argument", "pageId es obligatorio.");
    }
    const validated = validateInquiry((_c = request.data) !== null && _c !== void 0 ? _c : {});
    if (validated.spam) {
        // Silent success for bots
        return { ok: true, inquiryId: null };
    }
    if (!validated.ok) {
        throw new https_1.HttpsError("invalid-argument", "Completa nombre, tipo de proyecto, contacto y mensaje.");
    }
    const collectionName = await resolvePageCollection(pageId);
    if (!collectionName) {
        throw new https_1.HttpsError("not-found", "Página no encontrada.");
    }
    const db = (0, firestore_1.getFirestore)();
    const pageRef = db.collection(collectionName).doc(pageId);
    const pageSnap = await pageRef.get();
    const pageData = ((_d = pageSnap.data()) !== null && _d !== void 0 ? _d : {});
    if (pageData.contactFormEnabled !== true) {
        throw new https_1.HttpsError("failed-precondition", "El formulario de contacto no está activo en esta página.");
    }
    const inquiryRef = pageRef.collection("inquiries").doc();
    const createdAt = new Date().toISOString();
    const inquiry = Object.assign(Object.assign({}, validated.data), { status: "new", createdAt, source: "landing_contact_form" });
    await inquiryRef.set(inquiry);
    const recipients = await (0, cmsInbox_js_1.resolvePageNotificationRecipients)(db, pageId);
    const batch = db.batch();
    let notified = 0;
    for (const uid of recipients) {
        if (!uid || notified >= 50)
            break;
        const notifRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
        batch.set(notifRef, {
            recipientUid: uid,
            pageId,
            type: "page_inquiry",
            title: `Nueva consulta: ${validated.data.name}`,
            body: `${validated.data.projectType} — ${validated.data.contact}`.slice(0, 240),
            href: `/app?pageId=${encodeURIComponent(pageId)}&section=inquiries`,
            status: "unread",
            relatedAuditId: "",
            relatedTicketId: "",
            relatedInquiryId: inquiryRef.id,
            createdAt,
        });
        notified += 1;
    }
    if (notified > 0) {
        await batch.commit();
    }
    // Touch counter for admin badges (best-effort)
    try {
        await pageRef.set({ inquiryCount: firestore_1.FieldValue.increment(1), lastInquiryAt: createdAt }, { merge: true });
    }
    catch (_e) {
        // ignore
    }
    return { ok: true, inquiryId: inquiryRef.id };
});
exports.listPageInquiries = (0, https_1.onCall)(listCallableOptions, async (request) => {
    var _a, _b, _c, _d;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const pageId = String((_c = (_b = request.data) === null || _b === void 0 ? void 0 : _b.pageId) !== null && _c !== void 0 ? _c : "").trim();
    if (!pageId) {
        throw new https_1.HttpsError("invalid-argument", "pageId es obligatorio.");
    }
    const profile = await getCallerProfile(request.auth.uid);
    if (!canEditPage(profile, pageId)) {
        throw new https_1.HttpsError("permission-denied", "No tienes acceso a esta página.");
    }
    const collectionName = await resolvePageCollection(pageId);
    if (!collectionName) {
        throw new https_1.HttpsError("not-found", "Página no encontrada.");
    }
    const limit = Math.min(Math.max(Number((_d = request.data) === null || _d === void 0 ? void 0 : _d.limit) || 30, 1), MAX_LIST);
    const snap = await (0, firestore_1.getFirestore)()
        .collection(collectionName)
        .doc(pageId)
        .collection("inquiries")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();
    const inquiries = snap.docs.map((docSnap) => {
        var _a;
        return (Object.assign({ id: docSnap.id }, ((_a = docSnap.data()) !== null && _a !== void 0 ? _a : {})));
    });
    return { inquiries };
});
//# sourceMappingURL=pageInquiries.js.map