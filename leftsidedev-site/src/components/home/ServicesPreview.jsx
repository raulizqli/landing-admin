import { Link } from 'react-router-dom';
import { AGENCY_SERVICES, getAgencyServicePath } from '../../content/agencyServices';
import { CTA } from '../../content/site';
import Section from '../ui/Section';
import Button from '../ui/Button';

export default function ServicesPreview() {
  return (
    <Section
      id="services"
      eyebrow="Services"
      title="Custom software, AI, and platforms that move the business"
      description="Each engagement is scoped around a concrete problem: automate work, ship a product, modernize a system, or integrate the stack you already run."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {AGENCY_SERVICES.map((service) => (
          <Link
            key={service.slug}
            to={getAgencyServicePath(service)}
            className="glass group flex flex-col rounded-2xl p-5 transition hover:border-[var(--color-accent)]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            <h3 className="font-display text-xl font-semibold text-[var(--color-mist)] group-hover:text-[var(--color-accent)]">
              {service.title}
            </h3>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
              Problem
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-mute)]">{service.problem}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
              Business benefits
            </p>
            <ul className="mt-1 space-y-1">
              {service.benefits.map((b) => (
                <li key={b} className="flex gap-2 text-sm text-[var(--color-mute)]">
                  <span className="text-[var(--color-accent)]" aria-hidden="true">
                    ✓
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
              Technologies
            </p>
            <p className="mt-1 text-sm text-[var(--color-mist)]/90">{service.technologies.join(' · ')}</p>
          </Link>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button to="/services">Explore all services</Button>
        <Button to={CTA.estimate.href} variant="secondary">
          {CTA.estimate.label}
        </Button>
      </div>
    </Section>
  );
}
