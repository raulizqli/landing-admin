/**
 * Public landing inquiry submissions (quote / session requests).
 * Writes under pages/{pageId}/inquiries via Admin SDK only.
 */

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { sensitiveCallableOptions } from "./callableOptions.js";
import { resolvePageNotificationRecipients } from "./cmsInbox.js";

if (getApps().length === 0) {
  initializeApp();
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

const callableOptions = sensitiveCallableOptions({ enforceAppCheck: false });
const listCallableOptions = sensitiveCallableOptions();

type SubmitInquiryPayload = {
  pageId?: string;
  name?: string;
  projectType?: string;
  contact?: string;
  message?: string;
  website?: string;
  honeypot?: string;
};

type ListInquiriesPayload = {
  pageId?: string;
  limit?: number;
};

function sanitize(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeRole(role: unknown): string {
  return String(role ?? "").trim().toLowerCase();
}

function normalizePageIdList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

async function resolvePageCollection(pageId: string): Promise<string | null> {
  const db = getFirestore();
  const pagesSnap = await db.collection(PAGES_COLLECTION).doc(pageId).get();
  if (pagesSnap.exists) return PAGES_COLLECTION;
  const legacySnap = await db.collection(PAGES_LEGACY_COLLECTION).doc(pageId).get();
  if (legacySnap.exists) return PAGES_LEGACY_COLLECTION;
  return null;
}

async function getCallerProfile(uid: string) {
  const snap = await getFirestore().collection(USERS_COLLECTION).doc(uid).get();
  if (!snap.exists) {
    throw new HttpsError("permission-denied", "Perfil de usuario no encontrado.");
  }
  return { uid, ...(snap.data() ?? {}) } as {
    uid: string;
    role?: string;
    pageId?: string;
    assignedPageIds?: unknown;
  };
}

function canEditPage(
  profile: { role?: string; pageId?: string; assignedPageIds?: unknown },
  pageId: string,
): boolean {
  const role = normalizeRole(profile.role);
  if (role === "root") return true;
  const assigned = normalizePageIdList(profile.assignedPageIds);
  if (assigned.includes(pageId)) return true;
  if (role === "user" && String(profile.pageId ?? "").trim() === pageId) return true;
  return false;
}

function validateInquiry(raw: SubmitInquiryPayload) {
  const name = sanitize(raw.name, MAX_NAME);
  const projectType = sanitize(raw.projectType, MAX_PROJECT_TYPE);
  const contact = sanitize(raw.contact, MAX_CONTACT);
  const message = sanitize(raw.message, MAX_MESSAGE);
  const honeypot = String(raw.website ?? raw.honeypot ?? "").trim();

  if (honeypot) {
    return { ok: false as const, spam: true };
  }
  if (!name || !projectType || !contact || !message) {
    return { ok: false as const, spam: false };
  }
  return {
    ok: true as const,
    data: { name, projectType, contact, message },
  };
}

export const submitPageInquiry = onCall(
  callableOptions,
  async (request: CallableRequest<SubmitInquiryPayload>) => {
    const pageId = String(request.data?.pageId ?? "").trim();
    if (!pageId || pageId.length > 128) {
      throw new HttpsError("invalid-argument", "pageId es obligatorio.");
    }

    const validated = validateInquiry(request.data ?? {});
    if (validated.spam) {
      // Silent success for bots
      return { ok: true, inquiryId: null };
    }
    if (!validated.ok) {
      throw new HttpsError("invalid-argument", "Completa nombre, tipo de proyecto, contacto y mensaje.");
    }

    const collectionName = await resolvePageCollection(pageId);
    if (!collectionName) {
      throw new HttpsError("not-found", "Página no encontrada.");
    }

    const db = getFirestore();
    const pageRef = db.collection(collectionName).doc(pageId);
    const pageSnap = await pageRef.get();
    const pageData = (pageSnap.data() ?? {}) as Record<string, unknown>;
    if (pageData.contactFormEnabled !== true) {
      throw new HttpsError("failed-precondition", "El formulario de contacto no está activo en esta página.");
    }

    const inquiryRef = pageRef.collection("inquiries").doc();
    const createdAt = new Date().toISOString();
    const inquiry = {
      ...validated.data,
      status: "new",
      createdAt,
      source: "landing_contact_form",
    };
    await inquiryRef.set(inquiry);

    const recipients = await resolvePageNotificationRecipients(db, pageId);
    const batch = db.batch();
    let notified = 0;
    for (const uid of recipients) {
      if (!uid || notified >= 50) break;
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
      await pageRef.set(
        { inquiryCount: FieldValue.increment(1), lastInquiryAt: createdAt },
        { merge: true },
      );
    } catch {
      // ignore
    }

    return { ok: true, inquiryId: inquiryRef.id };
  },
);

export const listPageInquiries = onCall(
  listCallableOptions,
  async (request: CallableRequest<ListInquiriesPayload>) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const pageId = String(request.data?.pageId ?? "").trim();
    if (!pageId) {
      throw new HttpsError("invalid-argument", "pageId es obligatorio.");
    }

    const profile = await getCallerProfile(request.auth.uid);
    if (!canEditPage(profile, pageId)) {
      throw new HttpsError("permission-denied", "No tienes acceso a esta página.");
    }

    const collectionName = await resolvePageCollection(pageId);
    if (!collectionName) {
      throw new HttpsError("not-found", "Página no encontrada.");
    }

    const limit = Math.min(Math.max(Number(request.data?.limit) || 30, 1), MAX_LIST);
    const snap = await getFirestore()
      .collection(collectionName)
      .doc(pageId)
      .collection("inquiries")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const inquiries = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() ?? {}),
    }));

    return { inquiries };
  },
);
