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
    // Agency/Pro owners may hold several pages in assignedPageIds; pageId is the primary.
    const primary = String(profile?.pageId ?? '').trim();
    const fromList = normalizePageIdList(profile?.assignedPageIds);
    return normalizePageIdList(primary ? [primary, ...fromList] : fromList);
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

/** Inbox / tickets module: root, admin, or billing account owner. */
export function canUseCmsInbox(profile, uid) {
  const role = normalizeRole(profile?.role);
  if (role === ROLES.ROOT || role === ROLES.ADMIN) return true;
  return isBillingAccountOwner(profile, uid);
}

/** Create/list CMS tickets: root or admin. */
export function canManageCmsTickets(profile) {
  const role = normalizeRole(profile?.role);
  return role === ROLES.ROOT || role === ROLES.ADMIN;
}

/**
 * Billing account owner = accountId defaults to uid (owner's Firebase uid).
 */
export function isBillingAccountOwner(profile, uid) {
  const userId = String(uid ?? '').trim();
  if (!userId) return false;
  const accountId = String(profile?.accountId || userId).trim();
  return accountId === userId;
}

/**
 * Root always can create. Pro/Agency account owners can create within pageLimit.
 * Pass entitlements from useEntitlements() when available.
 */
export function canCreatePages(profile, { user, entitlements } = {}) {
  if (normalizeRole(profile?.role) === ROLES.ROOT) return true;
  if (!entitlements) return false;
  if (!isBillingAccountOwner(profile, user?.uid)) return false;
  return entitlements.canOwnerCreatePages === true;
}

export function canAccessHostingSettings(profile) {
  const role = normalizeRole(profile?.role);
  return role === ROLES.ROOT || role === ROLES.ADMIN;
}

/**
 * Root or Pro/Agency account owners can manage section layout
 * (needed so structure AI apply persists on save).
 */
export function canManagePageLayout(profile, { user, billingAccount, entitlements } = {}) {
  if (normalizeRole(profile?.role) === ROLES.ROOT) return true;
  if (!isBillingAccountOwner(profile, user?.uid)) return false;
  const planId = String(
    entitlements?.planId
    || billingAccount?.plan
    || '',
  ).trim().toLowerCase();
  return planId === 'pro' || planId === 'agency';
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
  if (normalizeRole(profile?.role) !== ROLES.USER) return false;
  // Agency owners (role user) with multiple assigned pages need the sidebar list.
  return getAccessiblePageIds(profile).length <= 1;
}

/**
 * Root and multi-page actors (Agency owners, admins) can use /app/pages overview.
 * Single-page users stay on the editor shell.
 */
export function canViewPagesOverview(profile) {
  if (canManageUsers(profile)) return true;
  if (!normalizeRole(profile?.role)) return false;
  return !isSinglePageUser(profile);
}
