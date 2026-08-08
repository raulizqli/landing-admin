"use strict";
/**
 * CMS audit trail, in-app notifications, and internal tickets.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPageAuditSnapshot = exports.reportSystemIncident = exports.listCmsTickets = exports.updateCmsTicket = exports.createCmsTicket = exports.markAllNotificationsRead = exports.markNotificationRead = exports.listMyNotifications = exports.listPageAudits = exports.recordPageAudit = void 0;
exports.resolvePageNotificationRecipients = resolvePageNotificationRecipients;
exports.writePageAuditAndNotify = writePageAuditAndNotify;
exports.createSystemIncident = createSystemIncident;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const callableOptions_js_1 = require("./callableOptions.js");
const pageAudit_js_1 = require("./pageAudit.js");
Object.defineProperty(exports, "buildPageAuditSnapshot", { enumerable: true, get: function () { return pageAudit_js_1.buildPageAuditSnapshot; } });
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
const USERS_COLLECTION = "users";
const PAGES_COLLECTION = "pages";
const PAGES_LEGACY_COLLECTION = "paginas";
const BILLING_ACCOUNTS_COLLECTION = "billingAccounts";
const PAGE_AUDITS_COLLECTION = "pageAudits";
const NOTIFICATIONS_COLLECTION = "notifications";
const TICKETS_COLLECTION = "tickets";
const VALID_TICKET_CATEGORIES = new Set([
    "support",
    "deploy",
    "billing",
    "content",
    "other",
]);
const VALID_TICKET_STATUSES = new Set([
    "open",
    "in_progress",
    "resolved",
    "closed",
]);
const callableOptions = (0, callableOptions_js_1.sensitiveCallableOptions)();
function normalizePageIdList(values) {
    if (!Array.isArray(values))
        return [];
    return [...new Set(values.map((value) => String(value !== null && value !== void 0 ? value : "").trim()).filter(Boolean))];
}
function normalizeRole(role) {
    return String(role !== null && role !== void 0 ? role : "").trim().toLowerCase();
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
function canUseInbox(profile) {
    const role = normalizeRole(profile.role);
    return role === "root" || role === "admin" || String(profile.accountId || profile.uid) === profile.uid;
}
function canManageTickets(profile) {
    const role = normalizeRole(profile.role);
    return role === "root" || role === "admin";
}
async function resolvePageCollection(db, pageId) {
    const pagesSnap = await db.collection(PAGES_COLLECTION).doc(pageId).get();
    if (pagesSnap.exists)
        return PAGES_COLLECTION;
    const legacySnap = await db.collection(PAGES_LEGACY_COLLECTION).doc(pageId).get();
    if (legacySnap.exists)
        return PAGES_LEGACY_COLLECTION;
    return PAGES_COLLECTION;
}
async function readPageData(db, pageId) {
    var _a;
    const collectionName = await resolvePageCollection(db, pageId);
    const snap = await db.collection(collectionName).doc(pageId).get();
    if (!snap.exists)
        return null;
    return ((_a = snap.data()) !== null && _a !== void 0 ? _a : {});
}
/**
 * Recipients: billing account owner + admins assigned to the page.
 * Root is not auto-notified on every page save (only tickets / system incidents).
 */
async function resolvePageNotificationRecipients(db, pageId, options = {}) {
    var _a, _b, _c;
    const recipients = new Set();
    const billingQuery = await db
        .collection(BILLING_ACCOUNTS_COLLECTION)
        .where("pageIds", "array-contains", pageId)
        .limit(5)
        .get();
    for (const docSnap of billingQuery.docs) {
        const ownerUid = String((_b = (_a = docSnap.data()) === null || _a === void 0 ? void 0 : _a.ownerUid) !== null && _b !== void 0 ? _b : docSnap.id).trim();
        if (ownerUid)
            recipients.add(ownerUid);
    }
    const adminsSnap = await db.collection(USERS_COLLECTION).where("role", "==", "admin").get();
    for (const userDoc of adminsSnap.docs) {
        const data = (_c = userDoc.data()) !== null && _c !== void 0 ? _c : {};
        const assigned = normalizePageIdList(data.assignedPageIds);
        if (assigned.includes(pageId)) {
            recipients.add(userDoc.id);
        }
    }
    if (options.includeRoot) {
        const rootsSnap = await db.collection(USERS_COLLECTION).where("role", "==", "root").get();
        for (const userDoc of rootsSnap.docs) {
            recipients.add(userDoc.id);
        }
    }
    return [...recipients];
}
async function createNotifications(db, input) {
    const batch = db.batch();
    let count = 0;
    const createdAt = new Date().toISOString();
    for (const uid of input.recipientUids) {
        if (!uid || uid === input.excludeUid)
            continue;
        const ref = db.collection(NOTIFICATIONS_COLLECTION).doc();
        batch.set(ref, {
            recipientUid: uid,
            pageId: input.pageId || "",
            type: input.type,
            title: input.title,
            body: input.body,
            href: input.href || "",
            status: "unread",
            relatedAuditId: input.relatedAuditId || "",
            relatedTicketId: input.relatedTicketId || "",
            createdAt,
        });
        count += 1;
        if (count >= 400)
            break;
    }
    if (count > 0) {
        await batch.commit();
    }
    return count;
}
async function writePageAuditAndNotify(input) {
    var _a, _b;
    const db = (0, firestore_1.getFirestore)();
    const action = String((_a = input.action) !== null && _a !== void 0 ? _a : "page_update").trim() || "page_update";
    const { before, after, changedKeys } = (0, pageAudit_js_1.diffPageAuditSnapshots)(input.before, input.after);
    if (changedKeys.length === 0 && action === "page_update") {
        return { auditId: null, changedKeys: [], notified: 0 };
    }
    const auditRef = db.collection(PAGE_AUDITS_COLLECTION).doc();
    const createdAt = new Date().toISOString();
    await auditRef.set({
        pageId: input.pageId,
        actorUid: input.actor.uid,
        actorEmail: String((_b = input.actor.email) !== null && _b !== void 0 ? _b : "").trim(),
        actorRole: normalizeRole(input.actor.role),
        action,
        before,
        after,
        changedKeys,
        createdAt,
    });
    let notified = 0;
    if (input.notify !== false) {
        const recipients = await resolvePageNotificationRecipients(db, input.pageId);
        const actorLabel = String(input.actor.displayName || input.actor.email || input.actor.uid).trim();
        notified = await createNotifications(db, {
            recipientUids: recipients,
            pageId: input.pageId,
            type: "page_updated",
            title: `Página actualizada: ${input.pageId}`,
            body: changedKeys.length
                ? `${actorLabel} cambió: ${changedKeys.slice(0, 8).join(", ")}${changedKeys.length > 8 ? "…" : ""}`
                : `${actorLabel} guardó la página.`,
            href: `/app?pageId=${encodeURIComponent(input.pageId)}`,
            relatedAuditId: auditRef.id,
            excludeUid: input.actor.uid,
        });
    }
    return { auditId: auditRef.id, changedKeys, notified };
}
/**
 * After client save: CF reads authoritative after-state, diffs with client before snapshot.
 */
exports.recordPageAudit = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const pageId = String((_c = (_b = request.data) === null || _b === void 0 ? void 0 : _b.pageId) !== null && _c !== void 0 ? _c : "").trim();
    if (!pageId) {
        throw new https_1.HttpsError("invalid-argument", "pageId es obligatorio.");
    }
    const actor = await getCallerProfile(request.auth.uid);
    if (!canEditPage(actor, pageId)) {
        throw new https_1.HttpsError("permission-denied", "No puedes auditar esta página.");
    }
    const db = (0, firestore_1.getFirestore)();
    const afterRaw = await readPageData(db, pageId);
    if (!afterRaw) {
        throw new https_1.HttpsError("not-found", "La página no existe.");
    }
    const beforeRaw = (((_d = request.data) === null || _d === void 0 ? void 0 : _d.before) && typeof request.data.before === "object")
        ? request.data.before
        : {};
    const result = await writePageAuditAndNotify({
        pageId,
        actor: Object.assign(Object.assign({}, actor), { email: request.auth.token.email || actor.email }),
        before: beforeRaw,
        after: afterRaw,
        action: String((_f = (_e = request.data) === null || _e === void 0 ? void 0 : _e.action) !== null && _f !== void 0 ? _f : "page_update"),
        notify: ((_g = request.data) === null || _g === void 0 ? void 0 : _g.notify) !== false,
    });
    return result;
});
exports.listPageAudits = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c, _d;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const pageId = String((_c = (_b = request.data) === null || _b === void 0 ? void 0 : _b.pageId) !== null && _c !== void 0 ? _c : "").trim();
    if (!pageId) {
        throw new https_1.HttpsError("invalid-argument", "pageId es obligatorio.");
    }
    const actor = await getCallerProfile(request.auth.uid);
    if (!canEditPage(actor, pageId)) {
        throw new https_1.HttpsError("permission-denied", "No puedes ver el historial de esta página.");
    }
    const limit = Math.min(Math.max(Number((_d = request.data) === null || _d === void 0 ? void 0 : _d.limit) || 30, 1), 50);
    const snap = await (0, firestore_1.getFirestore)()
        .collection(PAGE_AUDITS_COLLECTION)
        .where("pageId", "==", pageId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();
    return {
        audits: snap.docs.map((docSnap) => (Object.assign({ id: docSnap.id }, docSnap.data()))),
    };
});
exports.listMyNotifications = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c, _d;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const actor = await getCallerProfile(request.auth.uid);
    if (!canUseInbox(actor) && normalizeRole(actor.role) !== "user") {
        // Regular users may still receive nothing; allow empty list.
    }
    const limit = Math.min(Math.max(Number((_b = request.data) === null || _b === void 0 ? void 0 : _b.limit) || 40, 1), 100);
    const status = String((_d = (_c = request.data) === null || _c === void 0 ? void 0 : _c.status) !== null && _d !== void 0 ? _d : "").trim().toLowerCase();
    let query = (0, firestore_1.getFirestore)()
        .collection(NOTIFICATIONS_COLLECTION)
        .where("recipientUid", "==", request.auth.uid)
        .orderBy("createdAt", "desc")
        .limit(limit);
    if (status === "unread" || status === "read") {
        query = (0, firestore_1.getFirestore)()
            .collection(NOTIFICATIONS_COLLECTION)
            .where("recipientUid", "==", request.auth.uid)
            .where("status", "==", status)
            .orderBy("createdAt", "desc")
            .limit(limit);
    }
    const snap = await query.get();
    const notifications = snap.docs.map((docSnap) => {
        const data = docSnap.data();
        return Object.assign({ id: docSnap.id, status: data.status }, data);
    });
    const unreadCount = notifications.filter((item) => item.status === "unread").length;
    return { notifications, unreadCount };
});
exports.markNotificationRead = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c, _d;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const notificationId = String((_c = (_b = request.data) === null || _b === void 0 ? void 0 : _b.notificationId) !== null && _c !== void 0 ? _c : "").trim();
    if (!notificationId) {
        throw new https_1.HttpsError("invalid-argument", "notificationId es obligatorio.");
    }
    const ref = (0, firestore_1.getFirestore)().collection(NOTIFICATIONS_COLLECTION).doc(notificationId);
    const snap = await ref.get();
    if (!snap.exists) {
        throw new https_1.HttpsError("not-found", "Notificación no encontrada.");
    }
    const data = (_d = snap.data()) !== null && _d !== void 0 ? _d : {};
    const actor = await getCallerProfile(request.auth.uid);
    if (data.recipientUid !== request.auth.uid && normalizeRole(actor.role) !== "root") {
        throw new https_1.HttpsError("permission-denied", "No puedes modificar esta notificación.");
    }
    await ref.update({
        status: "read",
        readAt: new Date().toISOString(),
    });
    return { ok: true };
});
exports.markAllNotificationsRead = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const snap = await (0, firestore_1.getFirestore)()
        .collection(NOTIFICATIONS_COLLECTION)
        .where("recipientUid", "==", request.auth.uid)
        .where("status", "==", "unread")
        .limit(200)
        .get();
    if (snap.empty)
        return { updated: 0 };
    const batch = (0, firestore_1.getFirestore)().batch();
    const readAt = new Date().toISOString();
    snap.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, { status: "read", readAt });
    });
    await batch.commit();
    return { updated: snap.size };
});
exports.createCmsTicket = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const actor = await getCallerProfile(request.auth.uid);
    if (!canManageTickets(actor)) {
        throw new https_1.HttpsError("permission-denied", "Solo root o admin pueden crear tickets.");
    }
    const pageId = String((_c = (_b = request.data) === null || _b === void 0 ? void 0 : _b.pageId) !== null && _c !== void 0 ? _c : "").trim();
    if (!pageId) {
        throw new https_1.HttpsError("invalid-argument", "pageId es obligatorio.");
    }
    if (!canEditPage(actor, pageId) && normalizeRole(actor.role) !== "root") {
        throw new https_1.HttpsError("permission-denied", "No tienes acceso a esa página.");
    }
    const category = String((_e = (_d = request.data) === null || _d === void 0 ? void 0 : _d.category) !== null && _e !== void 0 ? _e : "support").trim().toLowerCase();
    if (!VALID_TICKET_CATEGORIES.has(category)) {
        throw new https_1.HttpsError("invalid-argument", "Categoría de ticket inválida.");
    }
    const subject = String((_g = (_f = request.data) === null || _f === void 0 ? void 0 : _f.subject) !== null && _g !== void 0 ? _g : "").trim();
    const body = String((_j = (_h = request.data) === null || _h === void 0 ? void 0 : _h.body) !== null && _j !== void 0 ? _j : "").trim();
    if (!subject) {
        throw new https_1.HttpsError("invalid-argument", "El asunto es obligatorio.");
    }
    const db = (0, firestore_1.getFirestore)();
    const page = await readPageData(db, pageId);
    if (!page) {
        throw new https_1.HttpsError("not-found", "La página no existe.");
    }
    let accountId = "";
    const billingQuery = await db
        .collection(BILLING_ACCOUNTS_COLLECTION)
        .where("pageIds", "array-contains", pageId)
        .limit(1)
        .get();
    if (!billingQuery.empty) {
        accountId = billingQuery.docs[0].id;
    }
    const now = new Date().toISOString();
    const ticketRef = db.collection(TICKETS_COLLECTION).doc();
    const ticket = {
        pageId,
        accountId,
        createdByUid: actor.uid,
        assigneeUid: String((_l = (_k = request.data) === null || _k === void 0 ? void 0 : _k.assigneeUid) !== null && _l !== void 0 ? _l : "").trim(),
        source: "cms",
        category,
        status: "open",
        subject,
        body,
        createdAt: now,
        updatedAt: now,
    };
    await ticketRef.set(ticket);
    const recipients = await resolvePageNotificationRecipients(db, pageId, {
        includeRoot: category === "billing" || category === "deploy",
    });
    await createNotifications(db, {
        recipientUids: recipients,
        pageId,
        type: "ticket_created",
        title: `Ticket: ${subject}`,
        body: body.slice(0, 240) || `Nuevo ticket (${category}) en ${pageId}`,
        href: `/app/tickets?ticketId=${encodeURIComponent(ticketRef.id)}`,
        relatedTicketId: ticketRef.id,
        excludeUid: actor.uid,
    });
    return { ticketId: ticketRef.id, ticket: Object.assign({ id: ticketRef.id }, ticket) };
});
exports.updateCmsTicket = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const actor = await getCallerProfile(request.auth.uid);
    if (!canManageTickets(actor)) {
        throw new https_1.HttpsError("permission-denied", "Solo root o admin pueden actualizar tickets.");
    }
    const ticketId = String((_c = (_b = request.data) === null || _b === void 0 ? void 0 : _b.ticketId) !== null && _c !== void 0 ? _c : "").trim();
    if (!ticketId) {
        throw new https_1.HttpsError("invalid-argument", "ticketId es obligatorio.");
    }
    const db = (0, firestore_1.getFirestore)();
    const ref = db.collection(TICKETS_COLLECTION).doc(ticketId);
    const snap = await ref.get();
    if (!snap.exists) {
        throw new https_1.HttpsError("not-found", "Ticket no encontrado.");
    }
    const current = (_d = snap.data()) !== null && _d !== void 0 ? _d : {};
    const pageId = String((_e = current.pageId) !== null && _e !== void 0 ? _e : "").trim();
    if (pageId && !canEditPage(actor, pageId) && normalizeRole(actor.role) !== "root") {
        throw new https_1.HttpsError("permission-denied", "No tienes acceso a este ticket.");
    }
    const patch = {
        updatedAt: new Date().toISOString(),
    };
    if (((_f = request.data) === null || _f === void 0 ? void 0 : _f.status) !== undefined) {
        const status = String(request.data.status).trim().toLowerCase();
        if (!VALID_TICKET_STATUSES.has(status)) {
            throw new https_1.HttpsError("invalid-argument", "Estado de ticket inválido.");
        }
        patch.status = status;
    }
    if (((_g = request.data) === null || _g === void 0 ? void 0 : _g.subject) !== undefined) {
        patch.subject = String(request.data.subject).trim();
    }
    if (((_h = request.data) === null || _h === void 0 ? void 0 : _h.body) !== undefined) {
        patch.body = String(request.data.body).trim();
    }
    if (((_j = request.data) === null || _j === void 0 ? void 0 : _j.assigneeUid) !== undefined) {
        patch.assigneeUid = String(request.data.assigneeUid).trim();
    }
    if (((_k = request.data) === null || _k === void 0 ? void 0 : _k.category) !== undefined) {
        const category = String(request.data.category).trim().toLowerCase();
        if (!VALID_TICKET_CATEGORIES.has(category)) {
            throw new https_1.HttpsError("invalid-argument", "Categoría de ticket inválida.");
        }
        patch.category = category;
    }
    await ref.update(patch);
    const updated = Object.assign(Object.assign({}, current), patch);
    if (patch.status) {
        const recipients = await resolvePageNotificationRecipients(db, pageId, {
            includeRoot: true,
        });
        await createNotifications(db, {
            recipientUids: recipients,
            pageId,
            type: "ticket_updated",
            title: `Ticket ${String(patch.status)}: ${String(updated.subject || ticketId)}`,
            body: `Estado actualizado a ${String(patch.status)}`,
            href: `/app/tickets?ticketId=${encodeURIComponent(ticketId)}`,
            relatedTicketId: ticketId,
            excludeUid: actor.uid,
        });
    }
    return { ticketId, ticket: Object.assign({ id: ticketId }, updated) };
});
exports.listCmsTickets = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c, _d, _e, _f;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const actor = await getCallerProfile(request.auth.uid);
    if (!canManageTickets(actor)) {
        throw new https_1.HttpsError("permission-denied", "Solo root o admin pueden listar tickets.");
    }
    const limit = Math.min(Math.max(Number((_b = request.data) === null || _b === void 0 ? void 0 : _b.limit) || 50, 1), 100);
    const pageId = String((_d = (_c = request.data) === null || _c === void 0 ? void 0 : _c.pageId) !== null && _d !== void 0 ? _d : "").trim();
    const status = String((_f = (_e = request.data) === null || _e === void 0 ? void 0 : _e.status) !== null && _f !== void 0 ? _f : "").trim().toLowerCase();
    const db = (0, firestore_1.getFirestore)();
    let snap;
    if (pageId && status && VALID_TICKET_STATUSES.has(status)) {
        snap = await db
            .collection(TICKETS_COLLECTION)
            .where("pageId", "==", pageId)
            .where("status", "==", status)
            .orderBy("updatedAt", "desc")
            .limit(limit)
            .get();
    }
    else if (pageId) {
        snap = await db
            .collection(TICKETS_COLLECTION)
            .where("pageId", "==", pageId)
            .orderBy("updatedAt", "desc")
            .limit(limit)
            .get();
    }
    else if (status && VALID_TICKET_STATUSES.has(status)) {
        snap = await db
            .collection(TICKETS_COLLECTION)
            .where("status", "==", status)
            .orderBy("updatedAt", "desc")
            .limit(limit)
            .get();
    }
    else if (normalizeRole(actor.role) === "root") {
        snap = await db
            .collection(TICKETS_COLLECTION)
            .orderBy("updatedAt", "desc")
            .limit(limit)
            .get();
    }
    else {
        const assigned = normalizePageIdList(actor.assignedPageIds);
        if (!assigned.length) {
            return { tickets: [] };
        }
        // Admin: filter in memory for assigned pages (array-contains-any max 10).
        const chunk = assigned.slice(0, 10);
        snap = await db
            .collection(TICKETS_COLLECTION)
            .where("pageId", "in", chunk)
            .orderBy("updatedAt", "desc")
            .limit(limit)
            .get();
    }
    let tickets = snap.docs.map((docSnap) => {
        const data = docSnap.data();
        return Object.assign({ id: docSnap.id, pageId: data.pageId }, data);
    });
    if (normalizeRole(actor.role) === "admin") {
        const assigned = new Set(normalizePageIdList(actor.assignedPageIds));
        tickets = tickets.filter((ticket) => { var _a; return assigned.has(String((_a = ticket.pageId) !== null && _a !== void 0 ? _a : "")); });
    }
    return { tickets };
});
/**
 * System / automated incidents (deploy failure, billing, etc.).
 * Callable for authenticated staff or internal CF callers via shared helper.
 */
exports.reportSystemIncident = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const actor = await getCallerProfile(request.auth.uid);
    if (!canManageTickets(actor)) {
        throw new https_1.HttpsError("permission-denied", "Solo root o admin pueden reportar incidencias.");
    }
    const pageId = String((_c = (_b = request.data) === null || _b === void 0 ? void 0 : _b.pageId) !== null && _c !== void 0 ? _c : "").trim();
    const category = String((_e = (_d = request.data) === null || _d === void 0 ? void 0 : _d.category) !== null && _e !== void 0 ? _e : "other").trim().toLowerCase();
    const subject = String((_g = (_f = request.data) === null || _f === void 0 ? void 0 : _f.subject) !== null && _g !== void 0 ? _g : "").trim();
    const body = String((_j = (_h = request.data) === null || _h === void 0 ? void 0 : _h.body) !== null && _j !== void 0 ? _j : "").trim();
    if (!pageId || !subject) {
        throw new https_1.HttpsError("invalid-argument", "pageId y subject son obligatorios.");
    }
    if (!VALID_TICKET_CATEGORIES.has(category)) {
        throw new https_1.HttpsError("invalid-argument", "Categoría inválida.");
    }
    return createSystemIncident({
        pageId,
        category,
        subject,
        body,
        createdByUid: actor.uid,
        createTicket: ((_k = request.data) === null || _k === void 0 ? void 0 : _k.createTicket) !== false,
    });
});
async function createSystemIncident(input) {
    var _a, _b;
    const db = (0, firestore_1.getFirestore)();
    const pageId = String(input.pageId).trim();
    const now = new Date().toISOString();
    let ticketId = "";
    if (input.createTicket !== false) {
        let accountId = "";
        const billingQuery = await db
            .collection(BILLING_ACCOUNTS_COLLECTION)
            .where("pageIds", "array-contains", pageId)
            .limit(1)
            .get();
        if (!billingQuery.empty) {
            accountId = billingQuery.docs[0].id;
        }
        const ticketRef = db.collection(TICKETS_COLLECTION).doc();
        await ticketRef.set({
            pageId,
            accountId,
            createdByUid: input.createdByUid || "system",
            assigneeUid: "",
            source: "cms",
            category: input.category,
            status: "open",
            subject: input.subject,
            body: String((_a = input.body) !== null && _a !== void 0 ? _a : "").trim(),
            createdAt: now,
            updatedAt: now,
            autoGenerated: true,
        });
        ticketId = ticketRef.id;
    }
    const recipients = await resolvePageNotificationRecipients(db, pageId, {
        includeRoot: true,
    });
    await createNotifications(db, {
        recipientUids: recipients,
        pageId,
        type: "system_incident",
        title: input.subject,
        body: String((_b = input.body) !== null && _b !== void 0 ? _b : "").slice(0, 280),
        href: ticketId
            ? `/app/tickets?ticketId=${encodeURIComponent(ticketId)}`
            : `/app?pageId=${encodeURIComponent(pageId)}`,
        relatedTicketId: ticketId,
    });
    return { ticketId: ticketId || null, notified: recipients.length };
}
//# sourceMappingURL=cmsInbox.js.map