import { Link } from 'react-router-dom';
import { SERVICES } from '../../content/services';
import Section from '../ui/Section';
import Button from '../ui/Button';

export default function ServicesPreview() {
  return (
    <Section
      id="services"
      eyebrow="Services"
      title="Specialized engineering—not a generic software shop"
      description="Each engagement is scoped around a concrete system: agents, retrieval, MCP, automation, or full product builds."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service) => (
          <Link
            key={service.slug}
            to={`/services/${service.slug}`}
            className="glass group rounded-2xl p-5 transition hover:border-[var(--color-accent)]/40"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-accent)]">{service.eyebrow}</p>
            <h3 className="mt-3 font-display text-xl font-semibold group-hover:text-[var(--color-accent)]">
              {service.shortTitle}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-mute)]">{service.summary}</p>
          </Link>
        ))}
      </div>
      <div className="mt-10">
        <Button to="/services" variant="secondary">
          Explore all services
        </Button>
      </div>
    </Section>
  );
}
