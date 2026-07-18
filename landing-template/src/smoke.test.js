import { describe, expect, it } from 'vitest';
import {
  getPageIdFromSearchParams,
  resolvePageContext,
} from './utils/domainRouting.js';

describe('landing-template smoke', () => {
  it('loads domain routing helpers', () => {
    expect(typeof getPageIdFromSearchParams).toBe('function');
    expect(typeof resolvePageContext).toBe('function');
    expect(getPageIdFromSearchParams(new URLSearchParams('pageId=smoke'))).toBe('smoke');
  });

  it('loads page content helper exports', async () => {
    const pageContent = await import('./utils/pageContent.js');
    expect(typeof pageContent.fetchPageContent).toBe('function');
  });

  it('resolves env fallback without Firestore when query is empty in dev', async () => {
    const context = await resolvePageContext({
      searchParams: new URLSearchParams(),
      envPageId: 'leftsidedev',
      hostname: 'localhost',
      isDev: true,
    });
    expect(context).toEqual({
      pageId: 'leftsidedev',
      source: 'env',
      routeData: null,
    });
  });
});
