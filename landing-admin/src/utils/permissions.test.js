import { describe, expect, it } from 'vitest';
import {
  canAccessPage,
  canCreatePages,
  canManagePageLayout,
  getAccessiblePageIds,
  isBillingAccountOwner,
} from './permissions.js';

describe('getAccessiblePageIds', () => {
  it('returns all assigned pages for Agency-style user owners', () => {
    expect(getAccessiblePageIds({
      role: 'user',
      pageId: 'first',
      assignedPageIds: ['first', 'second', 'third'],
    })).toEqual(['first', 'second', 'third']);
  });

  it('falls back to assignedPageIds when pageId is empty', () => {
    expect(getAccessiblePageIds({
      role: 'user',
      pageId: '',
      assignedPageIds: ['solo'],
    })).toEqual(['solo']);
  });

  it('allows canAccessPage for any assigned page', () => {
    const profile = { role: 'user', pageId: 'a', assignedPageIds: ['a', 'b'] };
    expect(canAccessPage(profile, 'b')).toBe(true);
    expect(canAccessPage(profile, 'c')).toBe(false);
  });
});

describe('isSinglePageUser', () => {
  it('hides multi-page list only when the user has at most one page', async () => {
    const { isSinglePageUser } = await import('./permissions.js');
    expect(isSinglePageUser({ role: 'user', pageId: 'a', assignedPageIds: ['a'] })).toBe(true);
    expect(isSinglePageUser({ role: 'user', pageId: 'a', assignedPageIds: ['a', 'b'] })).toBe(false);
    expect(isSinglePageUser({ role: 'admin', assignedPageIds: ['a'] })).toBe(false);
  });
});

describe('isBillingAccountOwner', () => {
  it('treats accountId defaulting to uid as owner', () => {
    expect(isBillingAccountOwner({ accountId: 'uid-1' }, 'uid-1')).toBe(true);
    expect(isBillingAccountOwner({}, 'uid-1')).toBe(true);
    expect(isBillingAccountOwner({ accountId: 'other' }, 'uid-1')).toBe(false);
  });
});

describe('canCreatePages', () => {
  it('allows root always', () => {
    expect(canCreatePages({ role: 'root' })).toBe(true);
  });

  it('allows Pro/Agency owners via entitlements', () => {
    const profile = { role: 'admin', accountId: 'owner-1' };
    const user = { uid: 'owner-1' };
    expect(canCreatePages(profile, {
      user,
      entitlements: { canOwnerCreatePages: true },
    })).toBe(true);
    expect(canCreatePages(profile, {
      user,
      entitlements: { canOwnerCreatePages: false },
    })).toBe(false);
    expect(canCreatePages(profile, {
      user: { uid: 'other' },
      entitlements: { canOwnerCreatePages: true },
    })).toBe(false);
  });
});

describe('canManagePageLayout', () => {
  it('allows root and Pro/Agency owners', () => {
    expect(canManagePageLayout({ role: 'root' })).toBe(true);
    expect(canManagePageLayout(
      { role: 'admin', accountId: 'owner-1' },
      { user: { uid: 'owner-1' }, entitlements: { planId: 'agency' } },
    )).toBe(true);
    expect(canManagePageLayout(
      { role: 'admin', accountId: 'owner-1' },
      { user: { uid: 'owner-1' }, entitlements: { planId: 'starter' } },
    )).toBe(false);
  });
});
