import { useEffect, useState } from 'react';
import {
  getServiceLayoutMeta,
  getVisibleServices,
  normalizeServiceLayout,
  normalizeServiceListItems,
  normalizeServicesCarouselAutoplay,
  normalizeServicesCarouselPerView,
  normalizeServicesDisplayMode,
  SERVICES_CAROUSEL_AUTOPLAY_MS,
  shouldShowServicesSection,
  splitServicesSectionText,
  truncateServiceDescription,
} from '@raulizqli/landing-core/services';
import { buildSectionBackgroundStyle, getSectionTheme } from '@raulizqli/landing-core/sectionBackground';
import { SECTION_IDS } from '@raulizqli/landing-core/sectionAnchors';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';

function ServiceMedia({ imageUrl, title, prominent }) {
  if (!imageUrl) return null;

  if (prominent) {
    return (
      <div className="aspect-[4/3] bg-[#E8E4DB]">
        <img
          src={imageUrl}
          alt={title || ''}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="aspect-[16/10] bg-[#E8E4DB]">
      <img
        src={imageUrl}
        alt={title || ''}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

function ServiceListBody({ items }) {
  if (!items.length) return null;
  return (
    <ul className="mt-1 space-y-2 text-sm text-[#2A342D]/70 leading-relaxed list-disc pl-5">
      {items.map((entry, index) => (
        <li key={`service-list-${index}`}>{entry}</li>
      ))}
    </ul>
  );
}

function TitleServiceCard({ item }) {
  const imageUrl = String(item.imageUrl ?? '').trim();
  const title = String(item.title ?? '').trim();

  return (
    <article className="bg-white rounded-2xl border border-[#2A342D]/10 shadow-sm overflow-hidden h-full flex flex-col">
      <ServiceMedia imageUrl={imageUrl} title={title} prominent />
      {title && (
        <div className="p-5 sm:p-6">
          <h3 className={`font-serif text-lg sm:text-xl text-[#2A342D] leading-snug ${imageUrl ? 'text-center' : ''}`}>
            {title}
          </h3>
        </div>
      )}
    </article>
  );
}

function DescriptionServiceCard({
  item,
  interactive,
  viewMoreLabel,
  viewLessLabel,
}) {
  const imageUrl = String(item.imageUrl ?? '').trim();
  const title = String(item.title ?? '').trim();
  const { preview, full, truncated } = truncateServiceDescription(item.description);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [full]);

  const shownText = expanded || !truncated ? full : preview;

  return (
    <article className="bg-white rounded-2xl border border-[#2A342D]/10 shadow-sm overflow-hidden h-full flex flex-col">
      <ServiceMedia imageUrl={imageUrl} title={title} />
      <div className="p-6 flex flex-col flex-1">
        {title && (
          <h3 className="font-serif text-lg sm:text-xl text-[#2A342D] mb-2 leading-snug">
            {title}
          </h3>
        )}

        {shownText && (
          <div className="text-sm text-[#2A342D]/70 leading-relaxed flex-1">
            <p>{shownText}</p>
            {truncated && (
              interactive ? (
                <button
                  type="button"
                  onClick={() => setExpanded((value) => !value)}
                  className="mt-2 text-xs font-medium text-[#4A5D4E] hover:underline underline-offset-2"
                >
                  {expanded ? viewLessLabel : viewMoreLabel}
                </button>
              ) : (
                <span className="mt-2 inline-block text-xs font-medium text-[#4A5D4E]">
                  {viewMoreLabel}
                </span>
              )
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function ListServiceCard({ item }) {
  const imageUrl = String(item.imageUrl ?? '').trim();
  const title = String(item.title ?? '').trim();
  const listItems = normalizeServiceListItems(item.listItems);

  return (
    <article className="bg-white rounded-2xl border border-[#2A342D]/10 shadow-sm overflow-hidden h-full flex flex-col">
      <ServiceMedia imageUrl={imageUrl} title={title} />
      <div className="p-6 flex flex-col flex-1">
        {title && (
          <h3 className="font-serif text-lg sm:text-xl text-[#2A342D] mb-3 leading-snug">
            {title}
          </h3>
        )}
        <ServiceListBody items={listItems} />
      </div>
    </article>
  );
}

export function ServiceCard({
  item,
  interactive = true,
  viewMoreLabel = 'Ver más',
  viewLessLabel = 'Ver menos',
}) {
  const layout = normalizeServiceLayout(item?.layout);
  const meta = getServiceLayoutMeta(layout);

  if (layout === 'title') {
    return <TitleServiceCard item={item} />;
  }

  if (meta.fields.list) {
    return <ListServiceCard item={item} />;
  }

  return (
    <DescriptionServiceCard
      item={item}
      interactive={interactive}
      viewMoreLabel={viewMoreLabel}
      viewLessLabel={viewLessLabel}
    />
  );
}

function perViewGridClass(perView) {
  switch (perView) {
    case 1:
      return 'grid-cols-1 max-w-md mx-auto';
    case 2:
      return 'grid-cols-1 sm:grid-cols-2';
    case 4:
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    case 3:
    default:
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  }
}

export function ServicesItemsLayout({
  items,
  displayMode = 'stack',
  carouselPerView = 3,
  carouselAutoplay = false,
  interactive = true,
  previousLabel = 'Anterior',
  nextLabel = 'Siguiente',
  viewMoreLabel = 'Ver más',
  viewLessLabel = 'Ver menos',
}) {
  const mode = normalizeServicesDisplayMode(displayMode);
  const perView = normalizeServicesCarouselPerView(carouselPerView);
  const autoplay = normalizeServicesCarouselAutoplay(carouselAutoplay);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const totalPages = Math.max(1, Math.ceil(items.length / perView));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages - 1));
  }, [totalPages, perView, items.length]);

  useEffect(() => {
    if (mode !== 'carousel' || !autoplay || totalPages <= 1 || paused) return undefined;

    const timer = window.setInterval(() => {
      setPage((current) => (current + 1) % totalPages);
    }, SERVICES_CAROUSEL_AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [mode, autoplay, totalPages, paused]);

  if (mode !== 'carousel') {
    return (
      <div className="flex flex-col gap-5 sm:gap-6 max-w-2xl mx-auto">
        {items.map((item, index) => (
          <ServiceCard
            key={`service-${index}`}
            item={item}
            interactive={interactive}
            viewMoreLabel={viewMoreLabel}
            viewLessLabel={viewLessLabel}
          />
        ))}
      </div>
    );
  }

  const start = page * perView;
  const visible = items.slice(start, start + perView);
  const goPrev = () => {
    if (autoplay) {
      setPage((current) => (current - 1 + totalPages) % totalPages);
      return;
    }
    setPage((current) => Math.max(0, current - 1));
  };
  const goNext = () => {
    if (autoplay) {
      setPage((current) => (current + 1) % totalPages);
      return;
    }
    setPage((current) => Math.min(totalPages - 1, current + 1));
  };
  const canGoPrev = autoplay || page > 0;
  const canGoNext = autoplay || page < totalPages - 1;

  return (
    <div
      className="space-y-6"
      onMouseEnter={autoplay && interactive ? () => setPaused(true) : undefined}
      onMouseLeave={autoplay && interactive ? () => setPaused(false) : undefined}
    >
      <div className={`grid gap-5 sm:gap-6 ${perViewGridClass(perView)}`}>
        {visible.map((item, index) => (
          <ServiceCard
            key={`service-slide-${start + index}`}
            item={item}
            interactive={interactive}
            viewMoreLabel={viewMoreLabel}
            viewLessLabel={viewLessLabel}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={!interactive || !canGoPrev}
            onClick={goPrev}
            className="text-sm font-medium px-4 py-2 rounded-full border border-[#2A342D]/20 text-[#2A342D] hover:bg-[#2A342D]/5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {previousLabel}
          </button>
          <span className="text-xs text-[#2A342D]/55 tabular-nums">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={!interactive || !canGoNext}
            onClick={goNext}
            className="text-sm font-medium px-4 py-2 rounded-full border border-[#2A342D]/20 text-[#2A342D] hover:bg-[#2A342D]/5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {nextLabel}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ServicesSection({ data, interactive = true }) {
  if (!shouldShowServicesSection(data)) return null;

  const labels = resolvePageLabels(data);
  const items = getVisibleServices(data);
  const sectionTitle = String(data.servicesSectionTitle ?? '').trim() || getLabel(labels, 'services.defaultTitle');
  const introParagraphs = splitServicesSectionText(data.servicesSectionText);
  const sectionStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'services'), { sectionKey: 'services' });

  return (
    <section id={SECTION_IDS.services} className="border-y border-[#2A342D]/10" style={sectionStyle}>
      <div className="max-w-5xl mx-auto px-5 py-14 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <h2 className="font-serif text-2xl sm:text-3xl text-current mb-3">
            {sectionTitle}
          </h2>
          {introParagraphs.length > 0 ? (
            <div className="space-y-3 text-sm text-current/60 leading-relaxed">
              {introParagraphs.map((paragraph, index) => (
                <p key={`services-intro-${index}`}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#2A342D]/60">
              {getLabel(labels, 'services.defaultIntro')}
            </p>
          )}
        </div>

        <ServicesItemsLayout
          items={items}
          displayMode={data.servicesDisplayMode}
          carouselPerView={data.servicesCarouselPerView}
          carouselAutoplay={data.servicesCarouselAutoplay}
          interactive={interactive}
          previousLabel={getLabel(labels, 'services.carouselPrevious')}
          nextLabel={getLabel(labels, 'services.carouselNext')}
          viewMoreLabel={getLabel(labels, 'services.viewMore')}
          viewLessLabel={getLabel(labels, 'services.viewLess')}
        />
      </div>
    </section>
  );
}
