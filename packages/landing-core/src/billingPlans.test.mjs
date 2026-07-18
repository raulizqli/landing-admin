import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  accountHasAddon,
  accountHasFeature,
  createEmptyBillingAccount,
  getSubscriptionHealth,
  normalizeBillingAddons,
  planHasFeature,
} from './billingPlans.js';

describe('billingPlans marketingSite entitlement', () => {
  it('enables marketingSite on Enterprise plan only by default', () => {
    assert.equal(planHasFeature('starter', 'marketingSite'), false);
    assert.equal(planHasFeature('pro', 'marketingSite'), false);
    assert.equal(planHasFeature('agency', 'marketingSite'), false);
    assert.equal(planHasFeature('enterprise', 'marketingSite'), true);
  });

  it('normalizes addons to known keys', () => {
    assert.deepEqual(
      normalizeBillingAddons({ marketingSite: true, unknown: true }),
      { marketingSite: true },
    );
    assert.deepEqual(normalizeBillingAddons({ marketingSite: false }), {});
  });

  it('grants marketingSite via Agency add-on when account is active', () => {
    const account = createEmptyBillingAccount({
      plan: 'agency',
      status: 'active',
      addons: { marketingSite: true },
    });
    assert.equal(accountHasAddon(account, 'marketingSite'), true);
    assert.equal(accountHasFeature(account, 'marketingSite'), true);
  });

  it('denies marketingSite on Agency without add-on', () => {
    const account = createEmptyBillingAccount({
      plan: 'agency',
      status: 'active',
    });
    assert.equal(accountHasFeature(account, 'marketingSite'), false);
  });

  it('denies add-on features when subscription is inactive', () => {
    const account = createEmptyBillingAccount({
      plan: 'agency',
      status: 'canceled',
      addons: { marketingSite: true },
    });
    assert.equal(accountHasFeature(account, 'marketingSite'), false);
    assert.equal(accountHasFeature(account, 'basicSections'), true);
  });

  it('honors root bypass', () => {
    const account = createEmptyBillingAccount({ plan: 'starter', status: 'incomplete' });
    assert.equal(accountHasFeature(account, 'marketingSite', { bypass: true }), true);
  });
});

describe('getSubscriptionHealth free-tier after lapse', () => {
  it('confirms paid Agency subscription as ok', () => {
    const account = createEmptyBillingAccount({
      plan: 'agency',
      status: 'active',
      pageIds: ['a', 'b', 'c'],
      currentPeriodEnd: '2026-08-18T00:00:00.000Z',
    });
    const health = getSubscriptionHealth(account);
    assert.equal(health.state, 'ok');
    assert.equal(health.paid, true);
    assert.equal(health.freeTier, false);
    assert.equal(health.pageCount, 3);
    assert.equal(health.canCreatePages, true);
  });

  it('keeps pages but free-tier CMS when Agency payment stops', () => {
    const account = createEmptyBillingAccount({
      plan: 'agency',
      status: 'canceled',
      pageIds: ['a', 'b', 'c'],
      addons: { marketingSite: true },
    });
    const health = getSubscriptionHealth(account);
    assert.equal(health.state, 'canceled');
    assert.equal(health.paid, false);
    assert.equal(health.freeTier, true);
    assert.equal(health.pageCount, 3);
    assert.equal(health.canCreatePages, false);
    assert.equal(health.canEditExistingBasics, true);
    assert.equal(accountHasFeature(account, 'externalFirebase'), false);
    assert.equal(accountHasFeature(account, 'marketingSite'), false);
    assert.equal(accountHasFeature(account, 'basicSections'), true);
  });

  it('marks past_due as unpaid free-tier with warning state', () => {
    const account = createEmptyBillingAccount({
      plan: 'agency',
      status: 'past_due',
      pageIds: ['a'],
    });
    const health = getSubscriptionHealth(account);
    assert.equal(health.state, 'past_due');
    assert.equal(health.paid, false);
    assert.equal(health.freeTier, true);
  });
});
