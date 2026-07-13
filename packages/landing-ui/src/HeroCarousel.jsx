
import { useState, useEffect, useCallback } from 'react';
import { normalizeHeroSlides } from '@raulizqli/landing-core/heroSlides';
import { resolveHeroVideo } from '@raulizqli/landing-core/heroVideo';
import { trackCtaClick } from './trackInteraction.js';
import { SECTION_IDS } from '@raulizqli/landing-core/sectionAnchors';
import { buildSectionBackgroundStyle, getSectionTheme } from '@raulizqli/landing-core/sectionBackground';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';

function HeroSlideBackground({ slide, isActive, fallbackStyle }) {
  const imageUrl = String(slide.imageUrl ?? '').trim();
  const video = resolveHeroVideo(slide.videoUrl);
  const showVideo = isActive && video;
  const showImage = !showVideo && Boolean(imageUrl);

  if (showVideo) {
    if (video.type === 'file') {
      return (
        <video
          key={slide.videoUrl}
          src={video.videoSrc}
          poster={imageUrl || undefined}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      );
    }

    return (
      <iframe
        key={slide.videoUrl}
        src={video.embedUrl}
        title=""
        tabIndex={-1}
        allow="autoplay; fullscreen; picture-in-picture"
        className="absolute inset-0 w-full h-full pointer-events-none scale-[1.35] origin-center border-0"
      />
    );
  }

  if (showImage) {
    return (
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
    );
  }

  return (
    <>
      <div className="absolute inset-0" style={fallbackStyle} />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#4A5D4E]/15 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-[#4A5D4E]/10 blur-2xl" />
      </div>
    </>
  );
}

export default function HeroCarousel({ data, specialty, interactive = true }) {
  const labels = resolvePageLabels(data);
  const slides = normalizeHeroSlides(data);
  const fallbackStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'hero'), { sectionKey: 'hero' });
  const [activeIndex, setActiveIndex] = useState(0);

  const goTo = useCallback((index) => {
    setActiveIndex((index + slides.length) % slides.length);
  }, [slides.length]);

  const goNext = useCallback(() => {
    goTo(activeIndex + 1);
  }, [activeIndex, goTo]);

  const goPrev = useCallback(() => {
    goTo(activeIndex - 1);
  }, [activeIndex, goTo]);

  const safeIndex = slides.length ? activeIndex % slides.length : 0;

  useEffect(() => {
    if (slides.length <= 1) return undefined;

    const timer = window.setInterval(goNext, 6000);
    return () => window.clearInterval(timer);
  }, [slides.length, goNext]);

  return (
    <section className="relative overflow-hidden" aria-label={getLabel(labels, 'hero.carouselAria')}>
      <div className="relative h-[420px] sm:h-[520px]">
        {slides.map((slide, index) => {
          const isActive = index === safeIndex;

          return (
            <div
              key={`hero-slide-${index}`}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              aria-hidden={!isActive}
            >
              <HeroSlideBackground slide={slide} isActive={isActive} fallbackStyle={fallbackStyle} />
              <div className="absolute inset-0 bg-gradient-to-b from-[#2A342D]/50 via-[#2A342D]/35 to-[#2A342D]/55" />

              <div className="relative z-10 h-full flex flex-col items-center justify-center px-5 text-center">
                {specialty && (
                  <span className="inline-block text-[11px] sm:text-xs uppercase font-semibold tracking-[0.2em] text-white/90 mb-4">
                    {specialty}
                  </span>
                )}

                {slide.showTitle && slide.title?.trim() && (
                  <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white leading-tight font-normal max-w-3xl drop-shadow-sm">
                    {slide.title}
                  </h1>
                )}

                {slide.showText && slide.text?.trim() && (
                  <p className={`text-sm sm:text-base text-white/90 max-w-xl leading-relaxed drop-shadow-sm ${slide.showTitle && slide.title?.trim() ? 'mt-5' : ''}`}>
                    {slide.text}
                  </p>
                )}

                {isActive && slide.showButtons !== false && (
                  interactive ? (
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <a
                        href={`#${SECTION_IDS.contact}`}
                        onClick={() => trackCtaClick('contact')}
                        className="bg-[#4A5D4E] text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-[#3d4d40] transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
                      >
                        {getLabel(labels, 'hero.contact')}
                      </a>
                      <a
                        href={`#${SECTION_IDS.about}`}
                        onClick={() => trackCtaClick('learn_more')}
                        className="text-sm font-medium text-white px-6 py-3 rounded-full border border-white/40 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
                      >
                        {getLabel(labels, 'hero.learnMore')}
                      </a>
                    </div>
                  ) : (
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <span className="bg-[#4A5D4E] text-white text-sm font-medium px-6 py-3 rounded-full">
                        {getLabel(labels, 'hero.contact')}
                      </span>
                      <span className="text-sm font-medium text-white px-6 py-3 rounded-full border border-white/40">
                        {getLabel(labels, 'hero.learnMore')}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {slides.length > 1 && interactive && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 text-[#2A342D] shadow hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]"
            aria-label={getLabel(labels, 'hero.slidePrevious')}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 text-[#2A342D] shadow hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]"
            aria-label={getLabel(labels, 'hero.slideNext')}
          >
            ›
          </button>
          <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={`hero-dot-${index}`}
                type="button"
                onClick={() => goTo(index)}
                className={`h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white ${index === safeIndex ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                aria-label={getLabel(labels, 'hero.slideGoTo', { n: index + 1 })}
                aria-current={index === safeIndex ? 'true' : undefined}
              />
            ))}
          </div>
        </>
      )}

      {slides.length > 1 && !interactive && (
        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2 pointer-events-none">
          {slides.map((_, index) => (
            <span
              key={`hero-dot-${index}`}
              className={`h-2 rounded-full ${index === safeIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
