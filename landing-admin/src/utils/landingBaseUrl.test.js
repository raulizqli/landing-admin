import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PROD_DEFAULT_LANDING_BASE_URL,
  PROD_DEFAULT_MARKETING_URL,
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
    vi.stubEnv('VITE_TEMPLATE_PREVIEW_URL', 'https://web.toqua.site/');
    expect(getLandingBaseUrl()).toBe('https://web.toqua.site');
  });

  it('uses the Toqua marketing site as the prod default showcase', () => {
    vi.stubEnv('DEV', false);
    expect(getDefaultMarketingShowcaseUrl()).toBe(PROD_DEFAULT_MARKETING_URL);
    expect(PROD_DEFAULT_MARKETING_URL).toBe('https://toqua.site');
  });
});
