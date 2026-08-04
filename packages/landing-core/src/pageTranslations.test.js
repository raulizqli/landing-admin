import { describe, expect, it } from 'vitest';
import {
  normalizeEnabledLanguages,
  normalizePageLanguage,
  resolvePageLanguage,
  updatePageTranslation,
} from './pageTranslations.js';

describe('normalizePageLanguage', () => {
  it('accepts es and en only', () => {
    expect(normalizePageLanguage('es')).toBe('es');
    expect(normalizePageLanguage('en')).toBe('en');
    expect(normalizePageLanguage('fr')).toBe('es');
    expect(normalizePageLanguage('fr', 'en')).toBe('en');
  });
});

describe('normalizeEnabledLanguages', () => {
  it('always includes the default language and dedupes', () => {
    expect(normalizeEnabledLanguages(['en', 'en'], 'es')).toEqual(['es', 'en']);
    expect(normalizeEnabledLanguages([], 'en')).toEqual(['en']);
    expect(normalizeEnabledLanguages(null, 'es')).toEqual(['es']);
  });

  it('requires at least one enabled language', () => {
    const languages = normalizeEnabledLanguages(['xx'], 'es');
    expect(languages.length).toBeGreaterThanOrEqual(1);
    expect(languages).toContain('es');
  });
});

describe('resolvePageLanguage', () => {
  it('merges active translation text onto the page for display', () => {
    const page = {
      name: 'Ana',
      aboutTagline: 'Hola',
      defaultLanguage: 'es',
      enabledLanguages: ['es', 'en'],
      translations: {
        es: { aboutTagline: 'Hola' },
        en: { aboutTagline: 'Hello' },
      },
      heroSlides: [{ id: 'slide-1', title: 'ES title', text: 'ES text' }],
    };

    const resolved = resolvePageLanguage(page, 'en');
    expect(resolved.aboutTagline).toBe('Hello');
    expect(resolved.activeLanguage).toBe('en');
  });
});

describe('updatePageTranslation', () => {
  it('writes the edited language bucket without dropping default structure', () => {
    const page = {
      name: 'Ana',
      aboutTagline: 'Hola',
      specialty: 'Psicología',
      defaultLanguage: 'es',
      enabledLanguages: ['es', 'en'],
      translations: {
        es: { aboutTagline: 'Hola', specialty: 'Psicología' },
        en: { aboutTagline: 'Hello' },
      },
      heroSlides: [],
      services: [],
      catalogItems: [],
      galleryItems: [],
      testimonials: [],
      blogPosts: [],
      customEmbeds: [],
    };

    const edited = {
      ...page,
      aboutTagline: 'Hello there',
      specialty: 'Psychology',
    };

    const next = updatePageTranslation(page, edited, 'en');
    expect(next.translations.en.aboutTagline).toBe('Hello there');
    expect(next.translations.en.specialty).toBe('Psychology');
    expect(next.defaultLanguage).toBe('es');
    expect(next.enabledLanguages).toContain('es');
  });

  it('preserves trailing spaces and blank values while editing the default language', () => {
    let page = {
      name: 'Ana',
      specialty: 'Psicología',
      navSpecialty: 'OLD',
      defaultLanguage: 'es',
      enabledLanguages: ['es', 'en'],
      translations: {
        es: { specialty: 'Psicología', navSpecialty: 'OLD' },
        en: {},
      },
      heroSlides: [],
      services: [],
      catalogItems: [],
      galleryItems: [],
      testimonials: [],
      blogPosts: [],
      customEmbeds: [],
    };

    const type = (value) => {
      const editor = resolvePageLanguage(page, 'es', { fallback: false });
      page = updatePageTranslation(page, { ...editor, navSpecialty: value }, 'es');
      return resolvePageLanguage(page, 'es', { fallback: false }).navSpecialty;
    };

    expect(type('Servicios')).toBe('Servicios');
    expect(type('Servicios ')).toBe('Servicios ');
    expect(type('Servicios de Construccion')).toBe('Servicios de Construccion');
    expect(type('')).toBe('');
    expect(type(' ')).toBe(' ');
  });
});
