import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import StickyCta from '../conversion/StickyCta';
import FloatingContact from '../conversion/FloatingContact';

export default function SiteLayout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[var(--color-accent)] focus:px-3 focus:py-2 focus:text-[var(--color-ink)]"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content" className="flex-1 pb-28">
        <Outlet />
      </main>
      <SiteFooter />
      <StickyCta />
      <FloatingContact />
    </div>
  );
}
