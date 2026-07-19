import { useEffect, useState } from 'react';
import { getAiAssistUsageRemote } from '../utils/aiAssistFunctions';
import { useEntitlements } from '../hooks/useEntitlements';
import { useLocale } from '../i18n/LocaleContext';

function QuotaSummaryIcons({ unlimited = false }) {
  return (
    <span className="inline-flex items-center gap-1 shrink-0" aria-hidden="true">
      <span className="text-[12px] leading-none text-amber-300" title="LeftSide AI">✨</span>
      {unlimited ? (
        <span className="text-[11px] font-bold leading-none text-indigo-200" title="Ilimitado">∞</span>
      ) : (
        <span className="text-[9px] font-bold leading-none text-indigo-200">AI</span>
      )}
    </span>
  );
}

export default function AiQuotaBadge({ children }) {
  const { t } = useLocale();
  const entitlements = useEntitlements();
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getAiAssistUsageRemote()
      .then((data) => {
        if (!cancelled) setUsage(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || '');
      });
    return () => { cancelled = true; };
  }, [entitlements.planId, entitlements.active, entitlements.freeTier]);

  const unlimited = entitlements.bypass || usage?.limit == null;
  const remaining = usage?.remaining;
  const limitLabel = usage?.limit == null
    ? t('billing.unlimited')
    : `${usage.generations}/${usage.limit}`;

  const detailsBody = (() => {
    if (entitlements.bypass) {
      return (
        <>
          <p className="font-semibold text-indigo-100">{t('ai.quotaRoot')}</p>
          <p className="mt-1 text-indigo-200/80 leading-snug">{t('ai.quotaHint')}</p>
        </>
      );
    }
    if (error && !usage) {
      return (
        <>
          <p className="text-amber-200/90" title={error}>{t('ai.quotaUnavailable')}</p>
          <p className="mt-1 text-indigo-200/80 leading-snug">{t('ai.quotaHint')}</p>
        </>
      );
    }
    if (!usage) {
      return <p className="text-gray-400">{t('ai.quotaLoading')}</p>;
    }
    return (
      <>
        <p className="font-bold uppercase tracking-wide text-indigo-300/90">
          {usage.lane === 'full' ? t('ai.laneFull') : t('ai.laneLite')}
        </p>
        <p className="mt-0.5 text-indigo-100">
          {t('ai.quotaUsed')}: {limitLabel}
          {remaining != null ? ` · ${t('ai.quotaLeft')}: ${remaining}` : ''}
        </p>
        <p className="mt-1 text-indigo-200/80 leading-snug">{t('ai.quotaHint')}</p>
      </>
    );
  })();

  return (
    <details className="group block w-full" title={t('ai.quotaHint')}>
      <summary
        className="flex cursor-pointer list-none items-start justify-between gap-2 [&::-webkit-details-marker]:hidden"
        aria-label={t('ai.quotaRoot')}
      >
        <div className="min-w-0 flex-1">{children}</div>
        <span className="mt-0.5 flex shrink-0 items-center gap-0.5 rounded-md border border-indigo-500/40 bg-indigo-950/50 px-1.5 py-0.5 hover:bg-indigo-900/60">
          <QuotaSummaryIcons unlimited={unlimited} />
          <span className="text-[8px] text-indigo-300/80 transition-transform group-open:rotate-180" aria-hidden>⌄</span>
        </span>
      </summary>
      <div className="mt-2 w-full rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-2.5 py-2 text-[10px] text-indigo-100">
        {detailsBody}
      </div>
    </details>
  );
}
