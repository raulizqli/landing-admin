import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../../hooks/useLang';

export default function LanguageSwitcher({ className = '' }) {
  const { lang, swapTo, t } = useLang();
  const location = useLocation();

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] p-1 text-xs font-semibold ${className}`}
      role="group"
      aria-label={t.nav.languageLabel}
    >
      <Link
        to={swapTo(location.pathname, 'es')}
        className={[
          'rounded-full px-2.5 py-1 transition',
          lang === 'es'
            ? 'bg-[var(--text-purple)] text-white'
            : 'text-[var(--mute)] hover:text-[var(--text-purple)]',
        ].join(' ')}
        hrefLang="es"
      >
        ES
      </Link>
      <Link
        to={swapTo(location.pathname, 'en')}
        className={[
          'rounded-full px-2.5 py-1 transition',
          lang === 'en'
            ? 'bg-[var(--text-purple)] text-white'
            : 'text-[var(--mute)] hover:text-[var(--text-purple)]',
        ].join(' ')}
        hrefLang="en"
      >
        EN
      </Link>
    </div>
  );
}
