/**
 * Clone a CMS page document (and subcollections) to a new ID.
 *
 * Usage:
 *   cd functions && node scripts/clone-page.mjs <sourceId> <destId> [--force]
 *
 * Does not overwrite dest unless --force. Assigns dest to billing accounts / users
 * that already include the source page.
 */
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'landing-admin-9452e';
const PAGES_COLLECTION = 'pages';
const LEGACY_PAGES_COLLECTION = 'paginas';

if (getApps().length === 0) {
  initializeApp({
    projectId: PROJECT_ID,
    credential: applicationDefault(),
  });
}

function slugifyPageId(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function isValidPageId(pageId) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pageId);
}

async function copyDocRecursive(fromRef, toRef, { transform } = {}) {
  const snap = await fromRef.get();
  if (!snap.exists) {
    throw new Error(`Missing ${fromRef.path}`);
  }
  const data = transform ? transform({ ...snap.data() }) : { ...snap.data() };
  await toRef.set(data);

  const subcols = await fromRef.listCollections();
  for (const col of subcols) {
    const docs = await col.listDocuments();
    for (const subDoc of docs) {
      await copyDocRecursive(subDoc, toRef.collection(col.id).doc(subDoc.id));
    }
  }
}

async function findPageRef(db, pageId) {
  for (const collectionName of [PAGES_COLLECTION, LEGACY_PAGES_COLLECTION]) {
    const ref = db.collection(collectionName).doc(pageId);
    const snap = await ref.get();
    if (snap.exists) return { ref, collectionName, snap };
  }
  return { ref: null, collectionName: PAGES_COLLECTION, snap: null };
}

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--force');
  const force = process.argv.includes('--force');
  const sourceId = slugifyPageId(args[0]);
  const destId = slugifyPageId(args[1]);

  if (!isValidPageId(sourceId) || !isValidPageId(destId)) {
    console.error('Usage: node scripts/clone-page.mjs <sourceId> <destId> [--force]');
    process.exit(1);
  }
  if (sourceId === destId) {
    console.error('Source and destination IDs must differ.');
    process.exit(1);
  }

  const db = getFirestore();
  const source = await findPageRef(db, sourceId);
  if (!source.snap) {
    console.error(`Source page not found: ${sourceId}`);
    process.exit(1);
  }

  const destRef = db.collection(source.collectionName).doc(destId);
  const destSnap = await destRef.get();
  if (destSnap.exists && !force) {
    console.error(`Destination already exists: ${source.collectionName}/${destId} (pass --force to overwrite)`);
    process.exit(1);
  }

  const sourceDomain = String(source.snap.data()?.customDomain ?? '').trim().toLowerCase();
  const destLooksLikeProduct = destId === 'toqua';

  await copyDocRecursive(source.ref, destRef, {
    transform: (data) => {
      const now = new Date().toISOString();
      const next = {
        ...data,
        clonedFrom: sourceId,
        createdAt: data.createdAt || now,
        updatedAt: now,
      };
      if (destLooksLikeProduct) {
        next.name = 'Toqua';
      }
      // Avoid two pages claiming the same custom domain.
      if (sourceDomain && sourceDomain !== `${destId}.site` && sourceDomain !== destId) {
        next.customDomain = '';
      }
      return next;
    },
  });

  const accountSnaps = await db.collection('billingAccounts').get();
  let accountsUpdated = 0;
  for (const docSnap of accountSnaps.docs) {
    const pageIds = Array.isArray(docSnap.data()?.pageIds) ? docSnap.data().pageIds : [];
    if (!pageIds.includes(sourceId) || pageIds.includes(destId)) continue;
    await docSnap.ref.set({
      pageIds: FieldValue.arrayUnion(destId),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    accountsUpdated += 1;
  }

  const userSnaps = await db.collection('users').get();
  let usersUpdated = 0;
  for (const docSnap of userSnaps.docs) {
    const data = docSnap.data() || {};
    const assigned = Array.isArray(data.assignedPageIds) ? data.assignedPageIds : [];
    const single = String(data.pageId ?? '').trim();
    const hasSource = assigned.includes(sourceId) || single === sourceId;
    if (!hasSource) continue;
    await docSnap.ref.set({
      assignedPageIds: FieldValue.arrayUnion(destId),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    usersUpdated += 1;
  }

  console.log(`cloned ${source.collectionName}/${sourceId} -> ${source.collectionName}/${destId}`);
  console.log(`billingAccounts updated: ${accountsUpdated}`);
  console.log(`users updated: ${usersUpdated}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
