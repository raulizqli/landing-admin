import { Link } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import FinalCta from '../components/home/FinalCta';
import { CASE_STUDIES } from '../content/caseStudies';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema } from '../utils/schema';

export default function CaseStudiesPage() {
  const meta = buildPageMeta({
    title: 'Case Studies',
    description:
      'LeftSideDev case studies: AI agents, RAG systems, and Firebase products with measurable results.',
    path: '/case-studies',
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Case Studies', path: '/case-studies' },
          ]),
        ]}
      />
      <Section
        eyebrow="Case studies"
        title="Problem → Solution → Architecture → Results"
        description="Each study is written so buyers—and AI answer engines—can extract the outcome without marketing filler."
      >
        <div className="space-y-5">
          {CASE_STUDIES.map((study) => (
            <article key={study.slug} className="glass rounded-2xl p-6 sm:p-8">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-accent)]">
                {study.industry} · {study.client}
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">
                <Link to={`/case-studies/${study.slug}`} className="hover:text-[var(--color-accent)]">
                  {study.title}
                </Link>
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--color-mute)] sm:text-base">
                {study.summary}
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                {study.results.slice(0, 3).map((result) => (
                  <span key={result.label} className="rounded-lg border border-[var(--color-line)] px-3 py-1.5">
                    <strong className="text-[var(--color-mist)]">{result.value}</strong>
                    <span className="text-[var(--color-mute)]"> · {result.label}</span>
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Section>
      <FinalCta />
    </>
  );
}
