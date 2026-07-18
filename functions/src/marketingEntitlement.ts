import { getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";

if (getApps().length === 0) {
  initializeApp();
}

const USERS_COLLECTION = "users";
const BILLING_ACCOUNTS_COLLECTION = "billingAccounts";

const PLANS_WITH_MARKETING_SITE = new Set(["enterprise"]);

type CallerProfile = {
  uid: string;
  role?: string;
  email?: string;
  accountId?: string;
  pageId?: string;
  assignedPageIds?: unknown;
};

function normalizePlanId(value: unknown): string {
  const id = String(value ?? "").trim().toLowerCase();
  if (id === "starter" || id === "pro" || id === "agency" || id === "enterprise") return id;
  return "starter";
}

function normalizeStatus(value: unknown): string {
  const status = String(value ?? "").trim().toLowerCase();
  if (status === "active" || status === "trialing" || status === "past_due" || status === "canceled" || status === "incomplete") {
    return status;
  }
  return "incomplete";
}

function isAccountActive(status: string): boolean {
  return status === "active" || status === "trialing";
}

function accountHasMarketingSite(account: {
  plan?: string;
  status?: string;
  addons?: Record<string, unknown>;
}): boolean {
  if (!isAccountActive(normalizeStatus(account.status))) return false;
  if (account?.addons?.marketingSite === true) return true;
  return PLANS_WITH_MARKETING_SITE.has(normalizePlanId(account.plan));
}

function normalizePageIdList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function canAccessPage(profile: CallerProfile, pageId: string): boolean {
  const role = String(profile.role ?? "").trim().toLowerCase();
  if (role === "root") return true;
  if (role === "admin") {
    return normalizePageIdList(profile.assignedPageIds).includes(pageId);
  }
  if (role === "user") {
    const single = String(profile.pageId ?? "").trim();
    if (single) return single === pageId;
    return normalizePageIdList(profile.assignedPageIds)[0] === pageId;
  }
  return false;
}

async function getCallerProfile(uid: string): Promise<CallerProfile> {
  const snap = await getFirestore().collection(USERS_COLLECTION).doc(uid).get();
  if (!snap.exists) {
    throw new HttpsError("permission-denied", "Perfil de usuario no encontrado.");
  }
  return { uid, ...(snap.data() ?? {}) } as CallerProfile;
}

async function loadBillingAccount(accountId: string) {
  const snap = await getFirestore().collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId).get();
  if (!snap.exists) {
    throw new HttpsError("failed-precondition", "Cuenta de billing no encontrada.");
  }
  return { id: accountId, ...(snap.data() ?? {}) } as {
    id: string;
    plan?: string;
    status?: string;
    addons?: Record<string, unknown>;
  };
}

/**
 * Hard gate before publishing Marketing Site data.
 * Root bypasses; others need Enterprise plan or Agency marketingSite add-on.
 */
export const assertMarketingSiteAccess = onCall(async (request: CallableRequest) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }

  const pageId = String(request.data?.pageId ?? "").trim();
  if (!pageId) {
    throw new HttpsError("invalid-argument", "pageId es obligatorio.");
  }

  const profile = await getCallerProfile(request.auth.uid);
  if (!canAccessPage(profile, pageId)) {
    throw new HttpsError("permission-denied", "No tienes acceso a esta página.");
  }

  const role = String(profile.role ?? "").trim().toLowerCase();
  if (role === "root") {
    return { ok: true, source: "root" as const, pageId };
  }

  const accountId = String(profile.accountId ?? profile.uid).trim();
  const account = await loadBillingAccount(accountId);
  if (!accountHasMarketingSite(account)) {
    throw new HttpsError(
      "permission-denied",
      "Marketing Site requiere plan Enterprise o el add-on marketingSite en Agency.",
    );
  }

  const source = account.addons?.marketingSite === true ? "addon" : "plan";
  return { ok: true, source, pageId, accountId, plan: normalizePlanId(account.plan) };
});

/** Root-only: toggle paid add-ons on a billing account (e.g. Agency + marketingSite). */
export const setBillingAccountAddons = onCall(async (request: CallableRequest) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }

  const profile = await getCallerProfile(request.auth.uid);
  if (String(profile.role ?? "").trim().toLowerCase() !== "root") {
    throw new HttpsError("permission-denied", "Solo root puede gestionar add-ons de billing.");
  }

  const accountId = String(request.data?.accountId ?? "").trim();
  if (!accountId) {
    throw new HttpsError("invalid-argument", "accountId es obligatorio.");
  }

  const marketingSite = request.data?.addons?.marketingSite;
  if (typeof marketingSite !== "boolean") {
    throw new HttpsError("invalid-argument", "addons.marketingSite debe ser boolean.");
  }

  const ref = getFirestore().collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", `No existe billingAccounts/${accountId}.`);
  }

  const existing = (snap.data()?.addons && typeof snap.data()?.addons === "object")
    ? { ...(snap.data()?.addons as Record<string, unknown>) }
    : {};

  if (marketingSite) {
    existing.marketingSite = true;
  } else {
    delete existing.marketingSite;
  }

  const now = new Date().toISOString();
  await ref.set({ addons: existing, updatedAt: now }, { merge: true });
  const next = await ref.get();
  return { account: { id: accountId, ...(next.data() ?? {}) } };
});
