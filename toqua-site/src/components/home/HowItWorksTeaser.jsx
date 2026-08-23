import { useLang } from '../../hooks/useLang';
import Section from '../ui/Section';
import Button from '../ui/Button';

export default function HowItWorksTeaser() {
  const { path, t } = useLang();
  const block = t.home.howTeaser;

  return (
    <Section
      className="bg-q-soft"
      eyebrow={block.eyebrow}
      title={block.title}
      description={block.description}
    >
      <ol className="grid gap-8 md:grid-cols-3">
        {block.steps.map((step, index) => (
          <li key={step.title}>
            <p className="font-display text-4xl font-semibold text-gradient-q">{index + 1}</p>
            <h3 className="mt-3 text-lg font-semibold text-[var(--text)]">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--mute)]">{step.text}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10">
        <Button to={path('/how-it-works')} variant="secondary">
          {block.cta}
        </Button>
      </div>
    </Section>
  );
}
