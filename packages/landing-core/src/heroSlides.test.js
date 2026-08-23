import { describe, expect, it } from 'vitest';
import {
  createEmptySlide,
  DEFAULT_HERO_BUTTON_BG_COLOR,
  DEFAULT_HERO_BUTTON_OUTLINE_COLOR,
  DEFAULT_HERO_BUTTON_TEXT_COLOR,
  DEFAULT_HERO_IMAGE_FIT,
  DEFAULT_HERO_TEXT_COLOR,
  getHeroImageFitClass,
  hasHeroSlideImage,
  getHeroButtonsOverlayClass,
  normalizeHeroHeightMode,
  normalizeHeroImageFit,
  normalizeHeroSlide,
  resolveHeroSlideButtonColors,
  resolveHeroSlideImageUrl,
  resolveHeroSlideTextColor,
  shouldUseFluidHeroHeight,
} from './heroSlides.js';

describe('hero slide images', () => {
  it('creates new slides with full-image fit and empty viewport urls', () => {
    const slide = createEmptySlide();
    expect(slide.imageFit).toBe(DEFAULT_HERO_IMAGE_FIT);
    expect(slide.imageFit).toBe('full');
    expect(slide.imageUrl).toBe('');
    expect(slide.tabletImageUrl).toBe('');
    expect(slide.mobileImageUrl).toBe('');
  });

  it('keeps cover-crop on legacy slides that already have an image and no fit', () => {
    const slide = normalizeHeroSlide({
      imageUrl: 'https://cdn.example/hero.jpg',
      title: 'Hola',
    });
    expect(slide.imageFit).toBe('fill');
    expect(slide.tabletImageUrl).toBe('');
    expect(slide.mobileImageUrl).toBe('');
  });

  it('defaults empty new slides to full fit', () => {
    expect(normalizeHeroSlide({}).imageFit).toBe('full');
  });

  it('preserves an explicit fit', () => {
    expect(normalizeHeroSlide({
      imageUrl: 'https://cdn.example/hero.jpg',
      imageFit: 'centred',
    }).imageFit).toBe('centred');
  });

  it('accepts centered as an alias of centred', () => {
    expect(normalizeHeroImageFit('centered')).toBe('centred');
  });

  it('resolves viewport images with fallbacks', () => {
    const slide = {
      imageUrl: 'desktop.jpg',
      tabletImageUrl: 'tablet.jpg',
      mobileImageUrl: 'mobile.jpg',
    };
    expect(resolveHeroSlideImageUrl(slide, 'desktop')).toBe('desktop.jpg');
    expect(resolveHeroSlideImageUrl(slide, 'tablet')).toBe('tablet.jpg');
    expect(resolveHeroSlideImageUrl(slide, 'mobile')).toBe('mobile.jpg');
    expect(resolveHeroSlideImageUrl({ imageUrl: 'desktop.jpg' }, 'mobile')).toBe('desktop.jpg');
    expect(resolveHeroSlideImageUrl({ imageUrl: 'desktop.jpg', tabletImageUrl: 'tablet.jpg' }, 'mobile')).toBe('tablet.jpg');
  });

  it('maps fit values to object-fit classes', () => {
    expect(getHeroImageFitClass('full')).toBe('object-contain object-center');
    expect(getHeroImageFitClass('centred')).toBe('object-none object-center');
    expect(getHeroImageFitClass('fill')).toBe('object-cover object-center');
    expect(getHeroImageFitClass('nope')).toBe('object-contain object-center');
  });

  it('detects a slide image on any viewport field', () => {
    expect(hasHeroSlideImage({ mobileImageUrl: 'm.jpg' })).toBe(true);
    expect(hasHeroSlideImage({})).toBe(false);
  });

  it('uses fluid hero height only when the page asks for auto height', () => {
    expect(normalizeHeroHeightMode()).toBe('fixed');
    expect(normalizeHeroHeightMode('auto')).toBe('auto');
    expect(shouldUseFluidHeroHeight({ heroHeightMode: 'auto' }, [{ imageUrl: 'one.jpg' }])).toBe(true);
    expect(shouldUseFluidHeroHeight({ heroHeightMode: 'auto' }, [{ imageUrl: 'one.jpg' }, { imageUrl: 'two.jpg' }])).toBe(true);
    expect(shouldUseFluidHeroHeight({ heroHeightMode: 'fixed' }, [{ imageUrl: 'one.jpg' }])).toBe(false);
    expect(shouldUseFluidHeroHeight({ heroHeightMode: 'auto' }, [{}])).toBe(false);
  });

  it('keeps top overlays at the top and bottom overlays at the bottom', () => {
    expect(getHeroButtonsOverlayClass('top')).toContain('top-8');
    expect(getHeroButtonsOverlayClass('top')).not.toContain('bottom-');
    expect(getHeroButtonsOverlayClass('bottom')).toContain('bottom-8');
    expect(getHeroButtonsOverlayClass('bottom')).not.toContain('top-');
    expect(getHeroButtonsOverlayClass('bottom-left')).toContain('bottom-8');
    expect(getHeroButtonsOverlayClass('bottom-left', { clearCarouselDots: true })).toContain('bottom-20');
    expect(getHeroButtonsOverlayClass('center')).toBeNull();
  });
});

describe('hero slide custom button', () => {
  it('defaults new slides to the preset Contact / Learn more buttons', () => {
    const slide = createEmptySlide();
    expect(slide.buttonsMode).toBe('preset');
    expect(slide.customButtonLabel).toBe('');
    expect(slide.customButtonSection).toBe('contact');
  });

  it('keeps preset mode on legacy slides', () => {
    expect(normalizeHeroSlide({ imageUrl: 'https://cdn.example/hero.jpg' }).buttonsMode).toBe('preset');
  });

  it('normalizes a custom section button', () => {
    const slide = normalizeHeroSlide({
      buttonsMode: 'custom',
      customButtonLabel: '  Ver servicios  ',
      customButtonSection: 'services',
    });
    expect(slide.buttonsMode).toBe('custom');
    expect(slide.customButtonLabel).toBe('Ver servicios');
    expect(slide.customButtonSection).toBe('services');
  });

  it('falls back to preset mode and contact section when values are invalid', () => {
    const slide = normalizeHeroSlide({
      buttonsMode: 'popup',
      customButtonSection: 'unknown',
    });
    expect(slide.buttonsMode).toBe('preset');
    expect(slide.customButtonSection).toBe('contact');
  });
});

describe('hero slide colors', () => {
  it('creates slides with empty color overrides', () => {
    const slide = createEmptySlide();
    expect(slide.textColor).toBe('');
    expect(slide.buttonBgColor).toBe('');
    expect(slide.buttonTextColor).toBe('');
    expect(slide.buttonOutlineColor).toBe('');
  });

  it('normalizes custom slide colors to hex', () => {
    const slide = normalizeHeroSlide({
      textColor: '#ff0000',
      buttonBgColor: '4A5D4E',
      buttonTextColor: '#000',
      buttonOutlineColor: 'white',
    });
    expect(slide.textColor).toBe('#FF0000');
    expect(slide.buttonBgColor).toBe('#4A5D4E');
    expect(slide.buttonTextColor).toBe('#000000');
    expect(slide.buttonOutlineColor).toBe('#FFFFFF');
  });

  it('resolves defaults when color fields are empty', () => {
    const slide = normalizeHeroSlide({});
    expect(resolveHeroSlideTextColor(slide)).toBe(DEFAULT_HERO_TEXT_COLOR);
    expect(resolveHeroSlideButtonColors(slide)).toEqual({
      buttonBgColor: DEFAULT_HERO_BUTTON_BG_COLOR,
      buttonTextColor: DEFAULT_HERO_BUTTON_TEXT_COLOR,
      buttonOutlineColor: DEFAULT_HERO_BUTTON_OUTLINE_COLOR,
    });
  });

  it('uses slide-specific colors when set', () => {
    const slide = normalizeHeroSlide({
      textColor: '#2A342D',
      buttonBgColor: '#E8B4B8',
      buttonTextColor: '#2A342D',
      buttonOutlineColor: '#2A342D',
    });
    expect(resolveHeroSlideTextColor(slide)).toBe('#2A342D');
    expect(resolveHeroSlideButtonColors(slide)).toEqual({
      buttonBgColor: '#E8B4B8',
      buttonTextColor: '#2A342D',
      buttonOutlineColor: '#2A342D',
    });
  });
});
