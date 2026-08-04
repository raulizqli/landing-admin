/**
 * One-off: sync billingAccounts.pageIds from users.assignedPageIds / pageId
 * for accounts whose quota counter is empty but pages are assigned.
 *
 * Usage (from repo root, with GOOGLE_APPLICATION_CREDENTIALS or gcloud ADC):
 *   node functions/scripts/sync-billing-page-ids.mjs [email-substring]
 */
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'landing-admin-9452e' });
}

const emailFilter = String(process.argv[2] ?? 'lealgarza').trim().toLowerCase();

function normalizePageIdList(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))];
}

async function main() {
  const db = getFirestore();
  const usersSnap = await db.collection('users').get();
  let updated = 0;

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data() || {};
    const email = String(data.email ?? '').trim().toLowerCase();
    if (emailFilter && !email.includes(emailFilter)) continue;

    const accountId = String(data.accountId || userDoc.id).trim();
    const fromProfile = normalizePageIdList([
      ...(Array.isArray(data.assignedPageIds) ? data.assignedPageIds : []),
      data.pageId,
    ]);
    if (!fromProfile.length) {
      console.log(`skip ${email || userDoc.id}: no assigned pages`);
      continue;
    }

    const accountRef = db.collection('billingAccounts').doc(accountId);
    const accountSnap = await accountRef.get();
    if (!accountSnap.exists) {
      console.log(`skip ${email}: missing billingAccounts/${accountId}`);
      continue;
    }

    const existing = normalizePageIdList(accountSnap.data()?.pageIds);
    const merged = normalizePageIdList([...existing, ...fromProfile]);
    if (merged.length === existing.length && merged.every((id) => existing.includes(id))) {
      console.log(`ok ${email}: already ${existing.length} pageIds`);
      continue;
    }

    await accountRef.set(
      {
        pageIds: merged,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    updated += 1;
    console.log(`synced ${email}: ${existing.length} → ${merged.length} [${merged.join(', ')}]`);
  }

  console.log(`done. updated=${updated}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
