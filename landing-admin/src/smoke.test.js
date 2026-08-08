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

  it('exposes createCmsPage remote helper', async () => {
    const ai = await import('./utils/aiAssistFunctions.js');
    expect(typeof ai.createCmsPageRemote).toBe('function');
  });
});
