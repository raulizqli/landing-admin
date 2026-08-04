import { useState } from 'react';
import { applyAiAssistResult } from '../utils/aiAssist';
import { getAiAssistUsageRemote, runAiAssistRemote } from '../utils/aiAssistFunctions';
import { getAccountAiLogoLimit } from '../utils/billingPlans';
import { useEntitlements } from '../hooks/useEntitlements';
import { useLocale } from '../i18n/LocaleContext';

/**
 * Generate a brand logo/icon with AI (Pro: 3/month, Agency+: unlimited).
 */
export default function AiLogoButton({
  formData,
  onChange,
  pageId,
  fieldPath = 'navLogoUrl',
  onUpgradePlan,
  upgradeLabel,
}) {
  const { t } = useLocale();
  const entitlements = useEntitlements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [usageHint, setUsageHint] = useState('');

  const canGenerate = entitlements.bypass || entitlements.canUseAiAssist;
  const logoLimit = getAccountAiLogoLimit(entitlements.account, { bypass: entitlements.bypass });

  const refreshUsageHint = async () => {
    try {
      const usage = await getAiAssistUsageRemote();
      const logo = usage?.logo;
      if (!logo) return;
      if (logo.limit == null) {
        setUsageHint(t('ai.logoUnlimited'));
      } else {
        setUsageHint(t('ai.logoQuota', {
          used: logo.generations ?? 0,
          limit: logo.limit,
          left: logo.remaining ?? Math.max(0, logo.limit - (logo.generations || 0)),
        }));
      }
    } catch {
      // Non-blocking.
    }
  };

  const generate = async () => {
    if (!canGenerate) {
      setError(t('ai.logoRequiresPro'));
      onUpgradePlan?.();
      return;
    }
    setBusy(true);
    setError('');
    setPreviewUrl('');
    try {
      const language = formData?.defaultLanguage === 'en' || formData?.labelLanguage === 'en' ? 'en' : 'es';
      const data = await runAiAssistRemote({
        pageId,
        action: 'generate_logo',
        fieldPath,
        language,
        brief: formData?.specialty || '',
        input: {
          context: {
            name: formData?.name || '',
            specialty: formData?.specialty || '',
            vertical: formData?.vertical || 'generic',
          },
        },
      });
      const imageUrl = String(data?.result?.imageUrl || data?.result?.url || '').trim();
      if (!imageUrl) throw new Error(t('ai.error'));
      setPreviewUrl(imageUrl);
      if (data?.usage?.limit == null) {
        setUsageHint(t('ai.logoUnlimited'));
      } else if (data?.usage) {
        setUsageHint(t('ai.logoQuota', {
          used: data.usage.generations ?? 0,
          limit: data.usage.limit,
          left: data.usage.remaining ?? 0,
        }));
      } else {
        await refreshUsageHint();
      }
    } catch (err) {
      setError(err?.message || t('ai.error'));
    } finally {
      setBusy(false);
    }
  };

  const apply = () => {
    if (!previewUrl || !onChange) return;
    onChange(applyAiAssistResult(formData, {
      action: 'generate_logo',
      fieldPath,
      result: { imageUrl: previewUrl },
    }));
    setPreviewUrl('');
  };

  return (
    <div className="space-y-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={generate}
          className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
        >
          {busy ? t('ai.generating') : t('ai.generateLogo')}
        </button>
        {!canGenerate && (
          <button
            type="button"
            onClick={onUpgradePlan}
            className="text-[10px] font-semibold text-indigo-600 hover:underline"
          >
            {upgradeLabel || t('common.upgrade')}
          </button>
        )}
        {canGenerate && logoLimit != null && (
          <span className="text-[10px] text-indigo-700/80">
            {t('ai.logoLimitPro', { limit: logoLimit })}
          </span>
        )}
        {canGenerate && logoLimit == null && (
          <span className="text-[10px] text-indigo-700/80">{t('ai.logoUnlimited')}</span>
        )}
      </div>
      {usageHint && <p className="text-[10px] text-indigo-700/70">{usageHint}</p>}
      {error && <p className="text-[10px] text-red-600">{error}</p>}
      {previewUrl && (
        <div className="space-y-2 border-t border-indigo-100 pt-2">
          <img src={previewUrl} alt="Logo IA" className="h-16 w-16 rounded-lg border bg-white object-contain" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={apply}
              className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-indigo-500"
            >
              {t('ai.apply')}
            </button>
            <button
              type="button"
              onClick={() => setPreviewUrl('')}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] text-gray-600"
            >
              {t('ai.discard')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
