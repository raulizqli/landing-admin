import { describe, expect, it } from 'vitest';
import { resolvePageOpenUrl } from './pageOpenUrl';

describe('resolvePageOpenUrl', () => {
  it('prefers hostingPublicUrl', () => {
    expect(resolvePageOpenUrl({
      pageId: 'ana',
      hostingPublicUrl: 'https://ana.example.com/',
      customDomain: 'ignored.example.com',
      language: 'es',
    })).toBe('https://ana.example.com/?lang=es');
  });

  it('uses customDomain when hosting URL is missing', () => {
    expect(resolvePageOpenUrl({
      pageId: 'ana',
      customDomain: 'ana.example.com',
    })).toBe('https://ana.example.com/');
  });

  it('returns empty string without pageId', () => {
    expect(resolvePageOpenUrl({ pageId: '' })).toBe('');
  });
});
