import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LEGAL_CONTACT_EMAIL,
  PLATFORM_LEGAL_KINDS,
  PLATFORM_LEGAL_PATHS,
  getPlatformLegalDocument,
  getPlatformLegalUrls,
  isPublicLegalPath,
  normalizePlatformLegalKind,
} from './platformLegal.js';

describe('platformLegal', () => {
  it('exposes public paths for privacy, terms, and app deletion', () => {
    expect(PLATFORM_LEGAL_PATHS).toEqual({
      privacy: '/privacy',
      terms: '/terms',
      dataDeletion: '/data-deletion',
    });
    expect(PLATFORM_LEGAL_KINDS).toEqual(['privacy', 'terms', 'dataDeletion']);
  });

  it('builds absolute URLs from an admin origin', () => {
    expect(getPlatformLegalUrls('https://admin.leftsidedev.site/')).toEqual({
      privacy: 'https://admin.leftsidedev.site/privacy',
      terms: 'https://admin.leftsidedev.site/terms',
      dataDeletion: 'https://admin.leftsidedev.site/data-deletion',
    });
  });

  it('returns es and en documents with sections for each kind', () => {
    for (const kind of PLATFORM_LEGAL_KINDS) {
      for (const locale of ['es', 'en']) {
        const doc = getPlatformLegalDocument(kind, locale, { email: 'legal@example.com' });
        expect(doc.kind).toBe(kind);
        expect(doc.path).toBe(PLATFORM_LEGAL_PATHS[kind]);
        expect(doc.title).toMatch(/\S/);
        expect(doc.sections.length).toBeGreaterThan(1);
        expect(doc.email).toBe('legal@example.com');
        const body = doc.sections.flatMap((section) => section.paragraphs).join(' ');
        expect(body).toContain('legal@example.com');
        expect(body.toLowerCase()).toMatch(/facebook|meta/);
      }
    }
  });

  it('treats legal documents as public paths (no login)', () => {
    expect(isPublicLegalPath('/privacy')).toBe(true);
    expect(isPublicLegalPath('/privacy/')).toBe(true);
    expect(isPublicLegalPath('/terms?ref=meta')).toBe(true);
    expect(isPublicLegalPath('/data-deletion')).toBe(true);
    expect(isPublicLegalPath('/login')).toBe(false);
    expect(isPublicLegalPath('/app')).toBe(false);
    expect(isPublicLegalPath('/')).toBe(false);
  });

  it('falls back to the default contact email and privacy kind', () => {
    expect(getPlatformLegalDocument('unknown', 'es').kind).toBe('privacy');
    expect(normalizePlatformLegalKind('terms')).toBe('terms');
    expect(getPlatformLegalDocument('privacy', 'es').email).toBe(DEFAULT_LEGAL_CONTACT_EMAIL);
  });
});
