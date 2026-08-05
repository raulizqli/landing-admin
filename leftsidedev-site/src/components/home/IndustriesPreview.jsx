import { Link } from 'react-router-dom';
import { INDUSTRIES } from '../../content/industries';
import { CTA } from '../../content/site';
import Section from '../ui/Section';
import Button from '../ui/Button';

export default function IndustriesPreview() {
  return (
    <Section
      id="industries"
      eyebrow="Industries We Serve"
      title="Domain-aware software for real operating constraints"
      description="We adapt architecture and UX to how your industry works—compliance, field workflows, inventory, or client delivery."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {INDUSTRIES.map((industry) => (
          <Link
            key={industry.slug}
            to={`/industries/${industry.slug}`}
            className="glass group rounded-2xl p-5 transition hover:border-[var(--color-accent)]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            <p className="text-xl text-[var(--color-accent)]" aria-hidden="true">
              {industry.icon}
            </p>
            <h3 className="mt-3 font-display text-lg font-semibold group-hover:text-[var(--color-accent)]">
              {industry.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-mute)] line-clamp-3">
              {industry.description}
            </p>
          </Link>
        ))}
      </div>
      <div className="mt-10">
        <Button to="/industries" variant="secondary">
          View industries
        </Button>
        <span className="mx-3 hidden text-[var(--color-mute)] sm:inline" aria-hidden="true">
          ·
        </span>
        <Button to={CTA.engineer.href} variant="ghost" className="mt-3 sm:mt-0">
          {CTA.engineer.label}
        </Button>
      </div>
    </Section>
  );
}
