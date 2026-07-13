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
  const message = error?.message ?? 'No se pudo completar la operación.';

  if (code === 'functions/unauthenticated') {
    return new Error('Debes iniciar sesión para gestionar usuarios.');
  }
  if (code === 'functions/permission-denied') {
    return new Error('Solo un usuario root puede gestionar cuentas.');
  }
  if (code === 'functions/already-exists') {
    return new Error('Ya existe un usuario con ese email.');
  }
  if (code === 'functions/invalid-argument') {
    return new Error(message);
  }
  if (code === 'functions/failed-precondition') {
    return new Error(message);
  }
  if (code === 'functions/not-found' || code === 'functions/unavailable') {
    return new Error('Las Cloud Functions no están desplegadas. Ejecuta npm run deploy:functions en la raíz del proyecto.');
  }

  return new Error(message);
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
