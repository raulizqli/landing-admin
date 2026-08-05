import { TESTIMONIALS } from '../../content/testimonials';
import { CTA } from '../../content/site';
import Section from '../ui/Section';
import Button from '../ui/Button';

function Stars({ rating }) {
  return (
    <p className="text-sm text-[var(--color-accent)]" aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(rating)}
      <span className="text-[var(--color-mute)]">{'★'.repeat(Math.max(0, 5 - rating))}</span>
    </p>
  );
}

export default function TestimonialsSection() {
  return (
    <Section
      id="testimonials"
      eyebrow="Testimonials"
      title="What clients say"
      description="Quotes below are placeholders clearly marked for replacement with verified client feedback."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {TESTIMONIALS.map((item) => (
          <figure key={item.id} className="glass flex flex-col rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-ink)] text-xs text-[var(--color-mute)]"
                role="img"
                aria-label={item.photoAlt}
              >
                Photo
              </div>
              <div>
                <figcaption className="font-semibold text-[var(--color-mist)]">{item.name}</figcaption>
                <p className="text-xs text-[var(--color-mute)]">
                  {item.position} · {item.company}
                </p>
              </div>
            </div>
            <Stars rating={item.rating} />
            <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-[var(--color-mute)]">
              “{item.quote}”
            </blockquote>
            {item.placeholder ? (
              <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-[var(--color-accent)]">
                Placeholder — replace
              </p>
            ) : null}
          </figure>
        ))}
      </div>
      <div className="mt-10">
        <Button to={CTA.primary.href}>{CTA.primary.label}</Button>
      </div>
    </Section>
  );
}
