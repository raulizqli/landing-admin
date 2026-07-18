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
import {
  createEmptySectionCustomStyle,
  normalizeSectionCustomStyle,
} from './sectionCustomStyle.js';
import {
  accountHasFeature,
  createEmptyBillingAccount,
} from './billingPlans.js';

describe('services visual style normalizers', () => {
  it('exposes visual styles including custom and three carousel transitions', () => {
    expect(SERVICES_VISUAL_STYLES.map((item) => item.value)).toEqual(['cards', 'minimal', 'editorial', 'custom']);
    expect(SERVICES_CAROUSEL_TRANSITIONS.map((item) => item.value)).toEqual(['none', 'fade', 'slide']);
    expect(CATALOG_VISUAL_STYLES.map((item) => item.value)).toEqual(['cards', 'minimal', 'editorial', 'custom']);
  });

  it('normalizes known and unknown values', () => {
    expect(normalizeServicesVisualStyle('minimal')).toBe('minimal');
    expect(normalizeServicesVisualStyle('custom')).toBe('custom');
    expect(normalizeServicesVisualStyle('')).toBe('cards');
    expect(normalizeServicesCarouselTransition('slide')).toBe('slide');
    expect(normalizeServicesCarouselTransition(undefined)).toBe('fade');
    expect(normalizeCatalogVisualStyle('editorial')).toBe('editorial');
    expect(normalizeCatalogVisualStyle('custom')).toBe('custom');
    expect(normalizeCatalogVisualStyle('x')).toBe('cards');
  });

  it('normalizes custom style tokens with safe clamps', () => {
    const style = normalizeSectionCustomStyle({
      backgroundColor: '#abcdef',
      borderWidth: 99,
      borderRadius: -3,
      borderOpacity: 2,
      shadow: 'huge',
      hover: 'bounce',
      entrance: 'spin',
      gap: 'huge',
    });
    expect(style.backgroundColor).toBe('#ABCDEF');
    expect(style.borderWidth).toBe(4);
    expect(style.borderRadius).toBe(0);
    expect(style.borderOpacity).toBe(1);
    expect(style.shadow).toBe('soft');
    expect(style.hover).toBe('lift');
    expect(style.entrance).toBe('fade');
    expect(style.gap).toBe('normal');
    expect(createEmptySectionCustomStyle().shadow).toBe('soft');
  });

  it('gates customSectionVisualStyle to Pro and above', () => {
    const starter = createEmptyBillingAccount({ plan: 'starter', status: 'active' });
    const pro = createEmptyBillingAccount({ plan: 'pro', status: 'active' });
    const agency = createEmptyBillingAccount({ plan: 'agency', status: 'active' });
    expect(accountHasFeature(starter, 'customSectionVisualStyle')).toBe(false);
    expect(accountHasFeature(pro, 'customSectionVisualStyle')).toBe(true);
    expect(accountHasFeature(agency, 'customSectionVisualStyle')).toBe(true);
  });
});
