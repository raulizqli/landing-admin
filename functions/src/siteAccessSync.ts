import { getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp, getApps } from "firebase-admin/app";
import {
  normalizeMonetization,
  nextUnpaidSince,
  resolveSiteAccessFromAccount,
  SiteAccessSnapshot,
} from "./siteAccessPolicy.js";

if (getApps().length === 0) {
  initializeApp();
}

const USERS_COLLECTION = "users";
const BILLING_ACCOUNTS_COLLECTION = "billingAccounts";
const PAGES_COLLECTIONS = ["pages", "paginas"] as const;

async function getCallerProfile(uid: string) {
  const snap = await getFirestore().collection(USERS_COLLECTION).doc(uid).get();
  if (!snap.exists) {
    throw new HttpsError("permission-denied", "Perfil de usuario no encontrado.");
  }
  return { uid, ...(snap.data() ?? {}) } as { uid: string; role?: string };
}

async function writeSiteAccessToPages(pageIds: string[], siteAccess: SiteAccessSnapshot) {
  const db = getFirestore();
  const unique = [...new Set(pageIds.map((id) => String(id ?? "").trim()).filter(Boolean))];
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

export async function syncAccountSiteAccess(accountId: string) {
  const db = getFirestore();
  const ref = db.collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const data = snap.data() ?? {};
  const siteAccess = resolveSiteAccessFromAccount({
    status: data.status,
    unpaidSince: data.unpaidSince,
    monetization: data.monetization,
  });

  await ref.set(
    {
      unpaidSince: siteAccess.unpaidSince,
      siteAccess,
      updatedAt: siteAccess.updatedAt,
    },
    { merge: true },
  );

  const pageIds = Array.isArray(data.pageIds) ? data.pageIds.map(String) : [];
  await writeSiteAccessToPages(pageIds, siteAccess);
  return { accountId, siteAccess, pageCount: pageIds.length };
}

/**
 * Apply billing patch and keep unpaidSince + denormalized page siteAccess in sync.
 */
export async function applyBillingPatchWithSiteAccess(
  accountId: string,
  patch: Record<string, unknown>,
) {
  const db = getFirestore();
  const ref = db.collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId);
  const previous = await ref.get();
  const previousData = previous.exists ? previous.data() ?? {} : {};

  const nextStatus = patch.status !== undefined ? patch.status : previousData.status;
  const unpaidSince = nextUnpaidSince(previousData, nextStatus);
  const monetization = patch.monetization !== undefined
    ? normalizeMonetization(patch.monetization)
    : normalizeMonetization(previousData.monetization);

  const mergedForResolve = {
    status: nextStatus,
    unpaidSince,
    monetization,
  };
  const siteAccess = resolveSiteAccessFromAccount(mergedForResolve);

  await ref.set(
    {
      ...patch,
      unpaidSince: siteAccess.unpaidSince,
      monetization,
      siteAccess,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  const nextSnap = await ref.get();
  const nextData = nextSnap.data() ?? {};
  const pageIds = Array.isArray(nextData.pageIds) ? nextData.pageIds.map(String) : [];
  await writeSiteAccessToPages(pageIds, siteAccess);

  return { id: accountId, ...nextData, siteAccess };
}

/** Root: mark whether Google Ads publicity is earning enough to keep sites online. */
export const setBillingMonetization = onCall(async (request: CallableRequest) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }
  const profile = await getCallerProfile(request.auth.uid);
  if (String(profile.role ?? "").trim().toLowerCase() !== "root") {
    throw new HttpsError("permission-denied", "Solo root puede gestionar monetización.");
  }

  const accountId = String(request.data?.accountId ?? "").trim();
  if (!accountId) {
    throw new HttpsError("invalid-argument", "accountId es obligatorio.");
  }

  const adsRevenueOk = request.data?.monetization?.adsRevenueOk;
  const forceStage = request.data?.monetization?.forceStage;
  if (typeof adsRevenueOk !== "boolean" && forceStage === undefined) {
    throw new HttpsError(
      "invalid-argument",
      "Debes enviar monetization.adsRevenueOk y/o monetization.forceStage.",
    );
  }

  const previous = await getFirestore().collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId).get();
  if (!previous.exists) {
    throw new HttpsError("not-found", `No existe billingAccounts/${accountId}.`);
  }

  const current = normalizeMonetization(previous.data()?.monetization);
  const next = {
    adsRevenueOk: typeof adsRevenueOk === "boolean" ? adsRevenueOk : current.adsRevenueOk,
    forceStage: forceStage !== undefined
      ? normalizeMonetization({ forceStage }).forceStage
      : current.forceStage,
  };

  const account = await applyBillingPatchWithSiteAccess(accountId, { monetization: next });
  return { account };
});

/** Daily recompute so 6-month / 9-month thresholds apply without new webhooks. */
export const syncSiteAccessDaily = onSchedule("every 24 hours", async () => {
  const snap = await getFirestore().collection(BILLING_ACCOUNTS_COLLECTION).get();
  for (const doc of snap.docs) {
    try {
      await syncAccountSiteAccess(doc.id);
    } catch (error) {
      console.error("syncSiteAccessDaily failed for", doc.id, error);
    }
  }
});
