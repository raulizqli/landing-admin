import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  accountHasAddon,
  accountHasFeature,
  createEmptyBillingAccount,
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
