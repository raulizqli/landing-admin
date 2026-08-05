import { CTA, VALUE_PROPS } from '../../content/site';
import Section from '../ui/Section';
import Button from '../ui/Button';

export default function ValuePropsSection() {
  return (
    <Section
      id="why-leftsidedev"
      eyebrow="Why LeftSideDev"
      title="A software partner built for operators who need outcomes"
      description="We communicate clearly, ship senior work, and design systems that stay maintainable after handoff."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {VALUE_PROPS.map((item) => (
          <article key={item.title} className="glass rounded-2xl p-5">
            <p className="text-lg text-[var(--color-accent)]" aria-hidden="true">
              {item.icon}
            </p>
            <h3 className="mt-3 font-display text-lg font-semibold text-[var(--color-mist)]">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-mute)]">{item.description}</p>
          </article>
        ))}
      </div>
      <div className="mt-10">
        <Button to={CTA.build.href}>{CTA.build.label}</Button>
      </div>
    </Section>
  );
}
