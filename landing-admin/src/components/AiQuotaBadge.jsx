import { useEffect, useState } from 'react';
import { getAiAssistUsageRemote } from '../utils/aiAssistFunctions';
import { useEntitlements } from '../hooks/useEntitlements';
import { useLocale } from '../i18n/LocaleContext';

export default function AiQuotaBadge() {
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

  if (entitlements.bypass) {
    return (
      <p className="text-[10px] text-indigo-200">
        {t('ai.quotaRoot')}
      </p>
    );
  }

  if (error && !usage) {
    return (
      <p className="text-[10px] text-amber-200/90" title={error}>
        {t('ai.quotaUnavailable')}
      </p>
    );
  }

  if (!usage) {
    return <p className="text-[10px] text-gray-500">{t('ai.quotaLoading')}</p>;
  }

  const remaining = usage.remaining;
  const limitLabel = usage.limit == null ? t('billing.unlimited') : `${usage.generations}/${usage.limit}`;

  return (
    <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-2 py-1.5 text-[10px] text-indigo-100">
      <p className="font-bold uppercase tracking-wide text-indigo-300/90">
        {usage.lane === 'full' ? t('ai.laneFull') : t('ai.laneLite')}
      </p>
      <p className="mt-0.5">
        {t('ai.quotaUsed')}: {limitLabel}
        {remaining != null ? ` · ${t('ai.quotaLeft')}: ${remaining}` : ''}
      </p>
    </div>
  );
}
