import { describe, expect, it } from 'vitest';
import {
  normalizeEnabledLanguages,
  normalizePageLanguage,
  normalizePageTranslations,
  resolvePageLanguage,
  updatePageTranslation,
} from './pageTranslations.js';
import { hydratePageForm } from './pageModel.js';

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

  it('fills CMS editor fields from root when default translation bucket is partial', () => {
    const page = hydratePageForm({
      name: 'Ana',
      aboutTagline: 'Frase raíz',
      aboutBio: 'Bio raíz completa',
      specialty: 'Psicología clínica',
      defaultLanguage: 'es',
      enabledLanguages: ['es', 'en'],
      translations: {
        // Partial bucket: common after incremental i18n saves.
        es: { aboutTagline: 'Frase en translations' },
        en: {},
      },
      heroSlides: [{ id: 'slide-1', title: 'Bienvenida', text: 'Un espacio seguro', showTitle: true, showText: true }],
      services: [{ id: 'service-1', title: 'Terapia individual', description: 'Sesiones 50 min' }],
    });

    const editor = resolvePageLanguage(page, 'es', { fallback: false });
    expect(editor.aboutTagline).toBe('Frase en translations');
    expect(editor.aboutBio).toBe('Bio raíz completa');
    expect(editor.specialty).toBe('Psicología clínica');
    expect(editor.heroSlides[0].title).toBe('Bienvenida');
    expect(editor.heroSlides[0].text).toBe('Un espacio seguro');
    expect(editor.services[0].title).toBe('Terapia individual');

    const live = resolvePageLanguage(page, 'es');
    expect(live.aboutBio).toBe(editor.aboutBio);
    expect(live.heroSlides[0].title).toBe(editor.heroSlides[0].title);
  });

  it('rematches collection translations when item ids drift', () => {
    const page = hydratePageForm({
      defaultLanguage: 'es',
      enabledLanguages: ['es'],
      heroSlides: [{ id: 'slide-new', title: 'Nuevo id', text: 'Texto raíz' }],
      translations: {
        es: {
          heroSlides: {
            'slide-old': { title: 'Título guardado', text: 'Texto guardado' },
          },
        },
      },
    });

    const editor = resolvePageLanguage(page, 'es', { fallback: false });
    expect(editor.heroSlides[0].id).toBe('slide-new');
    expect(editor.heroSlides[0].title).toBe('Título guardado');
    expect(editor.heroSlides[0].text).toBe('Texto guardado');
  });

  it('preserves explicit blank values while editing', () => {
    const page = hydratePageForm({
      aboutTagline: 'Raíz',
      specialty: 'Clínica',
      defaultLanguage: 'es',
      enabledLanguages: ['es'],
      translations: {
        // Bucket must have some content or normalize rebuilds it from root.
        es: { specialty: 'Clínica', aboutTagline: '' },
      },
    });

    const editor = resolvePageLanguage(page, 'es', { fallback: false });
    expect(editor.specialty).toBe('Clínica');
    expect(editor.aboutTagline).toBe('');
  });
});

describe('normalizePageTranslations', () => {
  it('heals missing default-language fields from page root', () => {
    const healed = normalizePageTranslations(
      { es: { aboutTagline: 'Hola' }, en: {} },
      {
        aboutTagline: 'Hola',
        aboutBio: 'Bio',
        specialty: 'Clínica',
        heroSlides: [{ id: 'slide-1', title: 'Hero', text: 'Sub' }],
      },
      'es',
    );

    expect(healed.es.aboutTagline).toBe('Hola');
    expect(healed.es.aboutBio).toBe('Bio');
    expect(healed.es.specialty).toBe('Clínica');
    expect(healed.es.heroSlides['slide-1'].title).toBe('Hero');
  });

  it('keeps per-video captions in the translation bucket', () => {
    const healed = normalizePageTranslations(
      { es: {}, en: {} },
      {
        videoSectionItems: [
          { id: 'video-1', url: 'https://youtu.be/dQw4w9wgGcQ', caption: 'Introducción' },
        ],
      },
      'es',
    );
    expect(healed.es.videoSectionItems['video-1'].caption).toBe('Introducción');
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
