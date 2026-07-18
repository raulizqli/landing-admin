import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  SITE_ACCESS_ADS_AFTER_DAYS,
  SITE_ACCESS_OFFLINE_AFTER_DAYS,
  nextUnpaidSince,
  resolveSiteAccessFromAccount,
  siteAccessShowsAds,
  siteAccessAllowsPublicView,
} from './siteAccess.js';

const DAY = 24 * 60 * 60 * 1000;

describe('siteAccess unpaid publicity policy', () => {
  it('keeps paid accounts online without ads', () => {
    const access = resolveSiteAccessFromAccount({ status: 'active' });
    assert.equal(access.stage, 'paid');
    assert.equal(access.adsEnabled, false);
    assert.equal(access.offline, false);
    assert.equal(siteAccessAllowsPublicView(access), true);
    assert.equal(siteAccessShowsAds(access), false);
  });

  it('uses grace for the first 6 unpaid months', () => {
    const now = Date.parse('2026-07-18T00:00:00.000Z');
    const unpaidSince = new Date(now - 30 * DAY).toISOString();
    const access = resolveSiteAccessFromAccount(
      { status: 'canceled', unpaidSince },
      { now },
    );
    assert.equal(access.stage, 'grace');
    assert.equal(access.adsEnabled, false);
    assert.equal(access.offline, false);
  });

  it('enables Google Ads publicity after 6 unpaid months', () => {
    const now = Date.parse('2026-07-18T00:00:00.000Z');
    const unpaidSince = new Date(now - SITE_ACCESS_ADS_AFTER_DAYS * DAY).toISOString();
    const access = resolveSiteAccessFromAccount(
      { status: 'canceled', unpaidSince },
      { now },
    );
    assert.equal(access.stage, 'ads');
    assert.equal(access.adsEnabled, true);
    assert.equal(siteAccessShowsAds(access), true);
    assert.equal(siteAccessAllowsPublicView(access), true);
  });

  it('goes offline after ads window without confirmed revenue', () => {
    const now = Date.parse('2026-07-18T00:00:00.000Z');
    const unpaidSince = new Date(now - SITE_ACCESS_OFFLINE_AFTER_DAYS * DAY).toISOString();
    const access = resolveSiteAccessFromAccount(
      { status: 'canceled', unpaidSince, monetization: { adsRevenueOk: false } },
      { now },
    );
    assert.equal(access.stage, 'offline');
    assert.equal(access.offline, true);
    assert.equal(siteAccessAllowsPublicView(access), false);
  });

  it('keeps ads online when ops confirms ad revenue', () => {
    const now = Date.parse('2026-07-18T00:00:00.000Z');
    const unpaidSince = new Date(now - SITE_ACCESS_OFFLINE_AFTER_DAYS * DAY).toISOString();
    const access = resolveSiteAccessFromAccount(
      { status: 'canceled', unpaidSince, monetization: { adsRevenueOk: true } },
      { now },
    );
    assert.equal(access.stage, 'ads');
    assert.equal(access.offline, false);
  });

  it('stamps unpaidSince once and clears it when paid again', () => {
    const now = '2026-01-01T00:00:00.000Z';
    assert.equal(nextUnpaidSince({}, 'canceled', { now }), now);
    assert.equal(
      nextUnpaidSince({ unpaidSince: '2025-06-01T00:00:00.000Z' }, 'past_due', { now }),
      '2025-06-01T00:00:00.000Z',
    );
    assert.equal(nextUnpaidSince({ unpaidSince: '2025-06-01T00:00:00.000Z' }, 'active', { now }), null);
  });
});
