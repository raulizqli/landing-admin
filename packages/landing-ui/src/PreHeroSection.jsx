
import { shouldShowPreHero, splitPreHeroParagraphs } from '@raulizqli/landing-core/preHero';
import { buildSectionBackgroundStyle, getSectionTheme } from '@raulizqli/landing-core/sectionBackground';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';

export default function PreHeroSection({ data }) {
  if (!shouldShowPreHero(data)) return null;

  const labels = resolvePageLabels(data);

  const imageUrl = String(data.preHeroImageUrl).trim();
  const splitMode = data.preHeroMode === 'split';
  const title = String(data.preHeroTitle ?? '').trim();
  const paragraphs = splitPreHeroParagraphs(data.preHeroText);
  const sectionStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'preHero'), { sectionKey: 'preHero' });

  if (!splitMode) {
    return (
      <section className="border-b border-[#2A342D]/10" style={sectionStyle} aria-label={getLabel(labels, 'preHero.ariaLabel')}>
        <img
          src={imageUrl}
          alt=""
          className="w-full h-auto max-h-[520px] object-cover object-center"
        />
      </section>
    );
  }

  return (
    <section className="border-b border-[#2A342D]/10" style={sectionStyle} aria-label={getLabel(labels, 'preHero.ariaLabel')}>
      <div className="max-w-5xl mx-auto px-5 py-10 sm:py-14">
        <div className="grid md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-6 md:gap-0 items-stretch">
          <div className="relative min-h-[280px] md:min-h-[360px]">
            <img
              src={imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-top rounded-xl md:rounded-r-none"
            />
          </div>

          <div className="relative z-10 bg-white rounded-xl md:rounded-l-none md:-ml-10 md:my-6 shadow-sm border border-[#2A342D]/10 p-6 sm:p-8 flex flex-col justify-center">
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
        </div>
      </div>
    </section>
  );
}
