
import { shouldShowPreHero, splitPreHeroParagraphs, normalizePreHeroImageSide } from '@raulizqli/landing-core/preHero';
import { buildSectionBackgroundStyle, getSectionTheme } from '@raulizqli/landing-core/sectionBackground';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';
import { SECTION_IDS } from '@raulizqli/landing-core/sectionAnchors';

export default function PreHeroSection({ data }) {
  if (!shouldShowPreHero(data)) return null;

  const labels = resolvePageLabels(data);

  const imageUrl = String(data.preHeroImageUrl).trim();
  const splitMode = data.preHeroMode === 'split';
  const imageOnRight = normalizePreHeroImageSide(data.preHeroImageSide) === 'right';
  const title = String(data.preHeroTitle ?? '').trim();
  const paragraphs = splitPreHeroParagraphs(data.preHeroText);
  const sectionStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'preHero'), { sectionKey: 'preHero' });

  if (!splitMode) {
    return (
      <section
        id={SECTION_IDS.preHero}
        data-preview-section={SECTION_IDS.preHero}
        className="border-b border-[#2A342D]/10"
        style={sectionStyle}
        aria-label={getLabel(labels, 'preHero.ariaLabel')}
      >
        <img
          src={imageUrl}
          alt=""
          className="w-full h-auto max-h-[520px] object-cover object-center"
        />
      </section>
    );
  }

  const imageBlock = (
    <div className="relative h-full min-h-[280px] md:min-h-[360px]">
      <img
        src={imageUrl}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover object-top rounded-xl ${
          imageOnRight ? 'md:rounded-l-none' : 'md:rounded-r-none'
        }`}
      />
    </div>
  );

  const textBlock = (
    <div
      className={`relative z-10 bg-white rounded-xl shadow-sm border border-[#2A342D]/10 p-6 sm:p-8 flex flex-col justify-center md:my-6 ${
        imageOnRight
          ? 'md:rounded-r-none md:-mr-10'
          : 'md:rounded-l-none md:-ml-10'
      }`}
    >
      {title && (
        <h2 className="font-serif text-2xl sm:text-3xl text-[#5B7C8E] mb-5 leading-snug">
          {title}
        </h2>
      )}
      {paragraphs.length > 0 && (
        <div className="space-y-4 text-sm sm:text-base text-[#2A342D]/75 leading-relaxed">
          {paragraphs.map((paragraph, index) => (
            <p key={`pre-hero-p-${index}`}>{paragraph}</p>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <section
      id={SECTION_IDS.preHero}
      data-preview-section={SECTION_IDS.preHero}
      className="border-b border-[#2A342D]/10"
      style={sectionStyle}
      aria-label={getLabel(labels, 'preHero.ariaLabel')}
    >
      <div className="max-w-5xl mx-auto px-5 py-10 sm:py-14">
        <div
          className={`grid gap-6 md:gap-0 items-stretch ${
            imageOnRight
              ? 'md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]'
              : 'md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]'
          }`}
        >
          {imageOnRight ? (
            <>
              <div className="min-w-0 flex flex-col justify-center">{textBlock}</div>
              <div className="min-w-0 h-full min-h-[280px] md:min-h-[360px]">{imageBlock}</div>
            </>
          ) : (
            <>
              <div className="min-w-0 h-full min-h-[280px] md:min-h-[360px]">{imageBlock}</div>
              <div className="min-w-0 flex flex-col justify-center">{textBlock}</div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
