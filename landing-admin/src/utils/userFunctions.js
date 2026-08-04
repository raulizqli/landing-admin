import { httpsCallable } from 'firebase/functions';
import { getHubAuth, getHubFunctions } from './firebaseClients';

async function assertCallableAuthSession() {
  const auth = getHubAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Debes iniciar sesión para gestionar usuarios.');
  }

  await currentUser.getIdToken(true);
  return currentUser;
}

function mapCallableError(error) {
  const code = error?.code ?? '';
  const details = typeof error?.details === 'string' ? error.details.trim() : '';
  const message = String(error?.message ?? '').trim() || 'No se pudo completar la operación.';
  const text = details || message;

  if (code === 'functions/unauthenticated') {
    return new Error('Debes iniciar sesión para gestionar usuarios.');
  }
  if (code === 'functions/permission-denied') {
    return new Error('Solo un usuario root puede gestionar cuentas.');
  }
  if (code === 'functions/already-exists') {
    return new Error('Ya existe un usuario con ese email.');
  }
  if (code === 'functions/invalid-argument' || code === 'functions/failed-precondition') {
    return new Error(text);
  }
  if (code === 'functions/not-found' || code === 'functions/unavailable') {
    return new Error('Las Cloud Functions no están desplegadas. Ejecuta npm run deploy:functions en la raíz del proyecto.');
  }
  if (code === 'functions/internal') {
    const cleaned = text.replace(/^INTERNAL:?\s*/i, '').trim();
    return new Error(cleaned && cleaned.toUpperCase() !== 'INTERNAL'
      ? cleaned
      : 'Error interno en Cloud Functions. Revisa el despliegue de updateCmsUser.');
  }

  return new Error(text);
}

export async function createCmsUser(payload) {
  try {
    await assertCallableAuthSession();
    const callable = httpsCallable(getHubFunctions(), 'createCmsUser');
    const result = await callable(payload);
    return result.data;
  } catch (error) {
    throw mapCallableError(error);
  }
}

export async function updateCmsUser(payload) {
  try {
    await assertCallableAuthSession();
    const callable = httpsCallable(getHubFunctions(), 'updateCmsUser');
    const result = await callable(payload);
    return result.data;
  } catch (error) {
    throw mapCallableError(error);
  }
}

export async function generateCmsUserInvitation(uid) {
  try {
    await assertCallableAuthSession();
    const callable = httpsCallable(getHubFunctions(), 'generateCmsUserInvitation');
    const result = await callable({ uid });
    return result.data;
  } catch (error) {
    throw mapCallableError(error);
  }
}

export async function deleteCmsUser(uid) {
  try {
    await assertCallableAuthSession();
    const callable = httpsCallable(getHubFunctions(), 'deleteCmsUser');
    const result = await callable({ uid });
    return result.data;
  } catch (error) {
    throw mapCallableError(error);
  }
}

export async function listCmsUsersRemote() {
  try {
    await assertCallableAuthSession();
    const callable = httpsCallable(getHubFunctions(), 'listCmsUsers');
    const result = await callable({});
    return result.data?.users || [];
  } catch (error) {
    throw mapCallableError(error);
  }
}
