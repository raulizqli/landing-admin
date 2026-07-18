import { Link } from 'react-router-dom';
import { SITE } from '../../content/site';

export default function FloatingContact() {
  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2 sm:right-6">
      <a
        href={`mailto:${SITE.email}`}
        className="glass rounded-full px-4 py-2 text-xs font-semibold text-[var(--color-mist)] shadow-lg shadow-black/30 transition hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
        aria-label={`Email ${SITE.email}`}
      >
        Email us
      </a>
      <Link
        to="/contact"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-[var(--color-ink)] shadow-lg shadow-black/40 transition hover:bg-[var(--color-accent-deep)] hover:text-white"
        aria-label="Open contact page"
      >
        Talk
      </Link>
    </div>
  );
}
