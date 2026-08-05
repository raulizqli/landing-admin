import { TECH_CARDS, PROCESS_STEPS, METHODOLOGIES, CTA } from '../../content/site';
import Section from '../ui/Section';
import Button from '../ui/Button';

export default function TrustSection() {
  return (
    <>
      <Section
        id="technology"
        eyebrow="Technology"
        title="A modern stack chosen for maintainability"
        description="We pick technologies for team velocity, operability, and longevity—not novelty for its own sake."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TECH_CARDS.map((tech) => (
            <article key={tech.name} className="glass rounded-2xl p-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-ink)]/80 font-display text-sm font-bold text-[var(--color-accent)]"
                aria-hidden="true"
              >
                {tech.name.slice(0, 2).toUpperCase()}
              </div>
              <h3 className="mt-3 font-display text-base font-semibold text-[var(--color-mist)]">{tech.name}</h3>
              <p className="mt-1 text-sm text-[var(--color-mute)]">{tech.explanation}</p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--color-mist)]/80">
                <span className="font-semibold text-[var(--color-accent)]">Business use:</span> {tech.businessUse}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-10">
          <Button to={CTA.estimate.href} variant="secondary">
            {CTA.estimate.label}
          </Button>
        </div>
      </Section>

      <Section
        id="process"
        className="pt-0"
        eyebrow="Development process"
        title="A timeline clients can follow"
        description="Discovery is short. Architecture is explicit. Delivery is iterative with demos you can judge."
      >
        <ol className="relative grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PROCESS_STEPS.map((step, index) => (
            <li key={step.title} className="glass relative rounded-2xl p-5">
              <p className="text-xs font-semibold text-[var(--color-accent)]">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-3 font-display text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-mute)]">{step.description}</p>
            </li>
          ))}
        </ol>
        <ul className="mt-8 grid gap-2 sm:grid-cols-2">
          {METHODOLOGIES.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-[var(--color-mute)]">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <Button to={CTA.primary.href}>{CTA.primary.label}</Button>
        </div>
      </Section>
    </>
  );
}
