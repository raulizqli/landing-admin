import AdSenseUnit from './AdSenseUnit';
import { isAdSenseConfigured } from '../../config/ads';

/** Single manual display placement (top of page). Unfilled units collapse via AdSenseUnit. */
export default function SiteAdBanner() {
  if (!isAdSenseConfigured()) return null;

  return (
    <section
      className="border-b border-[var(--color-line)] bg-[var(--color-ink-elevated)]/40 px-5 py-4 sm:px-8 lg:px-12"
      aria-label="Sponsored"
    >
      <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-[var(--color-line)]/60 bg-[var(--color-ink)]/50 p-2">
        <AdSenseUnit format="horizontal" minHeight={100} />
      </div>
    </section>
  );
}
