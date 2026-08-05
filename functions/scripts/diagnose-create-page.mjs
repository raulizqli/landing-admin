/**
 * Diagnose page-create eligibility for an email substring.
 * Usage: node functions/scripts/diagnose-create-page.mjs [email-substring]
 */
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'landing-admin-9452e' });
}

const emailFilter = String(process.argv[2] ?? 'lealgarza').trim().toLowerCase();
const SELF_SERVE = new Set(['pro', 'agency']);

function normalizePageIdList(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))];
}

function diagnose(account) {
  const plan = String(account?.plan ?? 'starter').trim().toLowerCase();
  const status = String(account?.status ?? 'incomplete').trim().toLowerCase();
  const pageIds = normalizePageIdList(account?.pageIds);
  const pageLimit = plan === 'enterprise' ? null : plan === 'agency' ? 5 : 1;
  const active = status === 'active' || status === 'trialing';
  const reasons = [];
  if (!SELF_SERVE.has(plan) && plan !== 'enterprise') {
    reasons.push(`plan "${plan}" cannot self-serve create (need Pro/Agency)`);
  }
  if (!active) {
    reasons.push(`subscription status "${status}" is not active/trialing`);
  }
  if (pageLimit != null && pageIds.length >= pageLimit) {
    reasons.push(`page limit reached (${pageIds.length}/${pageLimit})`);
  }
  return {
    plan,
    status,
    active,
    pageIds,
    pageCount: pageIds.length,
    pageLimit,
    canCreate: reasons.length === 0,
    blockReasons: reasons,
  };
}

async function main() {
  const db = getFirestore();
  const usersSnap = await db.collection('users').get();
  let found = 0;

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data() || {};
    const email = String(data.email ?? '').trim().toLowerCase();
    if (emailFilter && !email.includes(emailFilter)) continue;
    found += 1;

    const accountId = String(data.accountId || userDoc.id).trim();
    const accountSnap = await db.collection('billingAccounts').doc(accountId).get();
    const account = accountSnap.exists ? accountSnap.data() : null;
    const d = diagnose(account || {});
    const isOwner = accountId === userDoc.id;

    console.log(JSON.stringify({
      email,
      uid: userDoc.id,
      role: data.role,
      accountId,
      isBillingOwner: isOwner,
      assignedPageIds: normalizePageIdList([
        ...(Array.isArray(data.assignedPageIds) ? data.assignedPageIds : []),
        data.pageId,
      ]),
      billingMissing: !accountSnap.exists,
      ...d,
      likelyError: !isOwner
        ? 'Solo el dueño de la cuenta puede crear páginas.'
        : d.blockReasons[0] || null,
    }, null, 2));
  }

  if (!found) console.log(`No users matched filter: ${emailFilter}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
