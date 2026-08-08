import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PROD_DEFAULT_LANDING_BASE_URL,
  getDefaultMarketingShowcaseUrl,
  getLandingBaseUrl,
} from './landingBaseUrl';

describe('landingBaseUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses prod default when env is unset', () => {
    vi.stubEnv('VITE_TEMPLATE_PREVIEW_URL', '');
    vi.stubEnv('DEV', false);
    expect(getLandingBaseUrl()).toBe(PROD_DEFAULT_LANDING_BASE_URL);
  });

  it('prefers VITE_TEMPLATE_PREVIEW_URL when set', () => {
    vi.stubEnv('VITE_TEMPLATE_PREVIEW_URL', 'https://us.leftsidedev.site/');
    expect(getLandingBaseUrl()).toBe('https://us.leftsidedev.site');
  });

  it('builds default marketing showcase from prod landing host', () => {
    vi.stubEnv('DEV', false);
    expect(getDefaultMarketingShowcaseUrl()).toBe(
      `${PROD_DEFAULT_LANDING_BASE_URL}/?pageId=leftsidedev`,
    );
  });
});
