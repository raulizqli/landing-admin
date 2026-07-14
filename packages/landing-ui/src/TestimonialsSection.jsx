
import { getVisibleTestimonials, shouldShowTestimonialsSection } from '@raulizqli/landing-core/testimonials';
import { buildSectionBackgroundStyle, getSectionTheme } from '@raulizqli/landing-core/sectionBackground';
import { SECTION_IDS } from '@raulizqli/landing-core/sectionAnchors';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';

/** Initials from the name part of a testimonial title (before · | —). */
function getTitleInitials(title) {
  const namePart = String(title ?? '')
    .split(/\s*[·|—–]\s*/)[0]
    .trim();
  const words = namePart
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}]+/gu, ''))
    .filter(Boolean);

  if (words.length === 0) return '';
  if (words.length === 1) {
    return words[0].slice(0, 2).toLocaleUpperCase('es');
  }
  return `${words[0].slice(0, 1)}${words[1].slice(0, 1)}`.toLocaleUpperCase('es');
}

function TestimonialCard({ item }) {
  const imageUrl = String(item.imageUrl ?? '').trim();
  const title = String(item.title ?? '').trim();
  const quote = String(item.quote ?? '').trim();
  const initials = getTitleInitials(title);

  return (
    <article className="bg-white rounded-2xl border border-[#2A342D]/10 shadow-sm p-6 sm:p-8 flex flex-col items-center text-center h-full">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title || ''}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[#4A5D4E]/15 mb-5"
        />
      ) : (
        <div
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#4A5D4E]/10 flex items-center justify-center mb-5"
          aria-hidden="true"
        >
          {initials ? (
            <span className="font-sans text-base sm:text-lg font-semibold tracking-wide text-[#4A5D4E]/80">
              {initials}
            </span>
          ) : (
            <span className="font-serif text-2xl text-[#4A5D4E]/60">“</span>
          )}
        </div>
      )}

      <blockquote className="flex-1 text-sm sm:text-base text-[#2A342D]/80 leading-relaxed italic">
        &ldquo;{quote}&rdquo;
      </blockquote>

      {title && (
        <p className="mt-5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#4A5D4E]/80">
          {title}
        </p>
      )}
    </article>
  );
}

export default function TestimonialsSection({ data }) {
  if (!shouldShowTestimonialsSection(data)) return null;

  const labels = resolvePageLabels(data);
  const items = getVisibleTestimonials(data);
  const sectionTitle = String(data.testimonialsSectionTitle ?? '').trim() || getLabel(labels, 'testimonials.defaultTitle');
  const sectionStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'testimonials'), { sectionKey: 'testimonials' });

  return (
    <section id={SECTION_IDS.testimonials} className="border-y border-[#2A342D]/10" style={sectionStyle}>
      <div className="max-w-5xl mx-auto px-5 py-14 sm:py-20">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="font-serif text-2xl sm:text-3xl text-current mb-3">
            {sectionTitle}
          </h2>
          <p className="text-sm text-current/60 max-w-md mx-auto">
            {getLabel(labels, 'testimonials.subtitle')}
          </p>
        </div>

        <div className={`grid gap-5 sm:gap-6 ${items.length === 1 ? 'max-w-lg mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {items.map((item, index) => (
            <TestimonialCard key={`testimonial-${index}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
