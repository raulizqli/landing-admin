import { normalizeServicesVisualStyle } from '@raulizqli/landing-core/services';
import { normalizeCatalogVisualStyle } from '@raulizqli/landing-core/catalog';
import {
  customStyleBorderRgba,
  normalizeSectionCustomStyle,
} from '@raulizqli/landing-core/sectionCustomStyle';

function shadowClass(shadow) {
  if (shadow === 'medium') return 'shadow-md';
  if (shadow === 'soft') return 'shadow-sm';
  return 'shadow-none';
}

function hoverClass(hover) {
  if (hover === 'lift') {
    return 'transition-transform duration-300 motion-safe:hover:-translate-y-1';
  }
  if (hover === 'opacity') {
    return 'transition-opacity duration-300 motion-safe:hover:opacity-80';
  }
  return '';
}

function entranceClass(entrance) {
  if (entrance === 'slideUp') return 'motion-safe:animate-section-slide-up';
  if (entrance === 'fade') return 'motion-safe:animate-section-fade-in';
  return '';
}

function gapClassForCustom(gap) {
  if (gap === 'tight') return 'gap-4 sm:gap-5';
  if (gap === 'relaxed') return 'gap-8 sm:gap-10';
  return 'gap-5 sm:gap-6';
}

function buildCustomVisualClasses(customStyle) {
  const style = normalizeSectionCustomStyle(customStyle);
  return {
    article: `overflow-hidden h-full flex flex-col ${shadowClass(style.shadow)} ${hoverClass(style.hover)}`.trim(),
    articleStyle: {
      backgroundColor: style.backgroundColor,
      borderColor: customStyleBorderRgba(style),
      borderWidth: `${style.borderWidth}px`,
      borderStyle: style.borderWidth > 0 ? 'solid' : 'none',
      borderRadius: `${style.borderRadius}px`,
    },
    media: 'overflow-hidden',
    body: 'p-5 sm:p-6 flex flex-col flex-1',
    title: 'font-serif text-lg sm:text-xl text-[#2A342D] leading-snug',
    entrance: entranceClass(style.entrance),
    gapClass: gapClassForCustom(style.gap),
  };
}

/**
 * Shared Tailwind class maps for services/catalog visual styles.
 */
export function getItemVisualClasses(visualStyle, customStyle) {
  const style = normalizeServicesVisualStyle(visualStyle);

  if (style === 'custom') {
    return buildCustomVisualClasses(customStyle);
  }

  if (style === 'minimal') {
    return {
      article: 'bg-transparent rounded-none border-0 shadow-none overflow-hidden h-full flex flex-col transition-opacity duration-300 motion-safe:hover:opacity-80',
      articleStyle: undefined,
      media: 'rounded-lg overflow-hidden',
      body: 'px-1 py-4 sm:py-5 flex flex-col flex-1',
      title: 'font-serif text-lg sm:text-xl text-[#2A342D] leading-snug',
      entrance: 'motion-safe:animate-section-fade-in',
      gapClass: 'gap-8 sm:gap-10',
    };
  }

  if (style === 'editorial') {
    return {
      article: 'bg-transparent rounded-none border-0 border-b border-[#2A342D]/15 shadow-none overflow-hidden h-full flex flex-col pb-6 transition-transform duration-300 motion-safe:hover:-translate-y-0.5',
      articleStyle: undefined,
      media: 'rounded-sm overflow-hidden mb-1',
      body: 'px-0 pt-5 pb-2 flex flex-col flex-1',
      title: 'font-serif text-xl sm:text-2xl text-[#2A342D] leading-snug tracking-tight',
      entrance: 'motion-safe:animate-section-slide-up',
      gapClass: 'gap-10 sm:gap-12',
    };
  }

  return {
    article: 'bg-white rounded-2xl border border-[#2A342D]/10 shadow-sm overflow-hidden h-full flex flex-col transition-transform duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-md',
    articleStyle: undefined,
    media: 'overflow-hidden',
    body: 'p-5 sm:p-6 flex flex-col flex-1',
    title: 'font-serif text-lg sm:text-xl text-[#2A342D] leading-snug',
    entrance: 'motion-safe:animate-section-fade-in',
    gapClass: 'gap-5 sm:gap-6',
  };
}

export function getCatalogVisualClasses(visualStyle, customStyle) {
  return getItemVisualClasses(normalizeCatalogVisualStyle(visualStyle), customStyle);
}

export function getStackGapClass(visualStyle, customStyle) {
  const classes = getItemVisualClasses(visualStyle, customStyle);
  return classes.gapClass || 'gap-5 sm:gap-6';
}

export function getGridGapClass(visualStyle, customStyle) {
  const style = normalizeServicesVisualStyle(visualStyle);
  if (style === 'custom') {
    return getStackGapClass(style, customStyle);
  }
  if (style === 'minimal') return 'gap-6 sm:gap-8';
  if (style === 'editorial') return 'gap-8 sm:gap-10';
  return 'gap-5 sm:gap-6';
}

export function entranceDelayStyle(index) {
  return { animationDelay: `${Math.min(index, 6) * 60}ms` };
}
