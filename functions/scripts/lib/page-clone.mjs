import { FieldValue } from 'firebase-admin/firestore';

export const DEFAULT_SOURCE_PAGE_ID = 'leftsidedev';

const BATCH_LIMIT = 450;

/**
 * @param {string[]} argv
 * @returns {{ from: string, to: string }}
 */
export function parseCloneArgs(argv = process.argv.slice(2)) {
  let from = DEFAULT_SOURCE_PAGE_ID;
  let to = '';

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--from' || arg === '-f') {
      const value = argv[i + 1];
      if (!value || value.startsWith('-')) {
        throw new Error('--from requires a page id');
      }
      from = value.trim();
      i += 1;
    } else if (arg === '--to' || arg === '-t') {
      const value = argv[i + 1];
      if (!value || value.startsWith('-')) {
        throw new Error('--to requires a page id');
      }
      to = value.trim();
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      return { from: '', to: '', help: true };
    } else if (!arg.startsWith('-')) {
      throw new Error(`Unknown argument: ${arg}. Use --from and --to.`);
    } else {
      throw new Error(`Unknown flag: ${arg}`);
    }
  }

  if (!to) {
    throw new Error('--to is required (target page id for the clone)');
  }

  if (!from) {
    throw new Error('--from must be a non-empty page id');
  }

  return { from, to };
}

export function clonePageUsage() {
  return `Clone a Firestore pages/{id} document (and routes subcollection).

Usage:
  node scripts/clone-page.mjs --to <targetId> [--from <sourceId>]

Options:
  --to,  -t   Target page id (required)
  --from,-f  Source page id (default: ${DEFAULT_SOURCE_PAGE_ID})

Examples:
  node scripts/clone-page.mjs --to toqua
  node scripts/clone-page.mjs --from stilette --to toqua-copy
`;
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} pageId
 * @param {string} subcollection
 */
async function clearSubcollection(db, pageId, subcollection) {
  const col = db.collection('pages').doc(pageId).collection(subcollection);
  const existing = await col.get();
  if (existing.empty) return 0;

  let removed = 0;
  for (let i = 0; i < existing.docs.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    existing.docs.slice(i, i + BATCH_LIMIT).forEach((docSnap) => {
      batch.delete(docSnap.ref);
      removed += 1;
    });
    await batch.commit();
  }
  return removed;
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} fromId
 * @param {string} toId
 * @param {string} subcollection
 */
async function copySubcollection(db, fromId, toId, subcollection) {
  const sourceCol = db.collection('pages').doc(fromId).collection(subcollection);
  const targetCol = db.collection('pages').doc(toId).collection(subcollection);
  const sourceSnap = await sourceCol.get();

  const removed = await clearSubcollection(db, toId, subcollection);
  if (sourceSnap.empty) {
    return { removed, copied: 0 };
  }

  let copied = 0;
  for (let i = 0; i < sourceSnap.docs.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    sourceSnap.docs.slice(i, i + BATCH_LIMIT).forEach((docSnap) => {
      batch.set(targetCol.doc(docSnap.id), docSnap.data());
      copied += 1;
    });
    await batch.commit();
  }

  return { removed, copied };
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {{ from: string, to: string, merge?: Record<string, unknown>, copyRoutes?: boolean }} options
 */
export async function clonePageDocument(db, { from, to, merge = {}, copyRoutes = true }) {
  if (from === to) {
    throw new Error('Source and target page ids must differ');
  }

  const sourceRef = db.collection('pages').doc(from);
  const targetRef = db.collection('pages').doc(to);
  const sourceSnap = await sourceRef.get();

  if (!sourceSnap.exists) {
    throw new Error(`Source page "${from}" not found in pages/`);
  }

  const payload = {
    ...sourceSnap.data(),
    ...merge,
    updatedAt: new Date().toISOString(),
    clonedFrom: from,
    clonedAt: FieldValue.serverTimestamp(),
  };

  await targetRef.set(payload, { merge: false });

  let routes = { removed: 0, copied: 0 };
  if (copyRoutes) {
    routes = await copySubcollection(db, from, to, 'routes');
  }

  return { from, to, routes };
}
