import { Link } from 'react-router-dom';
import { PORTFOLIO } from '../../content/portfolio';
import { CTA } from '../../content/site';
import Section from '../ui/Section';
import Button from '../ui/Button';

export default function PortfolioPreview() {
  return (
    <Section
      id="work"
      eyebrow="Projects"
      title="Selected work with measurable outcomes"
      description="Real product systems. Image placeholders are marked for replacement with production screenshots."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {PORTFOLIO.map((project) => (
          <article key={project.slug} className="glass flex flex-col overflow-hidden rounded-2xl">
            <div
              className="flex min-h-[140px] items-center justify-center border-b border-[var(--color-line)] bg-[var(--color-ink)]/80 px-4 text-center text-xs text-[var(--color-mute)]"
              role="img"
              aria-label={project.imageAlt}
            >
              {project.imagePlaceholder ? 'Image placeholder — replace' : project.title}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-accent)]">{project.industry}</p>
              <h3 className="mt-2 font-display text-xl font-semibold">
                <Link
                  to={`/portfolio/${project.slug}`}
                  className="hover:text-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                >
                  {project.title}
                </Link>
              </h3>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-mute)]">Challenge</p>
              <p className="mt-1 text-sm text-[var(--color-mute)]">{project.challenge}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-mute)]">Solution</p>
              <p className="mt-1 text-sm text-[var(--color-mute)]">{project.solution}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-mute)]">Technologies</p>
              <p className="mt-1 text-sm text-[var(--color-mist)]/90">{(project.technologies || project.stack).join(' · ')}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-mute)]">Outcome</p>
              <p className="mt-1 text-sm text-[var(--color-mist)]">{project.outcome}</p>
              <div className="mt-5">
                <Button to={project.ctaHref || `/portfolio/${project.slug}`} variant="secondary">
                  {project.ctaLabel || 'View project'}
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button to="/portfolio">{CTA.secondary.label}</Button>
        <Button to="/case-studies" variant="secondary">
          Case studies
        </Button>
      </div>
    </Section>
  );
}
