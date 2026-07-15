export const ROLES = {
  ROOT: 'root',
  ADMIN: 'admin',
  USER: 'user',
};

const VALID_ROLES = new Set(Object.values(ROLES));

export function normalizeRole(role) {
  const value = String(role ?? '').trim().toLowerCase();
  return VALID_ROLES.has(value) ? value : null;
}

export function normalizePageIdList(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))];
}

export function getAccessiblePageIds(profile) {
  const role = normalizeRole(profile?.role);
  if (!role) return [];

  if (role === ROLES.ROOT) return null;

  if (role === ROLES.ADMIN) {
    return normalizePageIdList(profile?.assignedPageIds);
  }

  if (role === ROLES.USER) {
    const pageId = String(profile?.pageId ?? '').trim();
    if (pageId) return [pageId];
    const fromList = normalizePageIdList(profile?.assignedPageIds);
    return fromList.length > 0 ? [fromList[0]] : [];
  }

  return [];
}

export function filterAccessiblePages(pages, profile) {
  const allowed = getAccessiblePageIds(profile);
  if (allowed === null) return pages;
  const allowedSet = new Set(allowed);
  return pages.filter((page) => allowedSet.has(page.id));
}

export function canAccessPage(profile, pageId) {
  const allowed = getAccessiblePageIds(profile);
  if (allowed === null) return true;
  return allowed.includes(String(pageId ?? '').trim());
}

export function canEditPage(profile, pageId) {
  return canAccessPage(profile, pageId);
}

export function canManageUsers(profile) {
  return normalizeRole(profile?.role) === ROLES.ROOT;
}

export function canCreatePages(profile) {
  return normalizeRole(profile?.role) === ROLES.ROOT;
}

export function canAccessHostingSettings(profile) {
  const role = normalizeRole(profile?.role);
  return role === ROLES.ROOT || role === ROLES.ADMIN;
}

/** Only root can enable/disable sections or add/remove custom blocks. */
export function canManagePageLayout(profile) {
  return normalizeRole(profile?.role) === ROLES.ROOT;
}

/** Root bypasses SaaS plan entitlements (ops / hub owner). */
export function isBillingBypass(profile) {
  return normalizeRole(profile?.role) === ROLES.ROOT;
}

export function getRoleLabel(role) {
  switch (normalizeRole(role)) {
    case ROLES.ROOT:
      return 'Root';
    case ROLES.ADMIN:
      return 'Admin';
    case ROLES.USER:
      return 'Usuario';
    default:
      return 'Sin rol';
  }
}

export function isSinglePageUser(profile) {
  return normalizeRole(profile?.role) === ROLES.USER;
}
