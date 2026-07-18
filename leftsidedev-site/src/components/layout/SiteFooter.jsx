import { Link } from 'react-router-dom';
import { NAV_LINKS, SITE, SPECIALIZATIONS } from '../../content/site';
import Button from '../ui/Button';

export default function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-line)] bg-[var(--color-ink-elevated)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.2fr_1fr_1fr] lg:px-12">
        <div>
          <p className="font-display text-2xl font-bold">{SITE.name}</p>
          <p className="mt-2 text-sm uppercase tracking-[0.18em] text-[var(--color-accent)]">{SITE.brand}</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--color-mute)]">{SITE.tagline}</p>
          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              window.alert('Thanks — newsletter signup will connect to your provider next.');
            }}
          >
            <label className="sr-only" htmlFor="newsletter-email">
              Email for newsletter
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="Work email"
              className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-ink)] px-4 py-3 text-sm text-[var(--color-mist)] placeholder:text-[var(--color-mute)]"
            />
            <Button type="submit" className="shrink-0">
              Subscribe
            </Button>
          </form>
          <p className="mt-2 text-xs text-[var(--color-mute)]">
            Get the free AI implementation checklist. No spam.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--color-mist)]">Explore</p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--color-mute)]">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="hover:text-[var(--color-accent)]">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/estimate" className="hover:text-[var(--color-accent)]">
                Estimate project
              </Link>
            </li>
            <li>
              <Link to="/resources" className="hover:text-[var(--color-accent)]">
                Free AI guide
              </Link>
            </li>
            <li>
              <a href="/rss.xml" className="hover:text-[var(--color-accent)]">
                RSS feed
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--color-mist)]">Specializations</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {SPECIALIZATIONS.slice(0, 8).map((item) => (
              <li
                key={item}
                className="rounded-lg border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-mute)]"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-[var(--color-mute)]">
            <a href={`mailto:${SITE.email}`} className="text-[var(--color-accent)] hover:underline">
              {SITE.email}
            </a>
            <br />
            {SITE.location}
          </p>
        </div>
      </div>
      <div className="border-t border-[var(--color-line)] px-5 py-5 text-center text-xs text-[var(--color-mute)] sm:px-8">
        © {new Date().getFullYear()} {SITE.name}. All rights reserved.
      </div>
    </footer>
  );
}
