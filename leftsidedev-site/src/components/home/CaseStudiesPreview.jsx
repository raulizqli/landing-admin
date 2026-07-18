import { Link } from 'react-router-dom';
import { CASE_STUDIES } from '../../content/caseStudies';
import Section from '../ui/Section';
import Button from '../ui/Button';

export default function CaseStudiesPreview() {
  return (
    <Section
      eyebrow="Case studies"
      title="Outcomes you can quote"
      description="Problem → Solution → Architecture → Results. Built for buyers and for AI engines that cite sources."
      className="bg-[var(--color-ink-elevated)]/50"
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {CASE_STUDIES.map((study) => (
          <article key={study.slug} className="glass flex flex-col rounded-2xl p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-accent)]">{study.industry}</p>
            <h3 className="mt-3 font-display text-xl font-semibold leading-snug">
              <Link to={`/case-studies/${study.slug}`} className="hover:text-[var(--color-accent)]">
                {study.title}
              </Link>
            </h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--color-mute)]">{study.summary}</p>
            <p className="mt-4 text-sm font-semibold text-[var(--color-mist)]">
              {study.results[0]?.value} · {study.results[0]?.label}
            </p>
          </article>
        ))}
      </div>
      <div className="mt-10">
        <Button to="/case-studies" variant="secondary">
          View all case studies
        </Button>
      </div>
    </Section>
  );
}
