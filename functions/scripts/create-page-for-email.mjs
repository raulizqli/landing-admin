/**
 * Create a CMS page for an account owner (ops / support), bypassing the callable.
 * Usage:
 *   node functions/scripts/create-page-for-email.mjs <email> <pageId> [name] [specialty] [vertical]
 */
import { initializeApp, getApps } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'landing-admin-9452e' });
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

function normalizePageIdList(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))];
}

async function main() {
  const email = String(process.argv[2] ?? '').trim().toLowerCase();
  const pageId = slugifyPageId(process.argv[3]);
  const name = String(process.argv[4] ?? pageId).trim();
  const specialty = String(process.argv[5] ?? '').trim();
  const vertical = String(process.argv[6] ?? 'psychology').trim().toLowerCase() || 'psychology';

  if (!email || !isValidPageId(pageId)) {
    console.error('Usage: node create-page-for-email.mjs <email> <pageId> [name] [specialty] [vertical]');
    process.exit(1);
  }

  const db = getFirestore();
  const usersSnap = await db.collection('users').get();
  const userDoc = usersSnap.docs.find((d) => String(d.data()?.email ?? '').trim().toLowerCase() === email);
  if (!userDoc) {
    console.error(`User not found for email: ${email}`);
    process.exit(1);
  }

  const uid = userDoc.id;
  const accountId = String(userDoc.data()?.accountId || uid).trim();
  const pageRef = db.collection('pages').doc(pageId);
  const accountRef = db.collection('billingAccounts').doc(accountId);
  const userRef = db.collection('users').doc(uid);

  const existing = await pageRef.get();
  if (existing.exists) {
    console.error(`Page already exists: ${pageId}`);
    process.exit(1);
  }

  const now = new Date().toISOString();
  await db.runTransaction(async (tx) => {
    const accountSnap = await tx.get(accountRef);
    if (!accountSnap.exists) {
      throw new Error(`Missing billingAccounts/${accountId}`);
    }
    tx.set(pageRef, {
      name,
      specialty,
      vertical,
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
    });
    tx.set(
      accountRef,
      { pageIds: FieldValue.arrayUnion(pageId), updatedAt: now },
      { merge: true },
    );
    tx.set(
      userRef,
      {
        accountId,
        assignedPageIds: FieldValue.arrayUnion(pageId),
        updatedAt: now,
      },
      { merge: true },
    );
  });

  const acct = await accountRef.get();
  console.log(JSON.stringify({
    ok: true,
    email,
    uid,
    accountId,
    pageId,
    pageIds: normalizePageIdList(acct.data()?.pageIds),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
