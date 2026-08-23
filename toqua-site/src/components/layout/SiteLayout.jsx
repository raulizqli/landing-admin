import { Outlet, useLocation, Navigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import { isSupportedLang, DEFAULT_LANG } from '../../content/site';
import { useLang } from '../../hooks/useLang';

export default function SiteLayout() {
  const location = useLocation();
  const { lang } = useParams();
  const { t } = useLang();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  if (lang && !isSupportedLang(lang)) {
    return <Navigate to={`/${DEFAULT_LANG}`} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[var(--text-purple)] focus:px-3 focus:py-2 focus:text-white"
      >
        {t.nav.skipToContent}
      </a>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
