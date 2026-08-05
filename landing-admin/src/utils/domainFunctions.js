import { httpsCallable } from 'firebase/functions';
import { ensureCallableSession } from './appCheck';
import { getHubAuth, getHubFunctions } from './firebaseClients';

/**
 * Root-only backfill of domainIndex from existing page customDomain values (F03 Step B).
 */
export async function syncDomainIndexesRemote() {
  await ensureCallableSession(getHubAuth());
  const callable = httpsCallable(getHubFunctions(), 'syncDomainIndexes');
  const result = await callable({});
  return result.data;
}
