import { CTA } from '../../content/site';
import Button from '../ui/Button';

export default function FinalCta({
  title = "Let's build your project",
  description = 'Schedule a free consultation to map goals and constraints—or get a project estimate in minutes.',
}) {
  return (
    <section className="px-5 py-20 sm:px-8 lg:px-12" aria-labelledby="final-cta-heading">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-[var(--color-line)] bg-[linear-gradient(135deg,rgba(124,255,178,0.12),rgba(61,139,255,0.10)_45%,rgba(7,11,10,0.9))] px-6 py-14 sm:px-12">
        <div className="absolute inset-0 grid-noise opacity-60" aria-hidden="true" />
        <div className="relative max-w-2xl">
          <h2 id="final-cta-heading" className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-mute)] sm:text-lg">
            {description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button to={CTA.primary.href}>{CTA.primary.label}</Button>
            <Button to={CTA.estimate.href} variant="secondary">
              {CTA.estimate.label}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
