import { beforeEach, describe, expect, it, vi } from 'vitest';

const getHubDb = vi.fn(() => ({ name: 'hub-db' }));
const lookupPageRouteByDomain = vi.fn();

vi.mock('./firebaseClients', () => ({
  getHubDb: (...args) => getHubDb(...args),
}));

vi.mock('./firestoreAccess', () => ({
  findPageRouteByDomain: (...args) => lookupPageRouteByDomain(...args),
}));

const {
  getPageIdFromSearchParams,
  resolveContentTarget,
  resolvePageContext,
} = await import('./domainRouting.js');

describe('getPageIdFromSearchParams', () => {
  it('prefers pageId over legacy paginaId', () => {
    const params = new URLSearchParams('pageId=modern&paginaId=legacy');
    expect(getPageIdFromSearchParams(params)).toBe('modern');
  });

  it('supports legacy paginaId', () => {
    const params = new URLSearchParams('paginaId=legacy');
    expect(getPageIdFromSearchParams(params)).toBe('legacy');
  });

  it('returns empty string when neither query param is present', () => {
    expect(getPageIdFromSearchParams(new URLSearchParams())).toBe('');
  });
});

describe('resolvePageContext', () => {
  beforeEach(() => {
    getHubDb.mockClear();
    lookupPageRouteByDomain.mockReset();
  });

  it('returns query pageId ahead of env and domain', async () => {
    const context = await resolvePageContext({
      searchParams: new URLSearchParams('pageId=from-query'),
      envPageId: 'from-env',
      hostname: 'client.example.com',
      isDev: false,
    });

    expect(context).toEqual({
      pageId: 'from-query',
      source: 'query',
      routeData: null,
    });
    expect(lookupPageRouteByDomain).not.toHaveBeenCalled();
  });

  it('falls back to VITE_PAGINA_ID / envPageId when no query or domain match', async () => {
    lookupPageRouteByDomain.mockResolvedValue(null);

    const context = await resolvePageContext({
      searchParams: new URLSearchParams(),
      envPageId: 'leftsidedev',
      hostname: 'landing-template-9452e.web.app',
      isDev: false,
    });

    expect(context).toEqual({
      pageId: 'leftsidedev',
      source: 'env',
      routeData: null,
    });
  });

  it('resolves from custom domain when not in dev/local', async () => {
    lookupPageRouteByDomain.mockResolvedValue({
      pageId: 'dra-ana',
      routeData: {
        name: 'Ana',
        customDomain: 'ana.example.com',
        useExternalFirebase: false,
      },
    });

    const context = await resolvePageContext({
      searchParams: new URLSearchParams(),
      envPageId: 'fallback',
      hostname: 'www.ana.example.com',
      isDev: false,
    });

    expect(lookupPageRouteByDomain).toHaveBeenCalledWith(
      { name: 'hub-db' },
      'ana.example.com',
    );
    expect(context.pageId).toBe('dra-ana');
    expect(context.source).toBe('domain');
    expect(context.routeData.name).toBe('Ana');
    expect(context.routeData.customDomain).toBe('ana.example.com');
  });

  it('skips domain lookup in development and uses env', async () => {
    const context = await resolvePageContext({
      searchParams: new URLSearchParams(),
      envPageId: 'dev-page',
      hostname: 'client.example.com',
      isDev: true,
    });

    expect(lookupPageRouteByDomain).not.toHaveBeenCalled();
    expect(context).toEqual({
      pageId: 'dev-page',
      source: 'env',
      routeData: null,
    });
  });

  it('returns null when query, domain, and env are all empty', async () => {
    lookupPageRouteByDomain.mockResolvedValue(null);

    const context = await resolvePageContext({
      searchParams: new URLSearchParams(),
      envPageId: '',
      hostname: 'orphan.web.app',
      isDev: false,
    });

    expect(context).toBeNull();
  });
});

describe('resolveContentTarget', () => {
  it('detects external Firebase routing', () => {
    const externalFirebase = {
      apiKey: 'key',
      authDomain: 'x.firebaseapp.com',
      projectId: 'x',
      appId: '1:x:web:y',
    };
    expect(resolveContentTarget({
      useExternalFirebase: true,
      externalFirebase,
    })).toEqual({
      useExternalFirebase: true,
      externalFirebase,
    });
  });

  it('returns hub target otherwise', () => {
    expect(resolveContentTarget({ useExternalFirebase: false })).toEqual({
      useExternalFirebase: false,
      externalFirebase: null,
    });
  });
});

