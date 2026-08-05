"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncDomainIndexes = void 0;
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const https_1 = require("firebase-functions/v2/https");
const callableOptions_js_1 = require("./callableOptions.js");
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
const USERS_COLLECTION = "users";
const DOMAIN_INDEX_COLLECTION = "domainIndex";
const PAGE_COLLECTIONS = ["pages", "paginas"];
function normalizeHostname(hostname) {
    return String(hostname !== null && hostname !== void 0 ? hostname : "").trim().toLowerCase().replace(/^www\./, "");
}
async function assertRoot(uid) {
    var _a;
    const snap = await (0, firestore_1.getFirestore)().collection(USERS_COLLECTION).doc(uid).get();
    if (!snap.exists || ((_a = snap.data()) === null || _a === void 0 ? void 0 : _a.role) !== "root") {
        throw new https_1.HttpsError("permission-denied", "Solo root puede sincronizar domainIndex.");
    }
}
/**
 * Backfill domainIndex/{hostname} → { pageId } from existing page docs (F03 Step B).
 * Safe to re-run; last writer wins on duplicate domains (logged as conflicts).
 */
exports.syncDomainIndexes = (0, https_1.onCall)((0, callableOptions_js_1.sensitiveCallableOptions)(), async (request) => {
    var _a, _b;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    await assertRoot(request.auth.uid);
    const db = (0, firestore_1.getFirestore)();
    const byDomain = new Map();
    const conflicts = [];
    let skipped = 0;
    for (const collectionName of PAGE_COLLECTIONS) {
        const snapshot = await db.collection(collectionName).get();
        for (const pageDoc of snapshot.docs) {
            const domain = normalizeHostname((_b = pageDoc.data()) === null || _b === void 0 ? void 0 : _b.customDomain);
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
            batch.set(db.collection(DOMAIN_INDEX_COLLECTION).doc(domain), {
                pageId: meta.pageId,
                collectionName: meta.collectionName,
                updatedAt: new Date().toISOString(),
            }, { merge: true });
        }
        await batch.commit();
    }
    return {
        upserted: entries.length,
        skipped,
        conflicts,
    };
});
//# sourceMappingURL=domainIndex.js.map