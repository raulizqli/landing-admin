import { getRoleLabel } from './permissions';

export const USERS_MODAL_PAGE_SIZE = 5;

export function pageIdsFromCmsUser(user = {}) {
  const fromList = Array.isArray(user.assignedPageIds)
    ? user.assignedPageIds.map((id) => String(id ?? '').trim()).filter(Boolean)
    : [];
  const single = String(user.pageId ?? '').trim();
  return [...new Set([...fromList, ...(single ? [single] : [])])];
}

export function formatSubscriptionLabel(user) {
  if (user?.subscriptionLabel) return user.subscriptionLabel;
  const plan = String(user?.plan ?? 'starter').trim() || 'starter';
  const status = String(user?.planStatus ?? '').trim().toLowerCase();
  if (status === 'active' || status === 'trialing') {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  }
  return `Free (${plan})`;
}

export function formatPageCount(user) {
  const fromProfile = pageIdsFromCmsUser(user).length;
  const reported = Number(user?.pageCount);
  if (Number.isFinite(reported) && reported > fromProfile) return reported;
  if (fromProfile > 0) return fromProfile;
  if (Number.isFinite(reported)) return reported;
  return 0;
}

export function formatAssignedPages(user) {
  const ids = pageIdsFromCmsUser(user);
  if (!ids.length) {
    const role = String(user?.role ?? '').trim().toLowerCase();
    if (role === 'root') return 'Todas';
    return 'Sin asignar';
  }
  if (ids.length <= 2) return ids.join(', ');
  return `${ids.slice(0, 2).join(', ')} +${ids.length - 2}`;
}

export function summarizeUserAccess(user) {
  const role = getRoleLabel(user?.role);
  const pages = formatPageCount(user);
  const plan = formatSubscriptionLabel(user);
  return { role, pages, plan };
}
