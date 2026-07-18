import { Link, Navigate, useParams } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import FinalCta from '../components/home/FinalCta';
import { getCaseStudyBySlug } from '../content/caseStudies';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema } from '../utils/schema';

export default function CaseStudyDetailPage() {
  const { slug } = useParams();
  const study = getCaseStudyBySlug(slug);
  if (!study) return <Navigate to="/case-studies" replace />;

  const meta = buildPageMeta({
    title: study.title,
    description: study.summary,
    path: `/case-studies/${study.slug}`,
  });

  const flow = [
    { label: 'Problem', body: study.problem },
    { label: 'Solution', body: study.solution },
    { label: 'Architecture', body: study.architecture.join(' → ') },
    {
      label: 'Results',
      body: study.results.map((item) => `${item.label}: ${item.value}`).join(' · '),
    },
  ];

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Case Studies', path: '/case-studies' },
            { name: study.client, path: `/case-studies/${study.slug}` },
          ]),
        ]}
      />

      <section className="border-b border-[var(--color-line)] px-5 pb-14 pt-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-accent)]">
            <Link to="/case-studies" className="hover:underline">
              Case studies
            </Link>{' '}
            / {study.industry}
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-3xl font-bold tracking-tight sm:text-5xl">
            {study.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg text-[var(--color-mute)]">{study.summary}</p>
          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="glass rounded-2xl p-4">
              <dt className="text-xs text-[var(--color-mute)]">Client</dt>
              <dd className="mt-1 font-semibold">{study.client}</dd>
            </div>
            <div className="glass rounded-2xl p-4">
              <dt className="text-xs text-[var(--color-mute)]">Industry</dt>
              <dd className="mt-1 font-semibold">{study.industry}</dd>
            </div>
            <div className="glass rounded-2xl p-4">
              <dt className="text-xs text-[var(--color-mute)]">Timeline</dt>
              <dd className="mt-1 font-semibold">{study.timeline}</dd>
            </div>
          </dl>
        </div>
      </section>

      <Section title="Narrative">
        <ol className="space-y-4">
          {flow.map((step, index) => (
            <li key={step.label} className="glass rounded-2xl p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                {index + 1}. {step.label}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-mute)] sm:text-base">{step.body}</p>
              {index < flow.length - 1 && (
                <p className="mt-4 text-center text-[var(--color-accent)]" aria-hidden="true">
                  ↓
                </p>
              )}
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="Stack" title="Technologies used" className="pt-0">
        <div className="flex flex-wrap gap-2">
          {study.technologies.map((tech) => (
            <span key={tech} className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm">
              {tech}
            </span>
          ))}
        </div>
      </Section>

      <Section eyebrow="Architecture" title="System building blocks" className="pt-0">
        <ul className="grid gap-3 md:grid-cols-2">
          {study.architecture.map((item) => (
            <li key={item} className="glass rounded-xl px-4 py-3 text-sm text-[var(--color-mute)]">
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section eyebrow="Evidence" title="Captures & proof points" className="pt-0">
        <div className="grid gap-4 md:grid-cols-2">
          {study.screenshots.map((shot) => (
            <figure key={shot.caption} className="glass overflow-hidden rounded-2xl">
              <div className="flex h-48 items-center justify-center bg-[linear-gradient(135deg,rgba(124,255,178,0.12),rgba(61,139,255,0.12))] text-sm text-[var(--color-mute)]">
                {shot.alt}
              </div>
              <figcaption className="px-4 py-3 text-sm text-[var(--color-mute)]">{shot.caption}</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section eyebrow="Testimonial" title="Client voice" className="pt-0">
        <blockquote className="glass max-w-3xl rounded-2xl p-6 sm:p-8">
          <p className="font-display text-xl leading-relaxed text-[var(--color-mist)]">
            “{study.testimonial.quote}”
          </p>
          <footer className="mt-4 text-sm text-[var(--color-mute)]">
            {study.testimonial.author} · {study.testimonial.role}
          </footer>
        </blockquote>
      </Section>

      <FinalCta />
    </>
  );
}
