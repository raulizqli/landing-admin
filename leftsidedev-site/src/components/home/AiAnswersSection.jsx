import { AI_ANSWERS } from '../../content/aiAnswers';
import Section from '../ui/Section';

/**
 * Factual Q&A blocks for AI search engines (and humans who skim).
 */
export default function AiAnswersSection() {
  return (
    <Section
      id="about-leftsidedev"
      eyebrow="About LeftSideDev"
      title="Facts for humans and AI search"
      description="Concise answers to the questions teams and answer engines ask most often."
      className="border-t border-[var(--color-line)]"
    >
      <div className="grid gap-6 md:grid-cols-2">
        {AI_ANSWERS.map((block) => (
          <article key={block.id} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-ink)]/40 p-5">
            <h3 className="font-display text-lg font-semibold text-[var(--color-mist)]">{block.question}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-mute)]">{block.answer}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
