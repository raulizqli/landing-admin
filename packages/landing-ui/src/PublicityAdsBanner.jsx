import { useEffect } from 'react';

/**
 * Platform publicity / Google Ads strip for long-unpaid free sites.
 * Configure with VITE_GOOGLE_ADS_CLIENT (+ optional VITE_GOOGLE_ADS_SLOT).
 */
export default function PublicityAdsBanner({
  client = import.meta.env.VITE_GOOGLE_ADS_CLIENT,
  slot = import.meta.env.VITE_GOOGLE_ADS_SLOT,
  label = 'Publicity',
}) {
  const adsClient = String(client ?? '').trim();
  const adsSlot = String(slot ?? '').trim();

  useEffect(() => {
    if (!adsClient || typeof window === 'undefined') return undefined;

    const existing = document.querySelector('script[data-platform-ads="1"]');
    if (!existing) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsClient)}`;
      script.crossOrigin = 'anonymous';
      script.dataset.platformAds = '1';
      document.head.appendChild(script);
    }

    try {
      const runtime = window;
      runtime.adsbygoogle = runtime.adsbygoogle || [];
      runtime.adsbygoogle.push({});
    } catch {
      // Ad blockers / missing slot — banner still shows renewal message.
    }

    return undefined;
  }, [adsClient, adsSlot]);

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-[#121A17] text-[#F4F7F5]"
      role="complementary"
      aria-label={label}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-[#A8B5AE] sm:max-w-md">
          This site is supported by platform publicity while the subscription is unpaid.
          Renew to remove ads.
        </p>
        {adsClient && adsSlot ? (
          <ins
            className="adsbygoogle block min-h-[60px] w-full max-w-xl bg-white/5"
            style={{ display: 'block' }}
            data-ad-client={adsClient}
            data-ad-slot={adsSlot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : (
          <div className="rounded-lg border border-dashed border-white/20 px-4 py-3 text-center text-[11px] text-[#A8B5AE]">
            Publicity placement (configure Google Ads client/slot)
          </div>
        )}
      </div>
    </aside>
  );
}
