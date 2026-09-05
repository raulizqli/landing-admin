import { useEffect, useState } from 'react';
import {
  getGalleryPortfolioUrl,
  getVisibleGalleryItems,
  shouldShowGallerySection,
  splitGallerySectionText,
} from '@raulizqli/landing-core/gallery';
import {
  buildSectionBackgroundStyle,
  getSectionTheme,
  parseColorToHex,
} from '@raulizqli/landing-core/sectionBackground';
import {
  DEFAULT_NAV_CTA_BG_COLOR,
  DEFAULT_NAV_CTA_TEXT_COLOR,
} from '@raulizqli/landing-core/pageModel';
import { SECTION_IDS } from '@raulizqli/landing-core/sectionAnchors';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';
import { trackCtaClick } from './trackInteraction.js';

export default function GallerySection({ data, interactive = true }) {
  if (!shouldShowGallerySection(data)) return null;

  const labels = resolvePageLabels(data);
  const items = getVisibleGalleryItems(data);
  const sectionTitle = String(data.gallerySectionTitle ?? '').trim() || getLabel(labels, 'gallery.defaultTitle');
  const introParagraphs = splitGallerySectionText(data.gallerySectionText);
  const showTitle = data.galleryShowTitle !== false;
  const showIntro = data.galleryShowIntro !== false;
  const portfolioUrl = getGalleryPortfolioUrl(data);
  const portfolioLabel = String(data.galleryPortfolioLabel ?? '').trim()
    || getLabel(labels, 'gallery.viewPortfolio');
  const sectionStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'gallery'), { sectionKey: 'gallery' });
  const [activeIndex, setActiveIndex] = useState(null);
  const ctaStyle = {
    backgroundColor: parseColorToHex(data?.navCtaBgColor, DEFAULT_NAV_CTA_BG_COLOR),
    color: parseColorToHex(data?.navCtaTextColor, DEFAULT_NAV_CTA_TEXT_COLOR),
  };

  useEffect(() => {
    if (activeIndex === null || !interactive) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setActiveIndex(null);
      if (event.key === 'ArrowRight') setActiveIndex((current) => (current + 1) % items.length);
      if (event.key === 'ArrowLeft') {
        setActiveIndex((current) => (current - 1 + items.length) % items.length);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, interactive, items.length]);

  const activeItem = activeIndex !== null ? items[activeIndex] : null;
  const portfolioExternal = /^https?:\/\//i.test(portfolioUrl);

  return (
    <section id={SECTION_IDS.gallery} className="border-y border-current/10" style={sectionStyle}>
      <div className="max-w-5xl mx-auto px-5 py-14 sm:py-20">
        {(showTitle || showIntro) ? (
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            {showTitle ? (
              <h2 className="font-serif text-2xl sm:text-3xl text-current mb-3">
                {sectionTitle}
              </h2>
            ) : null}
            {showIntro ? (
              introParagraphs.length > 0 ? (
                <div className="space-y-3 text-sm text-current/60 leading-relaxed">
                  {introParagraphs.map((paragraph, index) => (
                    <p key={`gallery-intro-${index}`}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-current/60">
                  {getLabel(labels, 'gallery.defaultIntro')}
                </p>
              )
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {items.map((item, index) => {
            const alt = item.alt || item.caption || getLabel(labels, 'gallery.imageAlt');
            const TileTag = interactive ? 'button' : 'div';

            return (
              <TileTag
                key={`gallery-item-${index}`}
                type={interactive ? 'button' : undefined}
                onClick={interactive ? () => setActiveIndex(index) : undefined}
                className={`group relative aspect-square overflow-hidden rounded-2xl border border-current/10 bg-current/10 text-left ${
                  interactive ? 'cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 focus:ring-offset-transparent' : ''
                }`}
              >
                <img
                  src={item.imageUrl}
                  alt={alt}
                  className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                {item.caption && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-3 text-xs text-white/95">
                    {item.caption}
                  </span>
                )}
              </TileTag>
            );
          })}
        </div>

        {portfolioUrl && (
          <div className="mt-10 sm:mt-12 text-center">
            {interactive ? (
              <a
                href={portfolioUrl}
                {...(portfolioExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                onClick={() => trackCtaClick('gallery_portfolio')}
                className="inline-flex items-center justify-center text-sm font-medium px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
                style={ctaStyle}
              >
                {portfolioLabel}
              </a>
            ) : (
              <span
                className="inline-flex items-center justify-center text-sm font-medium px-6 py-3 rounded-full"
                style={ctaStyle}
              >
                {portfolioLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {interactive && activeItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.caption || getLabel(labels, 'gallery.imageAlt')}
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white/90 text-sm px-3 py-2 rounded-full border border-white/30 hover:bg-white/10"
            onClick={() => setActiveIndex(null)}
          >
            {getLabel(labels, 'gallery.close')}
          </button>
          <figure
            className="max-w-5xl w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={activeItem.imageUrl}
              alt={activeItem.alt || activeItem.caption || getLabel(labels, 'gallery.imageAlt')}
              className="w-full max-h-[80vh] object-contain rounded-xl bg-black/20"
            />
            {activeItem.caption && (
              <figcaption className="mt-3 text-center text-sm text-white/85">
                {activeItem.caption}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </section>
  );
}
