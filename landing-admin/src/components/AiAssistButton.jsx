import { useState } from 'react';
import {
  applyAiAssistResult,
  buildAiSystemPrompt,
  buildAiUserPrompt,
  isAiActionAllowed,
  resolveAiAssistLane,
} from '../utils/aiAssist';
import { runAiAssistRemote, runLocalOllamaAssist } from '../utils/aiAssistFunctions';
import { useEntitlements } from '../hooks/useEntitlements';
import { useLocale } from '../i18n/LocaleContext';

const LITE_MENU = [
  { action: 'rewrite_field', tone: 'empathetic', labelKey: 'ai.rewrite' },
  { action: 'rewrite_field', tone: 'shorter', labelKey: 'ai.shorter' },
  { action: 'rewrite_field', tone: 'formal', labelKey: 'ai.formal' },
  { action: 'rewrite_field', tone: 'translate_en', labelKey: 'ai.toEn' },
  { action: 'rewrite_field', tone: 'translate_es', labelKey: 'ai.toEs' },
];

/**
 * Contextual AI control — Apply writes only to local formData.
 */
export default function AiAssistButton({
  formData,
  onChange,
  pageId,
  fieldPath,
  action = 'rewrite_field',
  currentValue = '',
  brief = '',
  label,
  fullActions = [],
  showLiteMenu = true,
  resultPatch = null,
}) {
  const { t } = useLocale();
  const entitlements = useEntitlements();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [engine, setEngine] = useState('platform'); // platform | local_ollama

  const lane = entitlements.aiLane
    || resolveAiAssistLane(entitlements.account, { bypass: entitlements.bypass });
  const canLite = Boolean(lane);
  const canFull = lane === 'full';

  const language = formData?.defaultLanguage === 'en' || formData?.labelLanguage === 'en' ? 'en' : 'es';
  const menu = [
    ...(showLiteMenu
      ? LITE_MENU.map((item) => ({
        ...item,
        action: action === 'polish_bio' || action === 'polish_tagline' || action === 'hero_suggest'
          ? action
          : item.action,
      }))
      : []),
    ...(canFull ? fullActions : []),
  ];

  if (!canLite || menu.length === 0) return null;

  const run = async (item) => {
    if (!isAiActionAllowed(lane, item.action) && !entitlements.bypass) {
      setError(t('ai.upgradeForAction'));
      return;
    }
    setBusy(true);
    setError('');
    setPreview(null);
    const context = {
      name: formData?.name || '',
      specialty: formData?.specialty || '',
      vertical: formData?.vertical || 'generic',
    };
    try {
      let result;
      let meta = { lane, provider: engine };
      if (engine === 'local_ollama') {
        const system = buildAiSystemPrompt({ language, vertical: context.vertical });
        const user = buildAiUserPrompt({
          action: item.action,
          tone: item.tone,
          fieldPath,
          currentValue,
          brief,
          context,
        });
        result = await runLocalOllamaAssist({ system, user });
        meta = { lane: 'lite', provider: 'local_ollama' };
      } else {
        const data = await runAiAssistRemote({
          pageId,
          action: item.action,
          tone: item.tone,
          language,
          fieldPath,
          currentValue,
          brief,
          input: { currentValue, brief, context },
          engine: lane === 'lite' ? 'ollama' : undefined,
        });
        result = data.result;
        meta = { lane: data.lane, provider: data.provider, usage: data.usage };
      }
      setPreview({
        action: item.action,
        fieldPath,
        result: resultPatch ? { ...result, ...resultPatch } : result,
        meta,
      });
      setOpen(true);
    } catch (err) {
      setError(err?.message || t('ai.error'));
    } finally {
      setBusy(false);
    }
  };

  const apply = () => {
    if (!preview || !onChange) return;
    onChange(applyAiAssistResult(formData, preview));
    setPreview(null);
    setOpen(false);
  };

  return (
    <div className="relative inline-flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          disabled={busy}
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
        >
          {busy ? t('ai.generating') : (label || t('ai.improve'))}
        </button>
      </div>

      {open && (
        <div className="absolute right-0 z-30 mt-8 w-72 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
            {lane === 'full' ? t('ai.laneFull') : t('ai.laneLite')}
          </p>
          <div className="mb-1 flex gap-1 px-1">
            <button
              type="button"
              onClick={() => setEngine('platform')}
              className={`flex-1 rounded px-2 py-1 text-[10px] font-semibold ${engine === 'platform' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {t('ai.enginePlatform')}
            </button>
            <button
              type="button"
              onClick={() => setEngine('local_ollama')}
              className={`flex-1 rounded px-2 py-1 text-[10px] font-semibold ${engine === 'local_ollama' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {t('ai.engineLocal')}
            </button>
          </div>
          <ul className="max-h-48 space-y-0.5 overflow-y-auto">
            {menu.map((item) => (
              <li key={`${item.action}-${item.tone || item.labelKey}`}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(item)}
                  className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-indigo-50 disabled:opacity-50"
                >
                  {t(item.labelKey)}
                </button>
              </li>
            ))}
          </ul>
          {error && (
            <p className="mt-2 rounded-lg bg-red-50 px-2 py-1.5 text-[11px] text-red-700">{error}</p>
          )}
          {preview && (
            <div className="mt-2 space-y-2 border-t border-gray-100 pt-2">
              <p className="text-[10px] text-gray-400">
                {preview.meta?.provider} · {t('ai.reviewHint')}
              </p>
              <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-2 text-[11px] text-gray-800">
                {preview.result?.text
                  || preview.result?.title
                  || JSON.stringify(preview.result, null, 2)}
              </pre>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={apply}
                  className="flex-1 rounded-lg bg-indigo-600 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-500"
                >
                  {t('ai.apply')}
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] text-gray-600"
                >
                  {t('ai.discard')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
