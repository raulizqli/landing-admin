import { describe, expect, it } from 'vitest';
import { PROD_DEFAULT_LANDING_BASE_URL } from './utils/landingBaseUrl.js';
import { getRootPublicUrl, isExternalPublicUrl } from './utils/marketingUrl.js';

describe('landing-admin smoke', () => {
  it('loads public URL helpers used by guest redirects', () => {
    expect(typeof getRootPublicUrl).toBe('function');
    expect(typeof isExternalPublicUrl).toBe('function');
    expect(
      isExternalPublicUrl(
        `${PROD_DEFAULT_LANDING_BASE_URL}/?pageId=leftsidedev`,
        'https://admin.leftsidedev.site',
      ),
    ).toBe(true);
  });

  it('loads page repository module exports', async () => {
    const repo = await import('./utils/pageRepository.js');
    expect(typeof repo.savePageFromEditor).toBe('function');
    expect(typeof repo.loadPageForEditor).toBe('function');
    expect(typeof repo.createPageInHub).toBe('function');
  });

  it('exposes createCmsPage and Meta import remote helpers', async () => {
    const ai = await import('./utils/aiAssistFunctions.js');
    expect(typeof ai.createCmsPageRemote).toBe('function');
    expect(typeof ai.importMetaBusinessProfileRemote).toBe('function');
  });

  it('exposes public legal URLs for Meta and future providers', async () => {
    const legal = await import('./utils/platformLegal.js');
    expect(legal.PLATFORM_LEGAL_PATHS.privacy).toBe('/privacy');
    expect(legal.PLATFORM_LEGAL_PATHS.terms).toBe('/terms');
    expect(legal.PLATFORM_LEGAL_PATHS.dataDeletion).toBe('/data-deletion');
    expect(legal.isPublicLegalPath('/privacy')).toBe(true);
    expect(legal.isPublicLegalPath('/login')).toBe(false);
    expect(legal.getPlatformLegalUrls('https://admin.leftsidedev.site').dataDeletion)
      .toBe('https://admin.leftsidedev.site/data-deletion');
  });
});
