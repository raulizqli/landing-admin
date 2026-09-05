import { useEffect, useId, useRef, useState } from 'react';

const STORAGE_KEY = 'toqua-publicity-chrome-open';
const ADS_SCRIPT_SELECTOR = 'script[data-platform-ads="1"], script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]';

function ensureAdsScript(adsClient) {
  const existing = document.querySelector(ADS_SCRIPT_SELECTOR);
  if (existing) return existing;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsClient)}`;
  script.crossOrigin = 'anonymous';
  script.dataset.platformAds = '1';
  document.head.appendChild(script);
  return script;
}

function waitForAdsScript(script) {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.adsbygoogle?.loaded) return Promise.resolve(true);
  if (!script) return Promise.resolve(false);

  return new Promise((resolve) => {
    const done = () => resolve(true);
    script.addEventListener('load', done, { once: true });
    script.addEventListener('error', () => resolve(false), { once: true });
    window.setTimeout(() => resolve(Boolean(window.adsbygoogle)), 4000);
  });
}

function readChromeOpen(defaultOpen) {
  if (typeof window === 'undefined') return defaultOpen;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw === '0') return false;
    if (raw === '1') return true;
  } catch {
    // ignore
  }
  return defaultOpen;
}

/**
 * Platform publicity / Google Ads strip.
 * Configure with VITE_GOOGLE_ADS_CLIENT (+ optional VITE_GOOGLE_ADS_SLOT).
 *
 * layout:
 * - "fullBleed" (default): ad spans the full bar; upgrade message lives in a collapsible tab
 * - "stacked": message + CTA above the ad (Save & Publish gate, etc.)
 */
export default function PublicityAdsBanner({
  client = import.meta.env.VITE_GOOGLE_ADS_CLIENT,
  slot = import.meta.env.VITE_GOOGLE_ADS_SLOT,
  label = 'Publicity',
  message = 'This site is supported by platform publicity while the subscription is unpaid. Renew to remove ads.',
  ctaLabel = '',
  onCtaClick,
  tabLabel = '',
  placement = 'bottom',
  layout = 'fullBleed',
  className = '',
  defaultChromeOpen = false,
}) {
  const adsClient = String(client ?? '').trim();
  const adsSlot = String(slot ?? '').trim();
  const panelId = useId();
  const insRef = useRef(null);
  const pushedRef = useRef(false);
  const [chromeOpen, setChromeOpen] = useState(() => readChromeOpen(defaultChromeOpen));

  const positionClass = placement === 'top'
    ? 'fixed inset-x-0 top-0 z-50 border-b'
    : placement === 'static'
      ? 'relative z-20 w-full border-b'
      : 'fixed inset-x-0 bottom-0 z-50 border-t';

  useEffect(() => {
    if (!adsClient || !adsSlot || typeof window === 'undefined') return undefined;

    let cancelled = false;
    pushedRef.current = false;

    const mountAd = async () => {
      const script = ensureAdsScript(adsClient);
      await waitForAdsScript(script);
      if (cancelled || !insRef.current || pushedRef.current) return;
      if (insRef.current.getAttribute('data-adsbygoogle-status')) return;

      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        pushedRef.current = true;
      } catch {
        // Ad blockers — banner still shows renewal chrome.
      }
    };

    mountAd();
    return () => {
      cancelled = true;
    };
  }, [adsClient, adsSlot]);

  const toggleChrome = () => {
    setChromeOpen((prev) => {
      const next = !prev;
      try {
        window.sessionStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  };

  const hasCta = Boolean(ctaLabel && typeof onCtaClick === 'function');
  const chipText = String(tabLabel || ctaLabel || 'Free tier').trim();

  const adUnit = adsClient && adsSlot ? (
    <ins
      ref={insRef}
      className="adsbygoogle block min-h-[90px] w-full bg-white/5"
      style={{ display: 'block', width: '100%', minHeight: '90px' }}
      data-ad-client={adsClient}
      data-ad-slot={adsSlot}
      data-ad-format="horizontal"
      data-full-width-responsive="true"
    />
  ) : (
    <div className="flex h-[90px] w-full items-center justify-center border border-dashed border-white/20 bg-white/[0.03] px-4 text-center text-[11px] text-[#A8B5AE]">
      Publicity placement (configure Google Ads client/slot)
    </div>
  );

  if (layout === 'stacked') {
    return (
      <aside
        className={`${positionClass} border-black/10 bg-[#121A17] text-[#F4F7F5] ${className}`}
        role="complementary"
        aria-label={label}
      >
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-3">
          <div className="min-w-0 space-y-2">
            <p className="text-xs leading-relaxed text-[#A8B5AE]">{message}</p>
            {hasCta ? (
              <button
                type="button"
                onClick={onCtaClick}
                className="rounded-lg bg-[#40B850] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#289848]"
              >
                {ctaLabel}
              </button>
            ) : null}
          </div>
          <div className="w-full overflow-hidden rounded-md">{adUnit}</div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`${positionClass} border-black/10 bg-[#121A17] text-[#F4F7F5] ${className}`}
      role="complementary"
      aria-label={label}
    >
      <div className="relative w-full overflow-hidden">
        <div className="w-full min-h-[90px] max-h-[120px] overflow-hidden">
          {adUnit}
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-start p-1.5 sm:p-2">
          <div className="pointer-events-auto max-w-[min(100%,20rem)]">
            {chromeOpen ? (
              <div
                id={panelId}
                className="rounded-lg border border-white/15 bg-[#070B0A]/92 p-2.5 shadow-lg backdrop-blur-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] leading-snug text-[#A8B5AE]">{message}</p>
                  <button
                    type="button"
                    onClick={toggleChrome}
                    className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-[#A8B5AE] hover:bg-white/10 hover:text-white"
                    aria-expanded="true"
                    aria-controls={panelId}
                    title="Hide message"
                  >
                    ✕
                  </button>
                </div>
                {hasCta ? (
                  <button
                    type="button"
                    onClick={onCtaClick}
                    className="mt-2 rounded-md bg-[#40B850] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#289848]"
                  >
                    {ctaLabel}
                  </button>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                onClick={toggleChrome}
                className="rounded-md border border-white/20 bg-[#070B0A]/85 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[#F4F7F5] shadow hover:border-[var(--color-accent,#7cffb2)]/50 hover:bg-[#070B0A]"
                aria-expanded="false"
                aria-controls={panelId}
              >
                {chipText}
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
