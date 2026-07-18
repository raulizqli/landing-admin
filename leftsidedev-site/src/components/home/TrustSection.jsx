import { METHODOLOGIES, PROCESS_STEPS, TECH_STACK } from '../../content/site';
import Section from '../ui/Section';

export default function TrustSection() {
  return (
    <>
      <Section
        eyebrow="Trust"
        title="Technologies, process, and methods built for production AI"
        description="We show how we work before we ask for a contract—stack, delivery cadence, and the disciplines that keep AI systems operable."
      >
        <div className="flex flex-wrap gap-2">
          {TECH_STACK.map((tech) => (
            <span
              key={tech}
              className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)]/80 px-3 py-2 text-sm text-[var(--color-mist)]"
            >
              {tech}
            </span>
          ))}
        </div>
      </Section>

      <Section
        className="pt-0"
        eyebrow="How we work"
        title="A delivery process clients can follow"
        description="Discovery is short. Architecture is explicit. Delivery is iterative with demos you can judge."
      >
        <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PROCESS_STEPS.map((step, index) => (
            <li key={step.title} className="glass rounded-2xl p-5">
              <p className="text-xs font-semibold text-[var(--color-accent)]">0{index + 1}</p>
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
      </Section>
    </>
  );
}
