import { Link } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import FinalCta from '../components/home/FinalCta';
import { PORTFOLIO } from '../content/portfolio';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema } from '../utils/schema';

export default function PortfolioPage() {
  const meta = buildPageMeta({
    title: 'Portfolio',
    description: 'Interactive portfolio: demos, architecture, stack, and results from LeftSideDev projects.',
    path: '/portfolio',
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Portfolio', path: '/portfolio' },
          ]),
        ]}
      />
      <Section
        eyebrow="Portfolio"
        title="Interactive project deep-dives"
        description="More than screenshots—each project exposes demo links, architecture, stack, capabilities, and outcomes."
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {PORTFOLIO.map((project) => (
            <article key={project.slug} className="glass flex flex-col rounded-2xl p-6">
              <h2 className="font-display text-2xl font-semibold">
                <Link to={`/portfolio/${project.slug}`} className="hover:text-[var(--color-accent)]">
                  {project.title}
                </Link>
              </h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--color-mute)]">{project.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.stack.slice(0, 4).map((tech) => (
                  <span key={tech} className="rounded-md border border-[var(--color-line)] px-2 py-1 text-xs">
                    {tech}
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
