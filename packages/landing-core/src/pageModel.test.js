import { describe, expect, it } from 'vitest';
import { EMPTY_PAGE, hydratePageForm, normalizePageData } from './pageModel.js';

describe('normalizePageData', () => {
  it('migrates legacy Spanish root keys to English and removes legacy keys', () => {
    const normalized = normalizePageData({
      nombre: 'Ana',
      especialidad: 'Psicología',
      sobreMiFrase: 'Un espacio seguro',
      sobreMiBio: 'Bio larga',
      ubicacion: 'CDMX',
      telefono: '555',
      telefonoEsWhatsapp: true,
      navModo: 'perfil',
      preHeroModo: 'grafico',
      preHeroActivo: true,
    });

    expect(normalized.name).toBe('Ana');
    expect(normalized.specialty).toBe('Psicología');
    expect(normalized.aboutTagline).toBe('Un espacio seguro');
    expect(normalized.aboutBio).toBe('Bio larga');
    expect(normalized.location).toBe('CDMX');
    expect(normalized.phone).toBe('555');
    expect(normalized.phoneIsWhatsapp).toBe(true);
    expect(normalized.navMode).toBe('profile');
    expect(normalized.preHeroMode).toBe('banner');
    expect(normalized.preHeroEnabled).toBe(true);
    expect(normalized).not.toHaveProperty('nombre');
    expect(normalized).not.toHaveProperty('especialidad');
    expect(normalized).not.toHaveProperty('sobreMiFrase');
  });

  it('prefers existing English keys over legacy Spanish duplicates', () => {
    const normalized = normalizePageData({
      name: 'English Name',
      nombre: 'Spanish Name',
    });
    expect(normalized.name).toBe('English Name');
    expect(normalized).not.toHaveProperty('nombre');
  });

  it('builds heroSlides from legacy heroTitle/heroSubtitle', () => {
    const normalized = normalizePageData({
      heroTitle: 'Hola',
      heroSubtitle: 'Sub',
    });
    expect(normalized.heroSlides).toHaveLength(1);
    expect(normalized.heroSlides[0].title).toBe('Hola');
    expect(normalized.heroSlides[0].text).toBe('Sub');
    expect(normalized.heroSlides[0].showTitle).toBe(true);
    expect(normalized.heroSlides[0].showText).toBe(true);
  });

  it('always includes default language in enabledLanguages', () => {
    const normalized = normalizePageData({
      defaultLanguage: 'en',
      enabledLanguages: [],
    });
    expect(normalized.defaultLanguage).toBe('en');
    expect(normalized.enabledLanguages).toContain('en');
    expect(normalized.enabledLanguages.length).toBeGreaterThanOrEqual(1);
  });
});

describe('hydratePageForm', () => {
  it('fills missing fields from EMPTY_PAGE then normalizes', () => {
    const form = hydratePageForm({ name: 'María' });
    expect(form.name).toBe('María');
    expect(form.specialty).toBe(EMPTY_PAGE.specialty);
    expect(form.heroSlides).toHaveLength(1);
    expect(form.enabledLanguages).toEqual(['es']);
    expect(form.defaultLanguage).toBe('es');
  });
});
