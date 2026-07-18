import { describe, expect, it } from 'vitest';
import {
  accountHasFeature,
  canAccountCreatePage,
  createEmptyBillingAccount,
  isBillingAccountActive,
  normalizeBillingPlanId,
} from './billingPlans.js';

describe('normalizeBillingPlanId', () => {
  it('clamps unknown plans to starter', () => {
    expect(normalizeBillingPlanId('pro')).toBe('pro');
    expect(normalizeBillingPlanId('PRO')).toBe('pro');
    expect(normalizeBillingPlanId('unknown')).toBe('starter');
    expect(normalizeBillingPlanId(null)).toBe('starter');
  });
});

describe('isBillingAccountActive', () => {
  it('treats active and trialing as active', () => {
    expect(isBillingAccountActive({ status: 'active' })).toBe(true);
    expect(isBillingAccountActive({ status: 'trialing' })).toBe(true);
    expect(isBillingAccountActive({ status: 'past_due' })).toBe(false);
    expect(isBillingAccountActive({ status: 'canceled' })).toBe(false);
  });
});

describe('accountHasFeature', () => {
  it('honors plan features when account is active', () => {
    const account = createEmptyBillingAccount({ plan: 'starter', status: 'active' });
    expect(accountHasFeature(account, 'basicSections')).toBe(true);
    expect(accountHasFeature(account, 'blog')).toBe(false);
  });

  it('allows only basicSections when past_due', () => {
    const account = createEmptyBillingAccount({ plan: 'pro', status: 'past_due' });
    expect(accountHasFeature(account, 'basicSections')).toBe(true);
    expect(accountHasFeature(account, 'blog')).toBe(false);
  });

  it('bypasses entitlement checks when requested', () => {
    const account = createEmptyBillingAccount({ plan: 'starter', status: 'incomplete' });
    expect(accountHasFeature(account, 'blog', { bypass: true })).toBe(true);
  });
});

describe('canAccountCreatePage', () => {
  it('enforces page limits for active accounts', () => {
    const starter = createEmptyBillingAccount({ plan: 'starter', status: 'active' });
    expect(canAccountCreatePage(starter, 0)).toBe(true);
    expect(canAccountCreatePage(starter, 1)).toBe(false);

    const agency = createEmptyBillingAccount({ plan: 'agency', status: 'active' });
    expect(canAccountCreatePage(agency, 4)).toBe(true);
    expect(canAccountCreatePage(agency, 5)).toBe(false);
  });

  it('blocks create when account is not active', () => {
    const account = createEmptyBillingAccount({ plan: 'agency', status: 'incomplete' });
    expect(canAccountCreatePage(account, 0)).toBe(false);
  });
});
