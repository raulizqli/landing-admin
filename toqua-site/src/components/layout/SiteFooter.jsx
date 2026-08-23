import { Link } from 'react-router-dom';
import { SITE, getAdminSignupUrl } from '../../content/site';
import { useLang } from '../../hooks/useLang';
import ToquaLogo from '../brand/ToquaLogo';
import Button from '../ui/Button';
import LanguageSwitcher from './LanguageSwitcher';

export default function SiteFooter() {
  const { lang, path, t } = useLang();
  const signupUrl = getAdminSignupUrl();

  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-12">
        <div>
          <ToquaLogo variant="wordmarkQ" lang={lang} size="md" />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--mute)]">
            {SITE.tagline[lang]}
          </p>
          <div className="mt-5">
            <Button href={signupUrl} external>
              {t.nav.ctaPrimary}
            </Button>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--text)]">{t.nav.footerExplore}</p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--mute)]">
            {t.nav.links.map((link) => (
              <li key={link.path}>
                <Link to={path(link.path)} className="hover:text-[var(--text-purple)]">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--text)]">{t.nav.footerMore}</p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--mute)]">
            <li>
              <Link to={path('/resources')} className="hover:text-[var(--text-purple)]">
                {t.nav.footerResources}
              </Link>
            </li>
            <li>
              <Link to={path('/compare')} className="hover:text-[var(--text-purple)]">
                {t.nav.footerCompare}
              </Link>
            </li>
            <li>
              <a href="/rss.xml" className="hover:text-[var(--text-purple)]">
                {t.nav.footerRss}
              </a>
            </li>
          </ul>
          <p className="mt-8 text-sm font-semibold text-[var(--text)]">{t.nav.footerLegal}</p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--mute)]">
            <li>
              <Link to={path('/about')} className="hover:text-[var(--text-purple)]">
                {t.nav.footerAbout}
              </Link>
            </li>
            <li>
              <Link to={path('/privacy')} className="hover:text-[var(--text-purple)]">
                {t.nav.footerPrivacy}
              </Link>
            </li>
            <li>
              <Link to={path('/terms')} className="hover:text-[var(--text-purple)]">
                {t.nav.footerTerms}
              </Link>
            </li>
          </ul>
          <div className="mt-6">
            <LanguageSwitcher />
          </div>
          <p className="mt-6 text-sm text-[var(--mute)]">
            <a href={`mailto:${SITE.email}`} className="text-[var(--text-purple)] hover:underline">
              {SITE.email}
            </a>
            <br />
            {SITE.location[lang]}
          </p>
        </div>
      </div>
      <div className="border-t border-[var(--line)] px-5 py-5 text-center text-xs text-[var(--mute)] sm:px-8">
        © {new Date().getFullYear()} {SITE.name}. {t.nav.copyright}{' '}
        <Link to={path('/privacy')} className="hover:text-[var(--text-purple)]">
          {t.nav.footerPrivacy}
        </Link>
        {' · '}
        <Link to={path('/terms')} className="hover:text-[var(--text-purple)]">
          {t.nav.footerTerms}
        </Link>
      </div>
    </footer>
  );
}
