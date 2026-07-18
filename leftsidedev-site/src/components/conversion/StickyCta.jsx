import { useEffect, useState } from 'react';
import { CTA } from '../../content/site';
import Button from '../ui/Button';

export default function StickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 520);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6">
      <div className="glass mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 rounded-2xl px-4 py-3 shadow-2xl shadow-black/40 sm:flex-row sm:px-5">
        <p className="text-center text-sm text-[var(--color-mist)] sm:text-left">
          Ready to scope your next AI-powered product?
        </p>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button to={CTA.primary.href} className="flex-1 sm:flex-none">
            {CTA.primary.label}
          </Button>
          <Button to={CTA.estimate.href} variant="secondary" className="flex-1 sm:flex-none">
            Estimate
          </Button>
        </div>
      </div>
    </div>
  );
}
