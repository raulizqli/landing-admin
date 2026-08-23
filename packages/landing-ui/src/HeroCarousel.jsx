import { useState, useEffect, useCallback } from 'react';
import {
  getHeroButtonsOverlayClass,
  getHeroImageFitClass,
  hasHeroSlideImage,
  HERO_IMAGE_MOBILE_MAX_WIDTH,
  HERO_IMAGE_TABLET_MAX_WIDTH,
  normalizeHeroButtonSection,
  normalizeHeroButtonsMode,
  normalizeHeroSlides,
  resolveHeroSlideButtonColors,
  resolveHeroSlideTextColor,
  shouldUseFluidHeroHeight,
} from '@raulizqli/landing-core/heroSlides';
import { resolveHeroVideo } from '@raulizqli/landing-core/heroVideo';
import { trackCtaClick } from './trackInteraction.js';
import { SECTION_IDS } from '@raulizqli/landing-core/sectionAnchors';
import { buildSectionBackgroundStyle, getSectionTheme } from '@raulizqli/landing-core/sectionBackground';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';

function HeroSlidePicture({ slide, fluid = false }) {
  const desktop = String(slide.imageUrl ?? '').trim();
  const tablet = String(slide.tabletImageUrl ?? '').trim();
  const mobile = String(slide.mobileImageUrl ?? '').trim();
  const src = desktop || tablet || mobile;
  if (!src) return null;

  const fitClass = getHeroImageFitClass(slide.imageFit);
  const imgClass = fluid
    ? `relative z-[1] block w-full h-auto ${fitClass}`
    : `absolute inset-0 w-full h-full ${fitClass}`;

  return (
    <picture className={fluid ? 'relative z-[1] block w-full' : undefined}>
      {mobile ? (
        <source media={`(max-width: ${HERO_IMAGE_MOBILE_MAX_WIDTH}px)`} srcSet={mobile} />
      ) : null}
      {tablet ? (
        <source media={`(max-width: ${HERO_IMAGE_TABLET_MAX_WIDTH}px)`} srcSet={tablet} />
      ) : null}
      <img
        src={src}
        alt=""
        decoding="async"
        className={imgClass}
      />
    </picture>
  );
}

function HeroSlideBackground({ slide, isActive, fallbackStyle, fluid = false }) {
  const posterUrl = String(slide.imageUrl ?? '').trim();
  const video = resolveHeroVideo(slide.videoUrl);
  const showVideo = isActive && video;
  const showImage = !showVideo && hasHeroSlideImage(slide);

  if (showVideo) {
    if (video.type === 'file') {
      return (
        <video
          key={slide.videoUrl}
          src={video.videoSrc}
          poster={posterUrl || undefined}
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
      <>
        <div className="absolute inset-0 z-0" style={fallbackStyle} />
        <HeroSlidePicture slide={slide} fluid={fluid} />
      </>
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

function heroButtonClass(variant = 'solid') {
  const base = 'text-sm font-medium px-6 py-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent';
  if (variant === 'outline') {
    return `${base} border hover:bg-white/10`;
  }
  return `${base} hover:brightness-95`;
}

function HeroButton({
  href,
  interactive,
  onClick,
  variant = 'solid',
  bgColor,
  textColor,
  outlineColor,
  children,
}) {
  const style = variant === 'outline'
    ? {
        color: outlineColor,
        borderColor: `${outlineColor}66`,
      }
    : {
        backgroundColor: bgColor,
        color: textColor,
      };

  const className = heroButtonClass(variant);
  if (interactive) {
    return (
      <a href={href} onClick={onClick} className={className} style={style}>
        {children}
      </a>
    );
  }
  return <span className={className} style={style}>{children}</span>;
}

function HeroButtons({ slide, labels, interactive, className = '' }) {
  const groupClass = `flex flex-col sm:flex-row items-center justify-center gap-3 ${className}`.trim();
  const customMode = normalizeHeroButtonsMode(slide?.buttonsMode) === 'custom';
  const buttonColors = resolveHeroSlideButtonColors(slide);

  if (customMode) {
    const sectionId = normalizeHeroButtonSection(slide?.customButtonSection);
    const label = String(slide?.customButtonLabel ?? '').trim() || getLabel(labels, 'hero.contact');
    return (
      <div className={groupClass}>
        <HeroButton
          href={`#${sectionId}`}
          interactive={interactive}
          onClick={() => trackCtaClick(`hero_${sectionId}`)}
          bgColor={buttonColors.buttonBgColor}
          textColor={buttonColors.buttonTextColor}
        >
          {label}
        </HeroButton>
      </div>
    );
  }

  return (
    <div className={groupClass}>
      <HeroButton
        href={`#${SECTION_IDS.contact}`}
        interactive={interactive}
        onClick={() => trackCtaClick('contact')}
        bgColor={buttonColors.buttonBgColor}
        textColor={buttonColors.buttonTextColor}
      >
        {getLabel(labels, 'hero.contact')}
      </HeroButton>
      <HeroButton
        href={`#${SECTION_IDS.about}`}
        interactive={interactive}
        onClick={() => trackCtaClick('learn_more')}
        variant="outline"
        outlineColor={buttonColors.buttonOutlineColor}
      >
        {getLabel(labels, 'hero.learnMore')}
      </HeroButton>
    </div>
  );
}

export default function HeroCarousel({
  data,
  specialty,
  interactive = true,
  lockedSlideIndex = null,
}) {
  const labels = resolvePageLabels(data);
  const slides = normalizeHeroSlides(data);
  const fallbackStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'hero'), { sectionKey: 'hero' });
  const [activeIndex, setActiveIndex] = useState(0);
  const clearCarouselDots = slides.length > 1;
  const fluidHeight =
    shouldUseFluidHeroHeight(data, slides)
    && slides.every((slide) => !resolveHeroVideo(slide?.videoUrl));

  const goTo = useCallback((index) => {
    setActiveIndex((index + slides.length) % slides.length);
  }, [slides.length]);

  const goNext = useCallback(() => {
    goTo(activeIndex + 1);
  }, [activeIndex, goTo]);

  const goPrev = useCallback(() => {
    goTo(activeIndex - 1);
  }, [activeIndex, goTo]);

  const lockedIndex = Number.isInteger(lockedSlideIndex) && slides.length
    ? ((lockedSlideIndex % slides.length) + slides.length) % slides.length
    : null;
  const safeIndex = lockedIndex ?? (slides.length ? activeIndex % slides.length : 0);

  useEffect(() => {
    if (lockedIndex == null) return;
    setActiveIndex(lockedIndex);
  }, [lockedIndex]);

  useEffect(() => {
    if (slides.length <= 1 || lockedIndex != null) return undefined;

    const timer = window.setInterval(goNext, 6000);
    return () => window.clearInterval(timer);
  }, [slides.length, goNext, lockedIndex]);

  return (
    <section
      id={SECTION_IDS.hero}
      data-preview-section={SECTION_IDS.hero}
      className="relative overflow-hidden"
      aria-label={getLabel(labels, 'hero.carouselAria')}
    >
      <div className={fluidHeight ? 'relative' : 'relative h-[420px] sm:h-[520px]'}>
        {slides.map((slide, index) => {
          const isActive = index === safeIndex;
          const overlayClass = getHeroButtonsOverlayClass(slide.buttonsPosition, { clearCarouselDots });
          const showButtons = isActive && slide.showButtons !== false;
          const textColor = resolveHeroSlideTextColor(slide);
          const specialtyColor = `${textColor}E6`;
          const bodyColor = `${textColor}E6`;

          return (
            <div
              key={`hero-slide-${index}`}
              className={
                fluidHeight
                  ? `transition-opacity duration-700 ease-in-out ${isActive ? 'relative z-10 opacity-100' : 'absolute inset-0 z-0 opacity-0 pointer-events-none'}`
                  : `absolute inset-0 transition-opacity duration-700 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`
              }
              aria-hidden={!isActive}
            >
              <HeroSlideBackground slide={slide} isActive={isActive} fallbackStyle={fallbackStyle} fluid={fluidHeight} />
              {slide.showGradient !== false && (
                <div className="absolute inset-0 z-[2] bg-gradient-to-b from-[#2A342D]/50 via-[#2A342D]/35 to-[#2A342D]/55" />
              )}

              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-5 text-center">
                {specialty && data?.showHeroSpecialty === true && (
                  <span
                    className="inline-block text-[11px] sm:text-xs uppercase font-semibold tracking-[0.2em] mb-4"
                    style={{ color: specialtyColor }}
                  >
                    {specialty}
                  </span>
                )}

                {slide.showTitle && slide.title?.trim() && (
                  <h1
                    className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight font-normal max-w-3xl drop-shadow-sm"
                    style={{ color: textColor }}
                  >
                    {slide.title}
                  </h1>
                )}

                {slide.showText && slide.text?.trim() && (
                  <p
                    className={`text-sm sm:text-base max-w-xl leading-relaxed drop-shadow-sm ${slide.showTitle && slide.title?.trim() ? 'mt-5' : ''}`}
                    style={{ color: bodyColor }}
                  >
                    {slide.text}
                  </p>
                )}

                {showButtons && !overlayClass && (
                  <HeroButtons slide={slide} labels={labels} interactive={interactive} className="mt-8" />
                )}
              </div>

              {showButtons && overlayClass && (
                <HeroButtons slide={slide} labels={labels} interactive={interactive} className={overlayClass} />
              )}
            </div>
          );
        })}
      </div>

      {slides.length > 1 && interactive && lockedIndex == null && (
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

      {slides.length > 1 && (!interactive || lockedIndex != null) && (
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
