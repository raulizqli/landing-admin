import { Link, Navigate, useParams } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import Button from '../components/ui/Button';
import FinalCta from '../components/home/FinalCta';
import { getPortfolioBySlug } from '../content/portfolio';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema, softwareApplicationSchema } from '../utils/schema';

export default function PortfolioDetailPage() {
  const { slug } = useParams();
  const project = getPortfolioBySlug(slug);
  if (!project) return <Navigate to="/portfolio" replace />;

  const meta = buildPageMeta({
    title: project.title,
    description: project.summary,
    path: `/portfolio/${project.slug}`,
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          softwareApplicationSchema({
            name: project.title,
            description: project.summary,
            url: `/portfolio/${project.slug}`,
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Portfolio', path: '/portfolio' },
            { name: project.title, path: `/portfolio/${project.slug}` },
          ]),
        ]}
      />

      <section className="border-b border-[var(--color-line)] px-5 pb-14 pt-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-accent)]">
            <Link to="/portfolio" className="hover:underline">
              Portfolio
            </Link>{' '}
            / {project.title}
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">{project.title}</h1>
          {project.industry ? (
            <p className="mt-3 text-sm text-[var(--color-accent)]">{project.industry}</p>
          ) : null}
          <p className="mt-5 max-w-2xl text-lg text-[var(--color-mute)]">{project.summary}</p>
          {project.challenge ? (
            <div className="mt-8 max-w-2xl space-y-4 text-sm text-[var(--color-mute)]">
              <p>
                <span className="font-semibold text-[var(--color-mist)]">Challenge. </span>
                {project.challenge}
              </p>
              <p>
                <span className="font-semibold text-[var(--color-mist)]">Solution. </span>
                {project.solution}
              </p>
              <p>
                <span className="font-semibold text-[var(--color-mist)]">Outcome. </span>
                {project.outcome}
              </p>
            </div>
          ) : null}
          {project.imagePlaceholder ? (
            <div
              className="mt-8 flex min-h-[180px] max-w-3xl items-center justify-center rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-ink)]/60 px-4 text-center text-xs text-[var(--color-mute)]"
              role="img"
              aria-label={project.imageAlt}
            >
              Image placeholder — replace with production screenshot
            </div>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            {project.demoUrl ? (
              <Button href={project.demoUrl} external>
                Open demo
              </Button>
            ) : (
              <Button to="/contact" variant="secondary">
                Request a private demo
              </Button>
            )}
            {project.githubUrl ? (
              <Button href={project.githubUrl} external variant="secondary">
                View GitHub
              </Button>
            ) : null}
            {project.videoUrl ? (
              <Button href={project.videoUrl} external variant="ghost">
                Watch video
              </Button>
            ) : (
              <span className="self-center text-sm text-[var(--color-mute)]">Video walkthrough on request</span>
            )}
          </div>
        </div>
      </section>

      <Section eyebrow="Architecture" title="How it is built">
        <ol className="space-y-3">
          {project.architecture.map((step, index) => (
            <li key={step} className="glass rounded-2xl px-5 py-4 text-sm text-[var(--color-mute)]">
              <span className="mr-2 font-semibold text-[var(--color-accent)]">{index + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="Stack" title="Technologies" className="pt-0">
        <div className="flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <span key={tech} className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm">
              {tech}
            </span>
          ))}
        </div>
      </Section>

      <Section eyebrow="Capabilities" title="Functionalities" className="pt-0">
        <ul className="grid gap-3 md:grid-cols-2">
          {project.features.map((feature) => (
            <li key={feature} className="glass rounded-xl px-4 py-3 text-sm text-[var(--color-mute)]">
              {feature}
            </li>
          ))}
        </ul>
      </Section>

      <Section eyebrow="Results" title="Outcomes" className="pt-0">
        <ul className="space-y-2">
          {project.results.map((result) => (
            <li key={result} className="text-sm text-[var(--color-mute)] sm:text-base">
              • {result}
            </li>
          ))}
        </ul>
      </Section>

      <FinalCta />
    </>
  );
}
