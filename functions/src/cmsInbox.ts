/**
 * CMS audit trail, in-app notifications, and internal tickets.
 */

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { sensitiveCallableOptions } from "./callableOptions.js";
import {
  buildPageAuditSnapshot,
  diffPageAuditSnapshots,
} from "./pageAudit.js";

if (getApps().length === 0) {
  initializeApp();
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

type CallerProfile = {
  uid: string;
  email?: string;
  role?: string;
  accountId?: string;
  pageId?: string;
  assignedPageIds?: unknown;
  displayName?: string;
};

type RecordPageAuditPayload = {
  pageId?: string;
  before?: Record<string, unknown>;
  action?: string;
  notify?: boolean;
};

type ListPageAuditsPayload = {
  pageId?: string;
  limit?: number;
};

type MarkNotificationPayload = {
  notificationId?: string;
};

type CreateTicketPayload = {
  pageId?: string;
  category?: string;
  subject?: string;
  body?: string;
  assigneeUid?: string;
};

type UpdateTicketPayload = {
  ticketId?: string;
  status?: string;
  subject?: string;
  body?: string;
  assigneeUid?: string;
  category?: string;
};

type ListTicketsPayload = {
  pageId?: string;
  status?: string;
  limit?: number;
};

type ReportSystemIncidentPayload = {
  pageId?: string;
  category?: string;
  subject?: string;
  body?: string;
  createTicket?: boolean;
};

const callableOptions = sensitiveCallableOptions();

function normalizePageIdList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function normalizeRole(role: unknown): string {
  return String(role ?? "").trim().toLowerCase();
}

async function getCallerProfile(uid: string): Promise<CallerProfile> {
  const snap = await getFirestore().collection(USERS_COLLECTION).doc(uid).get();
  if (!snap.exists) {
    throw new HttpsError("permission-denied", "Perfil de usuario no encontrado.");
  }
  return { uid, ...(snap.data() ?? {}) } as CallerProfile;
}

function canEditPage(profile: CallerProfile, pageId: string): boolean {
  const role = normalizeRole(profile.role);
  if (role === "root") return true;
  const assigned = normalizePageIdList(profile.assignedPageIds);
  if (assigned.includes(pageId)) return true;
  if (role === "user" && String(profile.pageId ?? "").trim() === pageId) return true;
  return false;
}

function canUseInbox(profile: CallerProfile): boolean {
  const role = normalizeRole(profile.role);
  return role === "root" || role === "admin" || String(profile.accountId || profile.uid) === profile.uid;
}

function canManageTickets(profile: CallerProfile): boolean {
  const role = normalizeRole(profile.role);
  return role === "root" || role === "admin";
}

async function resolvePageCollection(db: Firestore, pageId: string): Promise<string> {
  const pagesSnap = await db.collection(PAGES_COLLECTION).doc(pageId).get();
  if (pagesSnap.exists) return PAGES_COLLECTION;
  const legacySnap = await db.collection(PAGES_LEGACY_COLLECTION).doc(pageId).get();
  if (legacySnap.exists) return PAGES_LEGACY_COLLECTION;
  return PAGES_COLLECTION;
}

async function readPageData(db: Firestore, pageId: string): Promise<Record<string, unknown> | null> {
  const collectionName = await resolvePageCollection(db, pageId);
  const snap = await db.collection(collectionName).doc(pageId).get();
  if (!snap.exists) return null;
  return (snap.data() ?? {}) as Record<string, unknown>;
}

/**
 * Recipients: billing account owner + admins assigned to the page.
 * Root is not auto-notified on every page save (only tickets / system incidents).
 */
export async function resolvePageNotificationRecipients(
  db: Firestore,
  pageId: string,
  options: { includeRoot?: boolean } = {},
): Promise<string[]> {
  const recipients = new Set<string>();

  const billingQuery = await db
    .collection(BILLING_ACCOUNTS_COLLECTION)
    .where("pageIds", "array-contains", pageId)
    .limit(5)
    .get();

  for (const docSnap of billingQuery.docs) {
    const ownerUid = String(docSnap.data()?.ownerUid ?? docSnap.id).trim();
    if (ownerUid) recipients.add(ownerUid);
  }

  const adminsSnap = await db.collection(USERS_COLLECTION).where("role", "==", "admin").get();
  for (const userDoc of adminsSnap.docs) {
    const data = userDoc.data() ?? {};
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

async function createNotifications(
  db: Firestore,
  input: {
    recipientUids: string[];
    pageId?: string;
    type: string;
    title: string;
    body: string;
    href?: string;
    relatedAuditId?: string;
    relatedTicketId?: string;
    excludeUid?: string;
  },
) {
  const batch = db.batch();
  let count = 0;
  const createdAt = new Date().toISOString();

  for (const uid of input.recipientUids) {
    if (!uid || uid === input.excludeUid) continue;
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
    if (count >= 400) break;
  }

  if (count > 0) {
    await batch.commit();
  }
  return count;
}

export async function writePageAuditAndNotify(input: {
  pageId: string;
  actor: CallerProfile;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  action?: string;
  notify?: boolean;
}) {
  const db = getFirestore();
  const action = String(input.action ?? "page_update").trim() || "page_update";
  const { before, after, changedKeys } = diffPageAuditSnapshots(input.before, input.after);

  if (changedKeys.length === 0 && action === "page_update") {
    return { auditId: null, changedKeys: [], notified: 0 };
  }

  const auditRef = db.collection(PAGE_AUDITS_COLLECTION).doc();
  const createdAt = new Date().toISOString();
  await auditRef.set({
    pageId: input.pageId,
    actorUid: input.actor.uid,
    actorEmail: String(input.actor.email ?? "").trim(),
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
export const recordPageAudit = onCall(
  callableOptions,
  async (request: CallableRequest<RecordPageAuditPayload>) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }

    const pageId = String(request.data?.pageId ?? "").trim();
    if (!pageId) {
      throw new HttpsError("invalid-argument", "pageId es obligatorio.");
    }

    const actor = await getCallerProfile(request.auth.uid);
    if (!canEditPage(actor, pageId)) {
      throw new HttpsError("permission-denied", "No puedes auditar esta página.");
    }

    const db = getFirestore();
    const afterRaw = await readPageData(db, pageId);
    if (!afterRaw) {
      throw new HttpsError("not-found", "La página no existe.");
    }

    const beforeRaw = (request.data?.before && typeof request.data.before === "object")
      ? request.data.before
      : {};

    const result = await writePageAuditAndNotify({
      pageId,
      actor: {
        ...actor,
        email: request.auth.token.email || actor.email,
      },
      before: beforeRaw,
      after: afterRaw,
      action: String(request.data?.action ?? "page_update"),
      notify: request.data?.notify !== false,
    });

    return result;
  },
);

export const listPageAudits = onCall(
  callableOptions,
  async (request: CallableRequest<ListPageAuditsPayload>) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }

    const pageId = String(request.data?.pageId ?? "").trim();
    if (!pageId) {
      throw new HttpsError("invalid-argument", "pageId es obligatorio.");
    }

    const actor = await getCallerProfile(request.auth.uid);
    if (!canEditPage(actor, pageId)) {
      throw new HttpsError("permission-denied", "No puedes ver el historial de esta página.");
    }

    const limit = Math.min(Math.max(Number(request.data?.limit) || 30, 1), 50);
    const snap = await getFirestore()
      .collection(PAGE_AUDITS_COLLECTION)
      .where("pageId", "==", pageId)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return {
      audits: snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })),
    };
  },
);

export const listMyNotifications = onCall(
  callableOptions,
  async (request: CallableRequest<{ limit?: number; status?: string }>) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }

    const actor = await getCallerProfile(request.auth.uid);
    if (!canUseInbox(actor) && normalizeRole(actor.role) !== "user") {
      // Regular users may still receive nothing; allow empty list.
    }

    const limit = Math.min(Math.max(Number(request.data?.limit) || 40, 1), 100);
    const status = String(request.data?.status ?? "").trim().toLowerCase();

    let query = getFirestore()
      .collection(NOTIFICATIONS_COLLECTION)
      .where("recipientUid", "==", request.auth.uid)
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (status === "unread" || status === "read") {
      query = getFirestore()
        .collection(NOTIFICATIONS_COLLECTION)
        .where("recipientUid", "==", request.auth.uid)
        .where("status", "==", status)
        .orderBy("createdAt", "desc")
        .limit(limit);
    }

    const snap = await query.get();
    const notifications = snap.docs.map((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      return { id: docSnap.id, status: data.status, ...data };
    });
    const unreadCount = notifications.filter((item) => item.status === "unread").length;

    return { notifications, unreadCount };
  },
);

export const markNotificationRead = onCall(
  callableOptions,
  async (request: CallableRequest<MarkNotificationPayload>) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }

    const notificationId = String(request.data?.notificationId ?? "").trim();
    if (!notificationId) {
      throw new HttpsError("invalid-argument", "notificationId es obligatorio.");
    }

    const ref = getFirestore().collection(NOTIFICATIONS_COLLECTION).doc(notificationId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Notificación no encontrada.");
    }

    const data = snap.data() ?? {};
    const actor = await getCallerProfile(request.auth.uid);
    if (data.recipientUid !== request.auth.uid && normalizeRole(actor.role) !== "root") {
      throw new HttpsError("permission-denied", "No puedes modificar esta notificación.");
    }

    await ref.update({
      status: "read",
      readAt: new Date().toISOString(),
    });

    return { ok: true };
  },
);

export const markAllNotificationsRead = onCall(
  callableOptions,
  async (request: CallableRequest) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }

    const snap = await getFirestore()
      .collection(NOTIFICATIONS_COLLECTION)
      .where("recipientUid", "==", request.auth.uid)
      .where("status", "==", "unread")
      .limit(200)
      .get();

    if (snap.empty) return { updated: 0 };

    const batch = getFirestore().batch();
    const readAt = new Date().toISOString();
    snap.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, { status: "read", readAt });
    });
    await batch.commit();
    return { updated: snap.size };
  },
);

export const createCmsTicket = onCall(
  callableOptions,
  async (request: CallableRequest<CreateTicketPayload>) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }

    const actor = await getCallerProfile(request.auth.uid);
    if (!canManageTickets(actor)) {
      throw new HttpsError("permission-denied", "Solo root o admin pueden crear tickets.");
    }

    const pageId = String(request.data?.pageId ?? "").trim();
    if (!pageId) {
      throw new HttpsError("invalid-argument", "pageId es obligatorio.");
    }
    if (!canEditPage(actor, pageId) && normalizeRole(actor.role) !== "root") {
      throw new HttpsError("permission-denied", "No tienes acceso a esa página.");
    }

    const category = String(request.data?.category ?? "support").trim().toLowerCase();
    if (!VALID_TICKET_CATEGORIES.has(category)) {
      throw new HttpsError("invalid-argument", "Categoría de ticket inválida.");
    }

    const subject = String(request.data?.subject ?? "").trim();
    const body = String(request.data?.body ?? "").trim();
    if (!subject) {
      throw new HttpsError("invalid-argument", "El asunto es obligatorio.");
    }

    const db = getFirestore();
    const page = await readPageData(db, pageId);
    if (!page) {
      throw new HttpsError("not-found", "La página no existe.");
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
      assigneeUid: String(request.data?.assigneeUid ?? "").trim(),
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

    return { ticketId: ticketRef.id, ticket: { id: ticketRef.id, ...ticket } };
  },
);

export const updateCmsTicket = onCall(
  callableOptions,
  async (request: CallableRequest<UpdateTicketPayload>) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }

    const actor = await getCallerProfile(request.auth.uid);
    if (!canManageTickets(actor)) {
      throw new HttpsError("permission-denied", "Solo root o admin pueden actualizar tickets.");
    }

    const ticketId = String(request.data?.ticketId ?? "").trim();
    if (!ticketId) {
      throw new HttpsError("invalid-argument", "ticketId es obligatorio.");
    }

    const db = getFirestore();
    const ref = db.collection(TICKETS_COLLECTION).doc(ticketId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Ticket no encontrado.");
    }

    const current = snap.data() ?? {};
    const pageId = String(current.pageId ?? "").trim();
    if (pageId && !canEditPage(actor, pageId) && normalizeRole(actor.role) !== "root") {
      throw new HttpsError("permission-denied", "No tienes acceso a este ticket.");
    }

    const patch: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (request.data?.status !== undefined) {
      const status = String(request.data.status).trim().toLowerCase();
      if (!VALID_TICKET_STATUSES.has(status)) {
        throw new HttpsError("invalid-argument", "Estado de ticket inválido.");
      }
      patch.status = status;
    }
    if (request.data?.subject !== undefined) {
      patch.subject = String(request.data.subject).trim();
    }
    if (request.data?.body !== undefined) {
      patch.body = String(request.data.body).trim();
    }
    if (request.data?.assigneeUid !== undefined) {
      patch.assigneeUid = String(request.data.assigneeUid).trim();
    }
    if (request.data?.category !== undefined) {
      const category = String(request.data.category).trim().toLowerCase();
      if (!VALID_TICKET_CATEGORIES.has(category)) {
        throw new HttpsError("invalid-argument", "Categoría de ticket inválida.");
      }
      patch.category = category;
    }

    await ref.update(patch);
    const updated = { ...current, ...patch };

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

    return { ticketId, ticket: { id: ticketId, ...updated } };
  },
);

export const listCmsTickets = onCall(
  callableOptions,
  async (request: CallableRequest<ListTicketsPayload>) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }

    const actor = await getCallerProfile(request.auth.uid);
    if (!canManageTickets(actor)) {
      throw new HttpsError("permission-denied", "Solo root o admin pueden listar tickets.");
    }

    const limit = Math.min(Math.max(Number(request.data?.limit) || 50, 1), 100);
    const pageId = String(request.data?.pageId ?? "").trim();
    const status = String(request.data?.status ?? "").trim().toLowerCase();
    const db = getFirestore();

    let snap;
    if (pageId && status && VALID_TICKET_STATUSES.has(status)) {
      snap = await db
        .collection(TICKETS_COLLECTION)
        .where("pageId", "==", pageId)
        .where("status", "==", status)
        .orderBy("updatedAt", "desc")
        .limit(limit)
        .get();
    } else if (pageId) {
      snap = await db
        .collection(TICKETS_COLLECTION)
        .where("pageId", "==", pageId)
        .orderBy("updatedAt", "desc")
        .limit(limit)
        .get();
    } else if (status && VALID_TICKET_STATUSES.has(status)) {
      snap = await db
        .collection(TICKETS_COLLECTION)
        .where("status", "==", status)
        .orderBy("updatedAt", "desc")
        .limit(limit)
        .get();
    } else if (normalizeRole(actor.role) === "root") {
      snap = await db
        .collection(TICKETS_COLLECTION)
        .orderBy("updatedAt", "desc")
        .limit(limit)
        .get();
    } else {
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
      const data = docSnap.data() as Record<string, unknown>;
      return { id: docSnap.id, pageId: data.pageId, ...data };
    });
    if (normalizeRole(actor.role) === "admin") {
      const assigned = new Set(normalizePageIdList(actor.assignedPageIds));
      tickets = tickets.filter((ticket) => assigned.has(String(ticket.pageId ?? "")));
    }

    return { tickets };
  },
);

/**
 * System / automated incidents (deploy failure, billing, etc.).
 * Callable for authenticated staff or internal CF callers via shared helper.
 */
export const reportSystemIncident = onCall(
  callableOptions,
  async (request: CallableRequest<ReportSystemIncidentPayload>) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }

    const actor = await getCallerProfile(request.auth.uid);
    if (!canManageTickets(actor)) {
      throw new HttpsError("permission-denied", "Solo root o admin pueden reportar incidencias.");
    }

    const pageId = String(request.data?.pageId ?? "").trim();
    const category = String(request.data?.category ?? "other").trim().toLowerCase();
    const subject = String(request.data?.subject ?? "").trim();
    const body = String(request.data?.body ?? "").trim();

    if (!pageId || !subject) {
      throw new HttpsError("invalid-argument", "pageId y subject son obligatorios.");
    }
    if (!VALID_TICKET_CATEGORIES.has(category)) {
      throw new HttpsError("invalid-argument", "Categoría inválida.");
    }

    return createSystemIncident({
      pageId,
      category,
      subject,
      body,
      createdByUid: actor.uid,
      createTicket: request.data?.createTicket !== false,
    });
  },
);

export async function createSystemIncident(input: {
  pageId: string;
  category: string;
  subject: string;
  body?: string;
  createdByUid?: string;
  createTicket?: boolean;
}) {
  const db = getFirestore();
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
      body: String(input.body ?? "").trim(),
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
    body: String(input.body ?? "").slice(0, 280),
    href: ticketId
      ? `/app/tickets?ticketId=${encodeURIComponent(ticketId)}`
      : `/app?pageId=${encodeURIComponent(pageId)}`,
    relatedTicketId: ticketId,
  });

  return { ticketId: ticketId || null, notified: recipients.length };
}

/** Re-export snapshot helper for other CF modules. */
export { buildPageAuditSnapshot };
