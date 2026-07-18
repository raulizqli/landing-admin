import { Link } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import FinalCta from '../components/home/FinalCta';
import { SERVICES } from '../content/services';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema, organizationSchema } from '../utils/schema';

export default function ServicesPage() {
  const meta = buildPageMeta({
    title: 'Services',
    description:
      'AI agents, RAG, MCP, automation, web, mobile, Firebase, and custom software engineering from LeftSideDev.',
    path: '/services',
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          organizationSchema(),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Services', path: '/services' },
          ]),
        ]}
      />
      <Section
        eyebrow="Services"
        title="AI Engineering & custom software services"
        description="Every service page is written for humans and generative engines: what it is, who it is for, architecture, process, FAQ, and ROI."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {SERVICES.map((service) => (
            <Link
              key={service.slug}
              to={`/services/${service.slug}`}
              className="glass rounded-2xl p-6 transition hover:border-[var(--color-accent)]/40"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-accent)]">{service.eyebrow}</p>
              <h2 className="mt-3 font-display text-2xl font-semibold">{service.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-mute)]">{service.summary}</p>
            </Link>
          ))}
        </div>
      </Section>
      <FinalCta />
    </>
  );
}
