import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_PRODUCTION_MARKETING_URL,
  getMarketingUrl,
  isExternalMarketingUrl,
} from './marketingUrl.js';

describe('isExternalMarketingUrl', () => {
  it('returns true when marketing origin differs from the current admin origin', () => {
    expect(
      isExternalMarketingUrl(
        'https://landing-template-9452e.web.app/?pageId=leftsidedev',
        'https://landing-admin-9452e.web.app',
      ),
    ).toBe(true);
  });

  it('returns false for same-origin marketing URLs to prevent redirect loops', () => {
    expect(
      isExternalMarketingUrl(
        'https://leftsidedev.site/?pageId=leftsidedev',
        'https://leftsidedev.site',
      ),
    ).toBe(false);

    expect(
      isExternalMarketingUrl(
        '/?pageId=leftsidedev',
        'https://leftsidedev.site',
      ),
    ).toBe(false);
  });

  it('returns false for empty marketing URLs', () => {
    expect(isExternalMarketingUrl('', 'https://example.com')).toBe(false);
  });

  it('returns true when current origin is unknown', () => {
    expect(
      isExternalMarketingUrl('https://example.com/?pageId=leftsidedev', ''),
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
    expect(getMarketingUrl()).toBe(DEFAULT_PRODUCTION_MARKETING_URL);
  });
});
