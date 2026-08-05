import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { sensitiveCallableOptions } from "./callableOptions.js";

if (getApps().length === 0) {
  initializeApp();
}

const USERS_COLLECTION = "users";
const DOMAIN_INDEX_COLLECTION = "domainIndex";
const PAGE_COLLECTIONS = ["pages", "paginas"] as const;

type SyncResult = {
  upserted: number;
  skipped: number;
  conflicts: Array<{ domain: string; pageId: string; existingPageId: string }>;
};

function normalizeHostname(hostname: unknown): string {
  return String(hostname ?? "").trim().toLowerCase().replace(/^www\./, "");
}

async function assertRoot(uid: string): Promise<void> {
  const snap = await getFirestore().collection(USERS_COLLECTION).doc(uid).get();
  if (!snap.exists || snap.data()?.role !== "root") {
    throw new HttpsError("permission-denied", "Solo root puede sincronizar domainIndex.");
  }
}

/**
 * Backfill domainIndex/{hostname} → { pageId } from existing page docs (F03 Step B).
 * Safe to re-run; last writer wins on duplicate domains (logged as conflicts).
 */
export const syncDomainIndexes = onCall(
  sensitiveCallableOptions(),
  async (request: CallableRequest<Record<string, never>>): Promise<SyncResult> => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    await assertRoot(request.auth.uid);

    const db = getFirestore();
    const byDomain = new Map<string, { pageId: string; collectionName: string }>();
    const conflicts: SyncResult["conflicts"] = [];
    let skipped = 0;

    for (const collectionName of PAGE_COLLECTIONS) {
      const snapshot = await db.collection(collectionName).get();
      for (const pageDoc of snapshot.docs) {
        const domain = normalizeHostname(pageDoc.data()?.customDomain);
        if (!domain) {
          skipped += 1;
          continue;
        }
        const existing = byDomain.get(domain);
        if (existing && existing.pageId !== pageDoc.id) {
          conflicts.push({
            domain,
            pageId: pageDoc.id,
            existingPageId: existing.pageId,
          });
        }
        // Prefer canonical `pages` over legacy `paginas`.
        if (!existing || collectionName === "pages") {
          byDomain.set(domain, { pageId: pageDoc.id, collectionName });
        }
      }
    }

    const batchSize = 400;
    const entries = Array.from(byDomain.entries());
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = db.batch();
      const slice = entries.slice(i, i + batchSize);
      for (const [domain, meta] of slice) {
        batch.set(
          db.collection(DOMAIN_INDEX_COLLECTION).doc(domain),
          {
            pageId: meta.pageId,
            collectionName: meta.collectionName,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      }
      await batch.commit();
    }

    return {
      upserted: entries.length,
      skipped,
      conflicts,
    };
  },
);
