import { describe, expect, it } from 'vitest';
import {
  canCreatePages,
  canManagePageLayout,
  isBillingAccountOwner,
} from './permissions.js';

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
