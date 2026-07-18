import { Link, Navigate, useParams } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import Button from '../components/ui/Button';
import FinalCta from '../components/home/FinalCta';
import { getServiceBySlug } from '../content/services';
import { CTA, SITE } from '../content/site';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema, faqSchema, serviceSchema } from '../utils/schema';

function ProseList({ items }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-relaxed text-[var(--color-mute)] sm:text-base">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const service = getServiceBySlug(slug);
  if (!service) return <Navigate to="/services" replace />;

  const meta = buildPageMeta({
    title: service.title,
    description: service.metaDescription,
    path: `/services/${service.slug}`,
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          serviceSchema(service),
          faqSchema(service.faqs),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Services', path: '/services' },
            { name: service.shortTitle, path: `/services/${service.slug}` },
          ]),
        ]}
      />

      <section className="border-b border-[var(--color-line)] px-5 pb-14 pt-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
            <Link to="/services" className="hover:underline">
              Services
            </Link>{' '}
            / {service.shortTitle}
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
            {service.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-mute)]">{service.summary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to={CTA.primary.href}>{CTA.primary.label}</Button>
            <Button to="/case-studies" variant="secondary">
              View Case Studies
            </Button>
          </div>
        </div>
      </section>

      <Section eyebrow="What is it?" title={`What is ${service.shortTitle}?`}>
        <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-[var(--color-mute)] sm:text-base">
          <p>{service.summary}</p>
          <p>
            At {SITE.name}, {service.shortTitle.toLowerCase()} engagements are treated as production software:
            explicit interfaces, security boundaries, observability, and a path from pilot to scaled operation.
            We avoid slideware roadmaps that never survive contact with real data and real users.
          </p>
          <p>
            <strong className="text-[var(--color-mist)]">Who it is for:</strong> {service.whoFor}
          </p>
        </div>
      </Section>

      <Section eyebrow="Problems" title="Problems we solve" className="pt-0">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <ProseList items={service.problems} />
          <div className="glass rounded-2xl p-6 text-sm leading-relaxed text-[var(--color-mute)]">
            <p className="font-semibold text-[var(--color-mist)]">Why this stalls teams</p>
            <p className="mt-3">
              Tools accumulate faster than ownership. Prototypes impress in a demo and fail under permissions,
              messy data, or on-call reality. Our work starts by naming the operational failure mode—not the
              model brand—so the solution stays accountable after launch.
            </p>
          </div>
        </div>
      </Section>

      <Section eyebrow="Benefits" title="Benefits for your team" className="pt-0">
        <ProseList items={service.benefits} />
      </Section>

      <Section eyebrow="Technologies" title="Technologies we use" className="pt-0">
        <div className="flex flex-wrap gap-2">
          {service.technologies.map((tech) => (
            <span key={tech} className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm">
              {tech}
            </span>
          ))}
        </div>
      </Section>

      <Section eyebrow="Architecture" title="Reference architecture" className="pt-0">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <ProseList items={service.architecture} />
          <aside className="glass rounded-2xl p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-accent)]">Design principle</p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-mute)]">
              Separate reasoning from side effects. Keep tools typed, permissions least-privilege, and every
              important action observable. That is how AI features stay maintainable when the third integration
              arrives—not only the first demo.
            </p>
          </aside>
        </div>
      </Section>

      <Section eyebrow="Process" title="Implementation process" className="pt-0">
        <ol className="space-y-4">
          {service.process.map((step, index) => (
            <li key={step} className="glass rounded-2xl p-5">
              <p className="text-xs font-semibold text-[var(--color-accent)]">Step {index + 1}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-mute)] sm:text-base">{step}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="ROI" title="Expected ROI" className="pt-0">
        <div className="glass max-w-3xl rounded-2xl p-6 text-sm leading-relaxed text-[var(--color-mute)] sm:text-base">
          <p>{service.roi}</p>
          <p className="mt-4">
            We establish baselines in discovery (cycle time, error rate, cost-to-serve) so post-launch reporting
            is factual. If a use case cannot clear a clear ROI or risk bar, we say so early.
          </p>
        </div>
      </Section>

      <Section eyebrow="Alternatives" title="Comparison with alternatives" className="pt-0">
        <div className="max-w-3xl text-sm leading-relaxed text-[var(--color-mute)] sm:text-base">
          <p>{service.comparison}</p>
        </div>
      </Section>

      <Section eyebrow="FAQ" title="Frequently asked questions" className="pt-0">
        <div className="space-y-4">
          {service.faqs.map((item) => (
            <details key={item.question} className="glass rounded-2xl p-5">
              <summary className="cursor-pointer font-semibold text-[var(--color-mist)]">
                {item.question}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-mute)]">{item.answer}</p>
            </details>
          ))}
        </div>
      </Section>

      <FinalCta />
    </>
  );
}
