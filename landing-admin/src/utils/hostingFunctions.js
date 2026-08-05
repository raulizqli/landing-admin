import { httpsCallable } from 'firebase/functions';
import { ensureCallableSession } from './appCheck';
import { getHubAuth, getHubFunctions } from './firebaseClients';
import { normalizeHostingDeployFields } from './hostingDeploy';
import { savePrivateHostingConfig } from './pageRepository';

async function assertCallableAuthSession() {
  const currentUser = await ensureCallableSession(getHubAuth());
  if (!currentUser) {
    throw new Error('Debes iniciar sesión para publicar hosting.');
  }
  return currentUser;
}

function mapCallableError(error) {
  const code = error?.code ?? '';
  const message = error?.message ?? 'No se pudo completar la operación.';

  if (code === 'functions/unauthenticated') {
    return new Error('Debes iniciar sesión para publicar hosting.');
  }
  if (code === 'functions/permission-denied') {
    return new Error('Solo root o admin pueden disparar un deploy de hosting.');
  }
  if (code === 'functions/invalid-argument') {
    return new Error(message);
  }
  if (code === 'functions/failed-precondition') {
    return new Error(message);
  }
  if (code === 'functions/not-found') {
    return new Error(message.includes('página')
      ? message
      : 'Las Cloud Functions no están desplegadas. Ejecuta npm run deploy:functions en la raíz del proyecto.');
  }
  if (code === 'functions/unavailable') {
    return new Error('Las Cloud Functions no están desplegadas. Ejecuta npm run deploy:functions en la raíz del proyecto.');
  }

  return new Error(message);
}

export async function triggerHostingDeploy(pageId, formData = {}) {
  try {
    await assertCallableAuthSession();
    // Persist deploy hook to private/hosting before the callable reads it.
    await savePrivateHostingConfig(pageId, formData);
    const hosting = normalizeHostingDeployFields(formData);
    const callable = httpsCallable(getHubFunctions(), 'triggerHostingDeploy');
    // Deploy secrets (hook + GitHub targets) are read from private/hosting (F03/F07).
    const result = await callable({
      pageId,
      hostingProvider: hosting.hostingProvider,
      hostingPublicUrl: hosting.hostingPublicUrl,
    });
    return result.data;
  } catch (error) {
    throw mapCallableError(error);
  }
}
