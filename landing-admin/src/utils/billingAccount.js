import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { BILLING_ACCOUNTS_COLLECTION } from './firestorePaths';
import {
  createEmptyBillingAccount,
  normalizeBillingAccount,
} from './billingPlans';

export async function getBillingAccount(db, accountId) {
  const id = String(accountId ?? '').trim();
  if (!id) return null;
  const snapshot = await getDoc(doc(db, BILLING_ACCOUNTS_COLLECTION, id));
  if (!snapshot.exists()) return null;
  return normalizeBillingAccount(snapshot.id, snapshot.data());
}

/**
 * Client-side ensure for local UX. Production writes still go through Cloud Functions
 * (checkout / webhooks). Owners may create an incomplete draft if rules allow.
 */
export async function ensureLocalBillingAccountDraft(db, { accountId, ownerUid, name, email }) {
  const id = String(accountId ?? ownerUid ?? '').trim();
  if (!id || !ownerUid) {
    throw new Error('Missing billing account id or owner.');
  }

  const existing = await getBillingAccount(db, id);
  if (existing) return existing;

  const now = new Date().toISOString();
  const draft = createEmptyBillingAccount({
    id,
    ownerUid,
    name: name || email || id,
    status: 'incomplete',
    plan: 'starter',
    createdAt: now,
    updatedAt: now,
  });

  await setDoc(doc(db, BILLING_ACCOUNTS_COLLECTION, id), {
    ...draft,
    id: undefined,
  }, { merge: true });

  return normalizeBillingAccount(id, draft);
}

export async function updateBillingAccountLocal(db, accountId, patch) {
  const id = String(accountId ?? '').trim();
  if (!id) throw new Error('Missing billing account id.');
  await updateDoc(doc(db, BILLING_ACCOUNTS_COLLECTION, id), {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
  return getBillingAccount(db, id);
}
