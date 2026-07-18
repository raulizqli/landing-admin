import { describe, expect, it } from 'vitest';
import { isExternalMarketingUrl, getMarketingUrl } from './utils/marketingUrl.js';

describe('landing-admin smoke', () => {
  it('loads marketing URL helpers used by guest redirects', () => {
    expect(typeof getMarketingUrl).toBe('function');
    expect(typeof isExternalMarketingUrl).toBe('function');
    expect(
      isExternalMarketingUrl(
        'https://landing-template-9452e.web.app/?pageId=leftsidedev',
        'https://landing-admin-9452e.web.app',
      ),
    ).toBe(true);
  });

  it('loads page repository module exports', async () => {
    const repo = await import('./utils/pageRepository.js');
    expect(typeof repo.savePageFromEditor).toBe('function');
    expect(typeof repo.loadPageForEditor).toBe('function');
    expect(typeof repo.createPageInHub).toBe('function');
  });
});
