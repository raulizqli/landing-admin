import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { sensitiveCallableOptions } from "./callableOptions.js";

if (getApps().length === 0) {
  initializeApp();
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

type CallerProfile = {
  uid: string;
  role?: string;
  accountId?: string;
  pageId?: string;
  assignedPageIds?: unknown;
};

function slugifyPageId(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function isValidPageId(pageId: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pageId);
}

function normalizePageIdList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function normalizePlanId(value: unknown): string {
  const id = String(value ?? "").trim().toLowerCase();
  if (id === "pro" || id === "agency" || id === "enterprise" || id === "starter") return id;
  return "starter";
}

function normalizeVertical(value: unknown): string {
  const id = String(value ?? "").trim().toLowerCase();
  return VERTICAL_IDS.has(id) ? id : "generic";
}

function isActiveStatus(status: unknown): boolean {
  const value = String(status ?? "").trim().toLowerCase();
  return value === "active" || value === "trialing";
}

function isBillingAccountOwner(profile: CallerProfile, uid: string): boolean {
  const accountId = String(profile.accountId || uid).trim();
  return Boolean(uid && accountId && accountId === uid);
}

async function getCallerProfile(uid: string): Promise<CallerProfile> {
  const snap = await getFirestore().collection(USERS_COLLECTION).doc(uid).get();
  if (!snap.exists) {
    throw new HttpsError("permission-denied", "Perfil de usuario no encontrado.");
  }
  return { uid, ...(snap.data() ?? {}) } as CallerProfile;
}

function buildInitialPageDoc(input: {
  name: string;
  specialty: string;
  vertical: string;
}) {
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

const callableOptions = sensitiveCallableOptions();

/**
 * Create a CMS page with plan quota enforcement.
 * Root: unrestricted. Pro/Agency account owners: up to pageLimit.
 */
export const createCmsPage = onCall(
  callableOptions,
  async (request: CallableRequest) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }

    const uid = request.auth.uid;
    const profile = await getCallerProfile(uid);
    const isRoot = String(profile.role ?? "").trim().toLowerCase() === "root";
    const isOwner = isBillingAccountOwner(profile, uid);

    const pageId = slugifyPageId(request.data?.pageId);
    const name = String(request.data?.name ?? "").trim();
    const specialty = String(request.data?.specialty ?? "").trim();
    const vertical = normalizeVertical(request.data?.vertical);

    if (!isValidPageId(pageId)) {
      throw new HttpsError(
        "invalid-argument",
        "Usa un ID con minúsculas, números y guiones (ej. maria-garcia).",
      );
    }
    if (!name) {
      throw new HttpsError("invalid-argument", "El nombre es obligatorio.");
    }

    const accountId = String(profile.accountId ?? uid).trim();
    const db = getFirestore();
    const pageRef = db.collection(PAGES_COLLECTION).doc(pageId);
    const accountRef = db.collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId);
    const userRef = db.collection(USERS_COLLECTION).doc(uid);

    // HttpsError thrown inside runTransaction can be wrapped; capture and rethrow after.
    let denial: HttpsError | null = null;

    await db.runTransaction(async (tx) => {
      if (denial) return;

      const [pageSnap, accountSnap, userSnap] = await Promise.all([
        tx.get(pageRef),
        tx.get(accountRef),
        tx.get(userRef),
      ]);

      if (pageSnap.exists) {
        denial = new HttpsError("already-exists", `Ya existe una página con ID "${pageId}".`);
        return;
      }

      const accountData = accountSnap.exists ? (accountSnap.data() ?? {}) : {};
      const planId = normalizePlanId(accountData.plan);
      const pageIds = normalizePageIdList(accountData.pageIds);
      const pageLimit = planId === "enterprise" ? null : planId === "agency" ? 5 : planId === "pro" ? 1 : 1;

      if (!isRoot) {
        if (!isOwner) {
          denial = new HttpsError(
            "permission-denied",
            "Solo el dueño de la cuenta puede crear páginas.",
          );
          return;
        }
        if (!PAGE_SELF_SERVE_PLANS.has(planId)) {
          denial = new HttpsError(
            "permission-denied",
            "Crear páginas requiere plan Pro o Agency.",
          );
          return;
        }
        if (!isActiveStatus(accountData.status)) {
          denial = new HttpsError(
            "failed-precondition",
            "Tu suscripción no está activa. Reactiva el plan para crear páginas.",
          );
          return;
        }
        if (pageLimit != null && pageIds.length >= pageLimit) {
          denial = new HttpsError(
            "resource-exhausted",
            `Límite de páginas alcanzado (${pageIds.length}/${pageLimit}).`,
          );
          return;
        }
        if (!accountSnap.exists) {
          denial = new HttpsError(
            "failed-precondition",
            "No hay cuenta de billing. Abre Facturación o contacta soporte.",
          );
          return;
        }
      }

      const initial = buildInitialPageDoc({ name, specialty, vertical });
      tx.set(pageRef, initial);

      if (accountSnap.exists) {
        tx.set(
          accountRef,
          {
            pageIds: FieldValue.arrayUnion(pageId),
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      }

      const userData = userSnap.data() ?? {};
      const role = String(userData.role ?? "").trim().toLowerCase();
      const existingPageId = String(userData.pageId ?? "").trim();
      const patch: Record<string, unknown> = {
        accountId,
        updatedAt: new Date().toISOString(),
      };

      // Always attach the new page to the creator so CMS list + Firestore canEditPage work
      // for Agency/Pro owners (role user|admin) without a stale empty pageId.
      if (role === "admin" || role === "user" || (isOwner && role !== "root")) {
        patch.assignedPageIds = FieldValue.arrayUnion(pageId);
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
    return {
      ok: true,
      pageId,
      page: { id: pageId, ...(createdSnap.data() ?? {}) },
      accountId,
    };
  },
);
