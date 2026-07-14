import { normalizeCustomEmbeds } from './customEmbeds';
import { TOGGLEABLE_PAGE_SECTIONS } from './sectionVisibility';

/**
 * For non-root editors: keep section visibility flags and custom-embed structure
 * from the last loaded/saved baseline; only allow content field updates on existing embeds.
 */
export function applyLockedPageLayout(draft = {}, baseline = {}) {
  const next = { ...draft };

  TOGGLEABLE_PAGE_SECTIONS.forEach(({ flag, defaultEnabled }) => {
    if (baseline[flag] === undefined || baseline[flag] === null) {
      next[flag] = defaultEnabled;
      return;
    }
    next[flag] = baseline[flag] === true;
  });

  next.customEmbeds = mergeLockedCustomEmbeds(draft.customEmbeds, baseline.customEmbeds);
  return next;
}

function mergeLockedCustomEmbeds(draftEmbeds, baselineEmbeds) {
  const baseline = normalizeCustomEmbeds(baselineEmbeds);
  const draftById = new Map(
    normalizeCustomEmbeds(draftEmbeds).map((embed) => [embed.id, embed]),
  );

  return baseline.map((base) => {
    const draft = draftById.get(base.id);
    if (!draft) return base;

    return {
      ...base,
      label: draft.label,
      title: draft.title,
      htmlCode: draft.htmlCode,
      body: draft.body,
      quoteText: draft.quoteText,
      quoteAttribution: draft.quoteAttribution,
      ctaText: draft.ctaText,
      ctaButtonLabel: draft.ctaButtonLabel,
      ctaButtonUrl: draft.ctaButtonUrl,
      faqItems: draft.faqItems,
      steps: draft.steps,
      imageUrl: draft.imageUrl,
      preHeroMode: draft.preHeroMode,
      preHeroImageSide: draft.preHeroImageSide,
      serviceItems: draft.serviceItems,
      servicesDisplayMode: draft.servicesDisplayMode,
      servicesCarouselPerView: draft.servicesCarouselPerView,
      servicesCarouselAutoplay: draft.servicesCarouselAutoplay,
      portfolioUrl: draft.portfolioUrl,
      portfolioProvider: draft.portfolioProvider,
    };
  });
}
