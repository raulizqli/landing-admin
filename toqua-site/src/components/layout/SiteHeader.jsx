import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { getAdminSignupUrl } from '../../content/site';
import { useLang } from '../../hooks/useLang';
import ToquaLogo from '../brand/ToquaLogo';
import Button from '../ui/Button';
import LanguageSwitcher from './LanguageSwitcher';

export default function SiteHeader() {
  const { lang, path, t } = useLang();
  const [open, setOpen] = useState(false);
  const signupUrl = getAdminSignupUrl();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(252,251,249,0.86)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8 lg:px-12">
        <Link to={path()} className="min-w-0 shrink" onClick={() => setOpen(false)}>
          <ToquaLogo variant="lockupTagline" lang={lang} size="md" priority />
        </Link>

        <nav className="hidden items-center gap-5 xl:flex" aria-label="Primary">
          {t.nav.links.map((link) => (
            <NavLink
              key={link.path}
              to={path(link.path)}
              className={({ isActive }) =>
                [
                  'text-sm transition',
                  isActive
                    ? 'font-semibold text-[var(--text-purple)]'
                    : 'text-[var(--mute)] hover:text-[var(--text-purple)]',
                ].join(' ')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          <Button href={signupUrl} external>
            {t.nav.ctaPrimary}
          </Button>
        </div>

        <button
          type="button"
          className="surface rounded-lg px-3 py-2 text-sm lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? t.nav.closeMenu : t.nav.menu}
        </button>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t border-[var(--line)] px-5 py-4 lg:hidden">
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            {t.nav.links.map((link) => (
              <NavLink
                key={link.path}
                to={path(link.path)}
                className="text-base text-[var(--text)]"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <div className="flex items-center gap-3 pt-2">
              <LanguageSwitcher />
            </div>
            <Button href={signupUrl} external className="mt-1" onClick={() => setOpen(false)}>
              {t.nav.ctaPrimary}
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
