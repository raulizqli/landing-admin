import { describe, expect, it } from 'vitest';
import * as core from './index.js';
import { hydratePageForm, normalizePageData } from './pageModel.js';
import {
  accountHasFeature,
  canAccountCreatePage,
  normalizeBillingPlanId,
} from './billingPlans.js';

describe('landing-core smoke', () => {
  it('exports critical page model helpers from the package barrel', () => {
    expect(typeof core.normalizePageData).toBe('function');
    expect(typeof core.hydratePageForm).toBe('function');
    expect(typeof core.resolvePageLanguage).toBe('function');
    expect(typeof core.splitPageSavePayload).toBe('function');
    expect(typeof core.normalizeHostname).toBe('function');
  });

  it('can normalize and hydrate a minimal page without throwing', () => {
    const page = hydratePageForm({ name: 'Smoke' });
    expect(page.name).toBe('Smoke');
    expect(normalizePageData(page).enabledLanguages.length).toBeGreaterThanOrEqual(1);
  });

  it('can evaluate billing entitlements without throwing', () => {
    expect(normalizeBillingPlanId('pro')).toBe('pro');
    expect(accountHasFeature({ plan: 'pro', status: 'active' }, 'blog')).toBe(true);
    expect(canAccountCreatePage({ plan: 'starter', status: 'active' }, 0)).toBe(true);
  });
});
