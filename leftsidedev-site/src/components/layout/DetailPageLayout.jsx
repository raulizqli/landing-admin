import { Link } from 'react-router-dom';
import Section from '../ui/Section';

/**
 * Shared chrome for service / industry / case / article detail pages.
 */
export default function DetailPageLayout({
  eyebrow,
  title,
  summary,
  breadcrumbs = [],
  children,
  aside = null,
}) {
  return (
    <>
      <section className="border-b border-[var(--color-line)] px-5 pb-12 pt-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          {breadcrumbs.length > 0 ? (
            <nav aria-label="Breadcrumb" className="mb-6 text-xs text-[var(--color-mute)]">
              <ol className="flex flex-wrap items-center gap-2">
                {breadcrumbs.map((crumb, index) => (
                  <li key={crumb.path || crumb.name} className="flex items-center gap-2">
                    {index > 0 ? <span aria-hidden="true">/</span> : null}
                    {crumb.path ? (
                      <Link to={crumb.path} className="hover:text-[var(--color-accent)]">
                        {crumb.name}
                      </Link>
                    ) : (
                      <span className="text-[var(--color-mist)]" aria-current="page">
                        {crumb.name}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {summary ? (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-mute)] sm:text-lg">
              {summary}
            </p>
          ) : null}
          {aside}
        </div>
      </section>
      <Section className="pt-12">{children}</Section>
    </>
  );
}
