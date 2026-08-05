import { Navigate, useParams } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import Button from '../components/ui/Button';
import FinalCta from '../components/home/FinalCta';
import DetailPageLayout from '../components/layout/DetailPageLayout';
import { getIndustryBySlug } from '../content/industries';
import { CTA } from '../content/site';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema } from '../utils/schema';

export default function IndustryDetailPage() {
  const { slug } = useParams();
  const industry = getIndustryBySlug(slug);
  if (!industry) return <Navigate to="/industries" replace />;

  const meta = buildPageMeta({
    title: `${industry.title} Software & Automation`,
    description: industry.description,
    path: `/industries/${industry.slug}`,
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Industries', path: '/industries' },
            { name: industry.title, path: `/industries/${industry.slug}` },
          ]),
        ]}
      />
      <DetailPageLayout
        eyebrow="Industry"
        title={industry.title}
        summary={industry.description}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Industries', path: '/industries' },
          { name: industry.title },
        ]}
      >
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="font-display text-2xl font-semibold">Common software solutions</h2>
            <ul className="mt-4 space-y-3">
              {industry.solutions.map((item) => (
                <li key={item} className="flex gap-3 text-[var(--color-mute)]">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to={CTA.primary.href}>{CTA.primary.label}</Button>
              <Button to="/portfolio" variant="secondary">
                View Our Work
              </Button>
            </div>
          </div>
          <aside className="glass h-fit rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Next step
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-mute)]">
              Tell us how {industry.title.toLowerCase()} operations run today. We will map automation and
              product opportunities in a free consultation.
            </p>
            <div className="mt-5">
              <Button to={CTA.estimate.href} variant="secondary">
                {CTA.estimate.label}
              </Button>
            </div>
          </aside>
        </div>
      </DetailPageLayout>
      <FinalCta />
    </>
  );
}
