import { describe, expect, it } from 'vitest';
import {
  accountHasFeature,
  canAccountCreatePage,
  canOwnerSelfServeCreatePage,
  createEmptyBillingAccount,
  defaultBillingCurrencyForLocale,
  getAccountAiLogoLimit,
  getAccountLocationLimit,
  getAccountPageCount,
  getAccountQrCodeLimit,
  getBillingPlan,
  getBillingPlanPrice,
  isBillingAccountActive,
  isPageSelfServePlan,
  normalizeBillingInterval,
  normalizeBillingPlanId,
  pageIdsFromUserProfile,
  resolveAccountPageIds,
  yearlyPriceFromMonthly,
} from './billingPlans.js';

describe('annual billing (20% off)', () => {
  it('normalizes interval to month or year', () => {
    expect(normalizeBillingInterval('year')).toBe('year');
    expect(normalizeBillingInterval('YEAR')).toBe('year');
    expect(normalizeBillingInterval('month')).toBe('month');
    expect(normalizeBillingInterval('')).toBe('month');
    expect(createEmptyBillingAccount({}).billingInterval).toBe('month');
    expect(createEmptyBillingAccount({ billingInterval: 'year' }).billingInterval).toBe('year');
  });

  it('rounds yearly totals from monthly list prices', () => {
    expect(yearlyPriceFromMonthly(10)).toBe(96);
    expect(yearlyPriceFromMonthly(25)).toBe(240);
    expect(yearlyPriceFromMonthly(75)).toBe(720);
    expect(yearlyPriceFromMonthly(189)).toBe(1814);
    expect(yearlyPriceFromMonthly(469)).toBe(4502);
    expect(yearlyPriceFromMonthly(1399)).toBe(13430);
    expect(yearlyPriceFromMonthly(null)).toBe(null);
  });

  it('exposes yearly amounts on paid tiers and not on enterprise', () => {
    expect(getBillingPlanPrice(getBillingPlan('starter'), { currency: 'usd', interval: 'year' })).toBe(96);
    expect(getBillingPlanPrice(getBillingPlan('pro'), { currency: 'mxn', interval: 'year' })).toBe(4502);
    expect(getBillingPlanPrice(getBillingPlan('agency'), { currency: 'usd', interval: 'month' })).toBe(75);
    expect(getBillingPlanPrice(getBillingPlan('enterprise'), { currency: 'usd', interval: 'year' })).toBe(null);
  });
});

describe('defaultBillingCurrencyForLocale', () => {
  it('maps English to USD and Spanish to MXN', () => {
    expect(defaultBillingCurrencyForLocale('en')).toBe('usd');
    expect(defaultBillingCurrencyForLocale('EN-US')).toBe('usd');
    expect(defaultBillingCurrencyForLocale('es')).toBe('mxn');
    expect(defaultBillingCurrencyForLocale('es-MX')).toBe('mxn');
    expect(defaultBillingCurrencyForLocale('')).toBe('mxn');
  });
});

describe('getAccountLocationLimit', () => {
  it('limits free/starter to 1 and leaves Pro+ unlimited', () => {
    expect(getAccountLocationLimit({ plan: 'starter', status: 'active' })).toBe(1);
    expect(getAccountLocationLimit({ plan: 'starter', status: 'incomplete' })).toBe(1);
    expect(getAccountLocationLimit({ plan: 'pro', status: 'past_due' })).toBe(1);
    expect(getAccountLocationLimit({ plan: 'pro', status: 'active' })).toBe(null);
    expect(getAccountLocationLimit({ plan: 'agency', status: 'active' })).toBe(null);
    expect(getAccountLocationLimit({ plan: 'starter' }, { bypass: true })).toBe(null);
  });
});

describe('metaImport entitlement', () => {
  it('unlocks Facebook/Instagram import from Pro onward', () => {
    expect(accountHasFeature({ plan: 'starter', status: 'active' }, 'metaImport')).toBe(false);
    expect(accountHasFeature({ plan: 'pro', status: 'active' }, 'metaImport')).toBe(true);
    expect(accountHasFeature({ plan: 'agency', status: 'active' }, 'metaImport')).toBe(true);
    expect(accountHasFeature({ plan: 'enterprise', status: 'active' }, 'metaImport')).toBe(true);
    expect(accountHasFeature({ plan: 'pro', status: 'past_due' }, 'metaImport')).toBe(false);
  });
});

describe('videoCarousel entitlement', () => {
  it('unlocks the videos-section carousel from Pro onward', () => {
    expect(accountHasFeature({ plan: 'starter', status: 'active' }, 'videoCarousel')).toBe(false);
    expect(accountHasFeature({ plan: 'pro', status: 'active' }, 'videoCarousel')).toBe(true);
    expect(accountHasFeature({ plan: 'agency', status: 'active' }, 'videoCarousel')).toBe(true);
    expect(accountHasFeature({ plan: 'enterprise', status: 'active' }, 'videoCarousel')).toBe(true);
    expect(accountHasFeature({ plan: 'pro', status: 'past_due' }, 'videoCarousel')).toBe(false);
  });
});

describe('hostingDeploy entitlement', () => {
  it('unlocks hosting from Pro onward', () => {
    expect(accountHasFeature({ plan: 'starter', status: 'active' }, 'hostingDeploy')).toBe(false);
    expect(accountHasFeature({ plan: 'pro', status: 'active' }, 'hostingDeploy')).toBe(true);
    expect(accountHasFeature({ plan: 'agency', status: 'active' }, 'hostingDeploy')).toBe(true);
  });
});

describe('qrCodes entitlement', () => {
  it('unlocks QR codes from Pro onward', () => {
    expect(accountHasFeature({ plan: 'starter', status: 'active' }, 'qrCodes')).toBe(false);
    expect(accountHasFeature({ plan: 'pro', status: 'active' }, 'qrCodes')).toBe(true);
    expect(accountHasFeature({ plan: 'agency', status: 'active' }, 'qrCodes')).toBe(true);
    expect(accountHasFeature({ plan: 'enterprise', status: 'active' }, 'qrCodes')).toBe(true);
  });

  it('limits Pro to 2 QR codes and Agency to unlimited', () => {
    expect(getAccountQrCodeLimit({ plan: 'starter', status: 'active' })).toBe(0);
    expect(getAccountQrCodeLimit({ plan: 'pro', status: 'active' })).toBe(2);
    expect(getAccountQrCodeLimit({ plan: 'agency', status: 'active' })).toBe(null);
    expect(getAccountQrCodeLimit({ plan: 'enterprise', status: 'active' })).toBe(null);
    expect(getAccountQrCodeLimit({ plan: 'pro', status: 'past_due' })).toBe(0);
    expect(getAccountQrCodeLimit({ plan: 'pro' }, { bypass: true })).toBe(null);
  });
});

describe('imageUpload and AI logo limits', () => {
  it('gates uploads to Pro+', () => {
    expect(accountHasFeature({ plan: 'starter', status: 'active' }, 'imageUpload')).toBe(false);
    expect(accountHasFeature({ plan: 'pro', status: 'active' }, 'imageUpload')).toBe(true);
  });

  it('limits Pro logos to 3 and Agency to unlimited', () => {
    expect(getAccountAiLogoLimit({ plan: 'starter', status: 'active' })).toBe(0);
    expect(getAccountAiLogoLimit({ plan: 'pro', status: 'active' })).toBe(3);
    expect(getAccountAiLogoLimit({ plan: 'agency', status: 'active' })).toBe(null);
    expect(getAccountAiLogoLimit({ plan: 'pro' }, { bypass: true })).toBe(null);
  });
});

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

describe('resolveAccountPageIds', () => {
  it('merges billing pageIds with profile assignments', () => {
    const account = createEmptyBillingAccount({
      plan: 'pro',
      status: 'active',
      pageIds: [],
    });
    expect(getAccountPageCount(account, { extraPageIds: ['clinica-a'] })).toBe(1);
    expect(resolveAccountPageIds(account, ['clinica-a', 'clinica-a'])).toEqual(['clinica-a']);
    expect(pageIdsFromUserProfile({
      assignedPageIds: ['a'],
      pageId: 'b',
    })).toEqual(['a', 'b']);
  });
});

describe('canOwnerSelfServeCreatePage', () => {
  it('allows only Pro/Agency owners under pageLimit', () => {
    expect(isPageSelfServePlan('pro')).toBe(true);
    expect(isPageSelfServePlan('starter')).toBe(false);

    const agency = createEmptyBillingAccount({ plan: 'agency', status: 'active' });
    expect(canOwnerSelfServeCreatePage(agency, 4, { isOwner: true })).toBe(true);
    expect(canOwnerSelfServeCreatePage(agency, 5, { isOwner: true })).toBe(false);
    expect(canOwnerSelfServeCreatePage(agency, 0, { isOwner: false })).toBe(false);

    const starter = createEmptyBillingAccount({ plan: 'starter', status: 'active' });
    expect(canOwnerSelfServeCreatePage(starter, 0, { isOwner: true })).toBe(false);

    expect(canOwnerSelfServeCreatePage(starter, 0, { isOwner: false, bypass: true })).toBe(true);
  });
});
