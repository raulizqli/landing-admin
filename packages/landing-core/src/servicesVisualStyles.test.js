import { describe, expect, it } from 'vitest';
import {
  normalizeServicesCarouselTransition,
  normalizeServicesVisualStyle,
  SERVICES_CAROUSEL_TRANSITIONS,
  SERVICES_VISUAL_STYLES,
} from './services.js';
import {
  CATALOG_VISUAL_STYLES,
  normalizeCatalogVisualStyle,
} from './catalog.js';

describe('services visual style normalizers', () => {
  it('exposes three visual styles and three carousel transitions', () => {
    expect(SERVICES_VISUAL_STYLES.map((item) => item.value)).toEqual(['cards', 'minimal', 'editorial']);
    expect(SERVICES_CAROUSEL_TRANSITIONS.map((item) => item.value)).toEqual(['none', 'fade', 'slide']);
    expect(CATALOG_VISUAL_STYLES.map((item) => item.value)).toEqual(['cards', 'minimal', 'editorial']);
  });

  it('normalizes known and unknown values', () => {
    expect(normalizeServicesVisualStyle('minimal')).toBe('minimal');
    expect(normalizeServicesVisualStyle('')).toBe('cards');
    expect(normalizeServicesCarouselTransition('slide')).toBe('slide');
    expect(normalizeServicesCarouselTransition(undefined)).toBe('fade');
    expect(normalizeCatalogVisualStyle('editorial')).toBe('editorial');
    expect(normalizeCatalogVisualStyle('x')).toBe('cards');
  });
});
