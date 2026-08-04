import { useEffect, useState } from 'react';
import PublicityAdsBanner from '@raulizqli/landing-ui/PublicityAdsBanner';
import { useLocale } from '../i18n/LocaleContext';

/** Seconds the free-tier user must watch before Save & Publish continues. */
export const FREE_TIER_SAVE_AD_SECONDS = Math.max(
  5,
  Number(import.meta.env.VITE_FREE_TIER_SAVE_AD_SECONDS) || 10,
);

/**
 * Interstitial: free-tier accounts must finish viewing an ad before publish.
 */
export default function SavePublishAdGate({
  open,
  seconds = FREE_TIER_SAVE_AD_SECONDS,
  onCancel,
  onComplete,
  onUpgrade,
}) {
  const { t } = useLocale();
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (!open) return undefined;
    setRemaining(seconds);
    const started = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - started) / 1000);
      const next = Math.max(0, seconds - elapsed);
      setRemaining(next);
      if (next <= 0) window.clearInterval(timer);
    }, 250);
    return () => window.clearInterval(timer);
  }, [open, seconds]);

  if (!open) return null;

  const ready = remaining <= 0;

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{t('billing.saveAd.title')}</h2>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            {t('billing.saveAd.body')}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <PublicityAdsBanner
            placement="static"
            label={t('billing.saveAd.label')}
            message={t('billing.saveAd.adHint')}
            className="!border-0"
          />
        </div>

        <div className="px-5 py-4 border-t border-gray-100 space-y-3 bg-gray-50">
          <p className="text-center text-xs font-semibold tabular-nums text-gray-700">
            {ready
              ? t('billing.saveAd.ready')
              : t('billing.saveAd.countdown', { seconds: remaining })}
          </p>
          <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-[#4A5D4E] transition-[width] duration-300 ease-linear"
              style={{ width: `${Math.min(100, ((seconds - remaining) / seconds) * 100)}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!ready}
              onClick={onComplete}
              className="flex-1 rounded-lg bg-[#4A5D4E] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#3d4d41] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('billing.saveAd.continue')}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border bg-white px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
          </div>
          {onUpgrade ? (
            <button
              type="button"
              onClick={onUpgrade}
              className="w-full text-center text-[11px] font-semibold text-indigo-600 hover:underline"
            >
              {t('billing.saveAd.upgrade')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
