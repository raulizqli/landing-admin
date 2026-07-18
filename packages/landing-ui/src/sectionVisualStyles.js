import { normalizeServicesVisualStyle } from '@raulizqli/landing-core/services';
import { normalizeCatalogVisualStyle } from '@raulizqli/landing-core/catalog';

/**
 * Shared Tailwind class maps for services/catalog visual styles.
 */
export function getItemVisualClasses(visualStyle) {
  const style = normalizeServicesVisualStyle(visualStyle);

  if (style === 'minimal') {
    return {
      article: 'bg-transparent rounded-none border-0 shadow-none overflow-hidden h-full flex flex-col transition-opacity duration-300 motion-safe:hover:opacity-80',
      media: 'rounded-lg overflow-hidden',
      body: 'px-1 py-4 sm:py-5 flex flex-col flex-1',
      title: 'font-serif text-lg sm:text-xl text-[#2A342D] leading-snug',
      entrance: 'motion-safe:animate-section-fade-in',
    };
  }

  if (style === 'editorial') {
    return {
      article: 'bg-transparent rounded-none border-0 border-b border-[#2A342D]/15 shadow-none overflow-hidden h-full flex flex-col pb-6 transition-transform duration-300 motion-safe:hover:-translate-y-0.5',
      media: 'rounded-sm overflow-hidden mb-1',
      body: 'px-0 pt-5 pb-2 flex flex-col flex-1',
      title: 'font-serif text-xl sm:text-2xl text-[#2A342D] leading-snug tracking-tight',
      entrance: 'motion-safe:animate-section-slide-up',
    };
  }

  return {
    article: 'bg-white rounded-2xl border border-[#2A342D]/10 shadow-sm overflow-hidden h-full flex flex-col transition-transform duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-md',
    media: 'overflow-hidden',
    body: 'p-5 sm:p-6 flex flex-col flex-1',
    title: 'font-serif text-lg sm:text-xl text-[#2A342D] leading-snug',
    entrance: 'motion-safe:animate-section-fade-in',
  };
}

export function getCatalogVisualClasses(visualStyle) {
  return getItemVisualClasses(normalizeCatalogVisualStyle(visualStyle));
}

export function getStackGapClass(visualStyle) {
  const style = normalizeServicesVisualStyle(visualStyle);
  if (style === 'minimal') return 'gap-8 sm:gap-10';
  if (style === 'editorial') return 'gap-10 sm:gap-12';
  return 'gap-5 sm:gap-6';
}

export function getGridGapClass(visualStyle) {
  const style = normalizeServicesVisualStyle(visualStyle);
  if (style === 'minimal') return 'gap-6 sm:gap-8';
  if (style === 'editorial') return 'gap-8 sm:gap-10';
  return 'gap-5 sm:gap-6';
}

export function entranceDelayStyle(index) {
  return { animationDelay: `${Math.min(index, 6) * 60}ms` };
}
