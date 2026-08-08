/**
 * First-root bootstrap via Admin SDK.
 * Client self-create of role=root is blocked in firestore.rules (F01).
 */
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { sensitiveCallableOptions } from "./callableOptions.js";

if (getApps().length === 0) {
  initializeApp();
}

const USERS_COLLECTION = "users";

function bootstrapRootEmail(): string {
  return String(process.env.BOOTSTRAP_ROOT_EMAIL ?? "").trim().toLowerCase();
}

function normalizeProfile(uid: string, data: Record<string, unknown> = {}) {
  return {
    uid,
    email: String(data.email ?? "").trim().toLowerCase(),
    displayName: String(data.displayName ?? "").trim(),
    phone: String(data.phone ?? "").trim(),
    role: String(data.role ?? "").trim().toLowerCase(),
    accountId: String(data.accountId ?? "").trim(),
    assignedPageIds: Array.isArray(data.assignedPageIds) ? data.assignedPageIds : [],
    pageId: String(data.pageId ?? "").trim(),
    isDemo: data.isDemo === true,
    disabled: data.disabled === true,
    approvalStatus: String(data.approvalStatus ?? (data.role ? "approved" : "pending")).trim().toLowerCase(),
    updatedAt: data.updatedAt ?? null,
    createdAt: data.createdAt ?? null,
  };
}

const callableOptions = sensitiveCallableOptions();

/**
 * Ensures the allowlisted bootstrap email has a users/{uid} doc with role root.
 * Other signed-in users without a profile get permission-denied (invite-only).
 */
export const ensureBootstrapRoot = onCall(
  callableOptions,
  async (request: CallableRequest) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }

    const uid = request.auth.uid;
    const email = String(request.auth.token.email ?? "").trim().toLowerCase();
    const allowed = bootstrapRootEmail();
    const ref = getFirestore().collection(USERS_COLLECTION).doc(uid);
    const existing = await ref.get();

    if (existing.exists) {
      const data = (existing.data() ?? {}) as Record<string, unknown>;
      // Upgrade allowlisted email to root if somehow not root yet.
      if (allowed && email === allowed && data.role !== "root") {
        const now = new Date().toISOString();
        const profile = {
          email,
          displayName: String(request.auth.token.name ?? data.displayName ?? "").trim(),
          role: "root",
          assignedPageIds: [],
          pageId: "",
          isDemo: false,
          approvalStatus: "approved",
          createdAt: data.createdAt || now,
          updatedAt: now,
        };
        await ref.set(profile, { merge: true });
        return normalizeProfile(uid, profile);
      }
      return normalizeProfile(uid, data);
    }

    if (!allowed || !email || email !== allowed) {
      throw new HttpsError(
        "permission-denied",
        "No tienes un perfil CMS. Pide una invitación a un administrador.",
      );
    }

    const now = new Date().toISOString();
    const profile = {
      email,
      displayName: String(request.auth.token.name ?? "").trim(),
      role: "root",
      assignedPageIds: [],
      pageId: "",
      isDemo: false,
      approvalStatus: "approved",
      createdAt: now,
      updatedAt: now,
    };
    await ref.set(profile, { merge: true });
    return normalizeProfile(uid, profile);
  },
);
