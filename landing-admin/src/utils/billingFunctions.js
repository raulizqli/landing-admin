import { httpsCallable } from 'firebase/functions';
import { getHubFunctions } from './firebaseClients';

function mapBillingCallableError(error) {
  const code = String(error?.code ?? '');
  if (code.includes('unauthenticated')) {
    return 'Debes iniciar sesión.';
  }
  if (code.includes('failed-precondition') || code.includes('unimplemented')) {
    return error?.message || 'Billing no está configurado en el servidor.';
  }
  if (code.includes('not-found') || code.includes('functions/not-found')) {
    return 'Cloud Functions de billing no desplegadas. Despliega createBillingCheckout.';
  }
  return error?.message || 'No se pudo iniciar el checkout.';
}

export async function createBillingCheckout({
  planId,
  provider,
  locale = 'es',
  currency,
  successPath = '/?billing=success',
  cancelPath = '/?billing=cancel',
} = {}) {
  try {
    const callable = httpsCallable(getHubFunctions(), 'createBillingCheckout');
    const result = await callable({
      planId,
      provider,
      locale,
      currency,
      successPath,
      cancelPath,
    });
    return result.data;
  } catch (error) {
    throw new Error(mapBillingCallableError(error));
  }
}

export async function ensureBillingAccountRemote() {
  try {
    const callable = httpsCallable(getHubFunctions(), 'ensureBillingAccount');
    const result = await callable({});
    return result.data?.account ?? null;
  } catch (error) {
    throw new Error(mapBillingCallableError(error));
  }
}

/** Root-only: set plan without payment (ops / enterprise). */
export async function setBillingPlanManual({ accountId, planId, status = 'active' } = {}) {
  try {
    const callable = httpsCallable(getHubFunctions(), 'setBillingPlanManual');
    const result = await callable({ accountId, planId, status });
    return result.data?.account ?? null;
  } catch (error) {
    throw new Error(mapBillingCallableError(error));
  }
}

/** Hard server gate before publishing Marketing Site content. */
export async function assertMarketingSiteAccessRemote(pageId) {
  try {
    const callable = httpsCallable(getHubFunctions(), 'assertMarketingSiteAccess');
    const result = await callable({ pageId });
    return result.data;
  } catch (error) {
    const code = String(error?.code ?? '');
    if (code.includes('permission-denied')) {
      throw new Error(error?.message || 'Marketing Site no está habilitado para esta cuenta.');
    }
    if (code.includes('not-found') || code.includes('functions/not-found')) {
      throw new Error('Cloud Function assertMarketingSiteAccess no desplegada. Despliega functions.');
    }
    throw new Error(mapBillingCallableError(error));
  }
}

/** Root-only: toggle Agency Marketing Site add-on (and future add-ons). */
export async function setBillingAccountAddonsRemote({ accountId, addons } = {}) {
  try {
    const callable = httpsCallable(getHubFunctions(), 'setBillingAccountAddons');
    const result = await callable({ accountId, addons });
    return result.data?.account ?? null;
  } catch (error) {
    throw new Error(mapBillingCallableError(error));
  }
}

/** Root-only: confirm ad revenue or force grace/ads/offline stage. */
export async function setBillingMonetizationRemote({ accountId, monetization } = {}) {
  try {
    const callable = httpsCallable(getHubFunctions(), 'setBillingMonetization');
    const result = await callable({ accountId, monetization });
    return result.data?.account ?? null;
  } catch (error) {
    throw new Error(mapBillingCallableError(error));
  }
}
