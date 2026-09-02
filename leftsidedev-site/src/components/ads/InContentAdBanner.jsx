import AdSenseUnit from './AdSenseUnit';
import { GOOGLE_ADS_SLOT_INPAGE, isInpageAdConfigured } from '../../config/ads';

/** In-page display unit (e.g. above FAQ on home). */
export default function InContentAdBanner({ className = '' }) {
  if (!isInpageAdConfigured()) return null;

  return (
    <section
      className={`border-y border-[var(--color-line)] bg-[var(--color-ink-elevated)]/30 px-5 py-6 sm:px-8 lg:px-12 ${className}`.trim()}
      aria-label="Sponsored"
    >
      <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-[var(--color-line)]/60 bg-[var(--color-ink)]/40 p-2">
        <AdSenseUnit slot={GOOGLE_ADS_SLOT_INPAGE} minHeight={100} />
      </div>
    </section>
  );
}
