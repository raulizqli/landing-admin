import { afterEach, describe, expect, it, vi } from 'vitest';
import { PROD_DEFAULT_LANDING_BASE_URL, PROD_DEFAULT_MARKETING_URL } from './landingBaseUrl.js';
import {
  getCorporateSiteUrl,
  getMarketingUrl,
  getRootPublicUrl,
  isExternalPublicUrl,
} from './marketingUrl.js';

describe('isExternalPublicUrl', () => {
  it('returns true when public origin differs from the current admin origin', () => {
    expect(
      isExternalPublicUrl(
        `${PROD_DEFAULT_LANDING_BASE_URL}/?pageId=leftsidedev`,
        'https://admin.toqua.site',
      ),
    ).toBe(true);
  });

  it('returns false for same-origin public URLs to prevent redirect loops', () => {
    expect(
      isExternalPublicUrl(
        'https://admin.toqua.site/?pageId=leftsidedev',
        'https://admin.toqua.site',
      ),
    ).toBe(false);

    expect(
      isExternalPublicUrl(
        '/?pageId=leftsidedev',
        'https://admin.toqua.site',
      ),
    ).toBe(false);
  });

  it('returns false for empty public URLs', () => {
    expect(isExternalPublicUrl('', 'https://example.com')).toBe(false);
  });

  it('returns true when current origin is unknown', () => {
    expect(
      isExternalPublicUrl('https://example.com/?pageId=leftsidedev', ''),
    ).toBe(true);
  });
});

describe('getMarketingUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers VITE_MARKETING_URL when set', () => {
    vi.stubEnv('VITE_MARKETING_URL', 'https://example.com/sales/');
    expect(getMarketingUrl()).toBe('https://example.com/sales');
  });

  it('keeps query strings when normalizing trailing slashes', () => {
    vi.stubEnv('VITE_MARKETING_URL', 'https://example.com/?pageId=leftsidedev');
    expect(getMarketingUrl()).toBe('https://example.com/?pageId=leftsidedev');
  });

  it('falls back to the production default outside DEV when unset', () => {
    vi.stubEnv('VITE_MARKETING_URL', '');
    vi.stubEnv('DEV', false);
    expect(getMarketingUrl()).toBe(PROD_DEFAULT_MARKETING_URL);
  });
});

describe('getRootPublicUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers corporate site when configured', () => {
    vi.stubEnv('VITE_CORPORATE_SITE_URL', 'http://localhost:5175/');
    vi.stubEnv('VITE_MARKETING_URL', 'http://localhost:5174/?pageId=leftsidedev');
    expect(getCorporateSiteUrl()).toBe('http://localhost:5175');
    expect(getRootPublicUrl()).toBe('http://localhost:5175');
  });

  it('falls back to marketing/template when corporate is unset', () => {
    vi.stubEnv('VITE_CORPORATE_SITE_URL', '');
    vi.stubEnv('VITE_MARKETING_URL', 'http://localhost:5174/?pageId=leftsidedev');
    expect(getCorporateSiteUrl()).toBe('');
    expect(getRootPublicUrl()).toBe('http://localhost:5174/?pageId=leftsidedev');
  });
});
