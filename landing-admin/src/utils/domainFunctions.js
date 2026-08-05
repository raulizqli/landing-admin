import { httpsCallable } from 'firebase/functions';
import { getHubAuth, getHubFunctions } from './firebaseClients';

async function assertCallableAuthSession() {
  const auth = getHubAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Debes iniciar sesión.');
  }
  await currentUser.getIdToken(true);
  return currentUser;
}

/**
 * Root-only backfill of domainIndex from existing page customDomain values (F03 Step B).
 */
export async function syncDomainIndexesRemote() {
  await assertCallableAuthSession();
  const callable = httpsCallable(getHubFunctions(), 'syncDomainIndexes');
  const result = await callable({});
  return result.data;
}
