import { Link } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import Button from '../components/ui/Button';
import FinalCta from '../components/home/FinalCta';
import { INDUSTRIES } from '../content/industries';
import { CTA, SITE } from '../content/site';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema } from '../utils/schema';

export default function IndustriesPage() {
  const meta = buildPageMeta({
    title: 'Industries We Serve',
    description:
      'LeftSideDev builds custom software and AI automation for healthcare, education, construction, manufacturing, retail, professional services, finance, and logistics.',
    path: '/industries',
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Industries', path: '/industries' },
          ]),
        ]}
      />
      <Section
        eyebrow="Industries"
        title="Industries we serve"
        description={`Software shaped to how ${SITE.name} clients actually operate—field, clinic, plant, store, or office.`}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INDUSTRIES.map((industry) => (
            <Link
              key={industry.slug}
              to={`/industries/${industry.slug}`}
              className="glass rounded-2xl p-5 transition hover:border-[var(--color-accent)]/40"
            >
              <p className="text-xl text-[var(--color-accent)]" aria-hidden="true">
                {industry.icon}
              </p>
              <h2 className="mt-3 font-display text-xl font-semibold">{industry.title}</h2>
              <p className="mt-2 text-sm text-[var(--color-mute)]">{industry.description}</p>
            </Link>
          ))}
        </div>
        <div className="mt-10">
          <Button to={CTA.primary.href}>{CTA.primary.label}</Button>
        </div>
      </Section>
      <FinalCta />
    </>
  );
}
