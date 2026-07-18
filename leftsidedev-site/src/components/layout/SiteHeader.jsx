import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { CTA, NAV_LINKS, SITE } from '../../content/site';
import Button from '../ui/Button';

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[rgba(7,11,10,0.8)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
        <Link to="/" className="group flex min-w-0 flex-col" onClick={() => setOpen(false)}>
          <span className="font-display text-lg font-bold tracking-tight text-[var(--color-mist)] sm:text-xl">
            {SITE.name}
          </span>
          <span className="truncate text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-accent)]">
            {SITE.brand}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                [
                  'text-sm transition',
                  isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-mute)] hover:text-[var(--color-mist)]',
                ].join(' ')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Button to={CTA.primary.href}>{CTA.primary.label}</Button>
        </div>

        <button
          type="button"
          className="glass rounded-lg px-3 py-2 text-sm lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </button>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t border-[var(--color-line)] px-5 py-4 lg:hidden">
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="text-base text-[var(--color-mist)]"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <Button to={CTA.primary.href} className="mt-2" onClick={() => setOpen(false)}>
              {CTA.primary.label}
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
