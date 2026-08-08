import { httpsCallable } from 'firebase/functions';
import { ensureCallableSession } from './appCheck';
import { getHubAuth, getHubFunctions } from './firebaseClients';

async function assertCallableAuthSession() {
  return ensureCallableSession(getHubAuth());
}

function mapError(error) {
  const code = error?.code ?? '';
  const details = typeof error?.details === 'string' ? error.details.trim() : '';
  const message = String(error?.message ?? '').trim() || 'No se pudo completar la operación.';
  const text = details || message;
  if (code === 'functions/unauthenticated' || code === 'app-check/token-error') {
    return new Error(error?.message || 'Debes iniciar sesión.');
  }
  if (code === 'functions/permission-denied') {
    return new Error(text || 'No tienes permiso.');
  }
  return new Error(text);
}

export async function recordPageAuditRemote({ pageId, before, action = 'page_update', notify = true }) {
  try {
    await assertCallableAuthSession();
    const callable = httpsCallable(getHubFunctions(), 'recordPageAudit');
    const result = await callable({ pageId, before, action, notify });
    return result.data;
  } catch (error) {
    throw mapError(error);
  }
}

export async function listPageAuditsRemote({ pageId, limit = 30 } = {}) {
  try {
    await assertCallableAuthSession();
    const callable = httpsCallable(getHubFunctions(), 'listPageAudits');
    const result = await callable({ pageId, limit });
    return result.data?.audits || [];
  } catch (error) {
    throw mapError(error);
  }
}

export async function listMyNotificationsRemote({ limit = 40, status = '' } = {}) {
  try {
    await assertCallableAuthSession();
    const callable = httpsCallable(getHubFunctions(), 'listMyNotifications');
    const result = await callable({ limit, status: status || undefined });
    return result.data || { notifications: [], unreadCount: 0 };
  } catch (error) {
    throw mapError(error);
  }
}

export async function markNotificationReadRemote(notificationId) {
  try {
    await assertCallableAuthSession();
    const callable = httpsCallable(getHubFunctions(), 'markNotificationRead');
    const result = await callable({ notificationId });
    return result.data;
  } catch (error) {
    throw mapError(error);
  }
}

export async function markAllNotificationsReadRemote() {
  try {
    await assertCallableAuthSession();
    const callable = httpsCallable(getHubFunctions(), 'markAllNotificationsRead');
    const result = await callable({});
    return result.data;
  } catch (error) {
    throw mapError(error);
  }
}

export async function createCmsTicketRemote(payload) {
  try {
    await assertCallableAuthSession();
    const callable = httpsCallable(getHubFunctions(), 'createCmsTicket');
    const result = await callable(payload);
    return result.data;
  } catch (error) {
    throw mapError(error);
  }
}

export async function updateCmsTicketRemote(payload) {
  try {
    await assertCallableAuthSession();
    const callable = httpsCallable(getHubFunctions(), 'updateCmsTicket');
    const result = await callable(payload);
    return result.data;
  } catch (error) {
    throw mapError(error);
  }
}

export async function listCmsTicketsRemote(payload = {}) {
  try {
    await assertCallableAuthSession();
    const callable = httpsCallable(getHubFunctions(), 'listCmsTickets');
    const result = await callable(payload);
    return result.data?.tickets || [];
  } catch (error) {
    throw mapError(error);
  }
}

export async function reportSystemIncidentRemote(payload) {
  try {
    await assertCallableAuthSession();
    const callable = httpsCallable(getHubFunctions(), 'reportSystemIncident');
    const result = await callable(payload);
    return result.data;
  } catch (error) {
    throw mapError(error);
  }
}
