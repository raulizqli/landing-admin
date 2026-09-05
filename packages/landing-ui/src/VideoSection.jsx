
import { useEffect, useState } from 'react';
import { resolveSectionVideo } from '@raulizqli/landing-core/heroVideo';
import {
  getVisibleVideoItems,
  shouldShowVideoSection,
  shouldUseVideoCarousel,
  splitVideoSectionParagraphs,
  VIDEO_SECTION_CAROUSEL_AUTOPLAY_MS,
} from '@raulizqli/landing-core/videoSection';
import { buildSectionBackgroundStyle, getSectionTheme } from '@raulizqli/landing-core/sectionBackground';
import { SECTION_IDS } from '@raulizqli/landing-core/sectionAnchors';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';

function youtubeThumbFromEmbed(embedUrl) {
  try {
    const match = String(embedUrl).match(/\/embed\/([\w-]{11})/);
    return match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : '';
  } catch {
    return '';
  }
}

function VideoPlayer({ video, title = 'Video' }) {
  if (video.type === 'file') {
    return (
      <video
        src={video.videoSrc}
        controls
        playsInline
        className="absolute inset-0 w-full h-full bg-black"
      />
    );
  }

  return (
    <iframe
      src={video.embedUrl}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      className="absolute inset-0 w-full h-full border-0"
    />
  );
}

function VideoFrame({ item, index, interactive = true }) {
  const video = resolveSectionVideo(item.url);
  const [playing, setPlaying] = useState(false);
  if (!video) return null;
  const caption = String(item.caption ?? '').trim();
  const title = caption || `Video ${index + 1}`;
  const thumb = video.type === 'youtube' ? youtubeThumbFromEmbed(video.embedUrl) : '';
  const showFacade = video.type !== 'file' && !playing;

  return (
    <figure className="space-y-3">
      <div className="relative w-full max-w-3xl mx-auto aspect-video rounded-2xl overflow-hidden border border-current/10 shadow-sm bg-black">
        {showFacade ? (
          <button
            type="button"
            disabled={!interactive}
            onClick={() => setPlaying(true)}
            className="absolute inset-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={`Play ${title}`}
          >
            {thumb ? (
              <img src={thumb} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="absolute inset-0 bg-current/20" />
            )}
            <span className="absolute inset-0 bg-black/35" />
            <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-black shadow-lg transition group-hover:scale-105">
              <svg className="ml-0.5 h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        ) : (
          <VideoPlayer
            video={
              video.type === 'youtube' || video.type === 'vimeo'
                ? { ...video, embedUrl: `${video.embedUrl}${video.embedUrl.includes('?') ? '&' : '?'}autoplay=1` }
                : video
            }
            title={title}
          />
        )}
      </div>
      {caption ? (
        <figcaption className="text-center text-sm text-current/65 max-w-2xl mx-auto">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  return reduced;
}

function VideoCarousel({
  items,
  autoplay = false,
  interactive = true,
  previousLabel,
  nextLabel,
  ariaLabel,
  goToLabel,
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = items.length;

  useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(0, total - 1)));
  }, [total]);

  useEffect(() => {
    if (!autoplay || reducedMotion || total <= 1 || paused) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, VIDEO_SECTION_CAROUSEL_AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [autoplay, reducedMotion, total, paused]);

  const goPrev = () => {
    setIndex((current) => (current - 1 + total) % total);
  };
  const goNext = () => {
    setIndex((current) => (current + 1) % total);
  };

  const active = items[index];

  return (
    <div
      className="space-y-6"
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onMouseEnter={autoplay && interactive ? () => setPaused(true) : undefined}
      onMouseLeave={autoplay && interactive ? () => setPaused(false) : undefined}
    >
      {active ? (
        <VideoFrame key={`video-slide-${active.id || index}`} item={active} index={index} interactive={interactive} />
      ) : null}

      {total > 1 && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              disabled={!interactive}
              onClick={goPrev}
              className="text-sm font-medium px-4 py-2 rounded-full border border-current/20 text-current hover:bg-current/5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {previousLabel}
            </button>
            <span className="text-xs text-current/55 tabular-nums">
              {index + 1} / {total}
            </span>
            <button
              type="button"
              disabled={!interactive}
              onClick={goNext}
              className="text-sm font-medium px-4 py-2 rounded-full border border-current/20 text-current hover:bg-current/5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {nextLabel}
            </button>
          </div>
          <div className="flex items-center justify-center gap-2" role="tablist">
            {items.map((item, itemIndex) => (
              <button
                key={`video-dot-${item.id || itemIndex}`}
                type="button"
                role="tab"
                aria-selected={itemIndex === index}
                aria-label={goToLabel.replace('{n}', String(itemIndex + 1))}
                disabled={!interactive}
                onClick={() => setIndex(itemIndex)}
                className={`h-2.5 rounded-full transition-all ${
                  itemIndex === index
                    ? 'w-6 bg-current'
                    : 'w-2.5 bg-current/25 hover:bg-current/40'
                } disabled:cursor-not-allowed`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VideoSection({ data, interactive = true }) {
  if (!shouldShowVideoSection(data)) return null;

  const items = getVisibleVideoItems(data);
  if (items.length === 0) return null;

  const labels = resolvePageLabels(data);
  const title = String(data.videoSectionTitle ?? '').trim();
  const paragraphs = splitVideoSectionParagraphs(data.videoSectionText);
  const sectionStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'video'), { sectionKey: 'video' });
  const useCarousel = shouldUseVideoCarousel(data);

  return (
    <section id={SECTION_IDS.video} className="border-y border-current/10" style={sectionStyle}>
      <div className="max-w-5xl mx-auto px-5 py-14 sm:py-20">
        {(title || paragraphs.length > 0) && (
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            {title && (
              <h2 className="font-serif text-2xl sm:text-3xl text-current mb-3">
                {title}
              </h2>
            )}
            {paragraphs.length > 0 && (
              <div className="space-y-3 text-sm sm:text-base text-current/70 leading-relaxed">
                {paragraphs.map((paragraph, index) => (
                  <p key={`video-section-p-${index}`}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {useCarousel ? (
          <VideoCarousel
            items={items}
            autoplay={data.videoSectionCarouselAutoplay === true}
            interactive={interactive}
            previousLabel={getLabel(labels, 'video.carouselPrevious')}
            nextLabel={getLabel(labels, 'video.carouselNext')}
            ariaLabel={getLabel(labels, 'video.carouselAria')}
            goToLabel={getLabel(labels, 'video.slideGoTo')}
          />
        ) : (
          <VideoFrame item={items[0]} index={0} interactive={interactive} />
        )}
      </div>
    </section>
  );
}
