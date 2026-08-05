import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  applyAiAssistResult,
  buildAiSystemPrompt,
  buildAiUserPrompt,
  isAiActionAllowed,
  resolveAiAssistLane,
} from '../utils/aiAssist';
import { runAiAssistRemote, runLocalAssistant } from '../utils/aiAssistFunctions';
import { getDefaultAiEngine, getLocalOllamaConfig } from '../utils/aiEngine';
import { getAiProviderDisplayName, formatAiGenerationLabel } from '../utils/aiProviderLabel';
import { useEntitlements } from '../hooks/useEntitlements';
import { useLocale } from '../i18n/LocaleContext';
import AiWorkingBanner from './AiWorkingBanner';

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
  customMenu = null,
  resultPatch = null,
  workingTaskLabel,
}) {
  const { locale, t } = useLocale();
  const entitlements = useEntitlements();
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [engine, setEngine] = useState(() => getDefaultAiEngine()); // platform | local

  const lane = entitlements.aiLane
    || resolveAiAssistLane(entitlements.account, { bypass: entitlements.bypass });
  const canLite = Boolean(lane);
  const canFull = lane === 'full';

  const language = formData?.defaultLanguage === 'en' || formData?.labelLanguage === 'en' ? 'en' : 'es';
  const menu = customMenu?.length
    ? customMenu.map((item) => ({
      ...item,
      action: item.action || action,
    }))
    : [
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

  const canShow = canLite && menu.length > 0;
  const panelId = `ai-assist-panel-${pageId || 'page'}-${fieldPath || action}`;

  const updatePanelPosition = () => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const panelWidth = 288;
    const left = Math.min(
      Math.max(8, rect.right - panelWidth),
      window.innerWidth - panelWidth - 8,
    );
    setPanelStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      left,
      width: panelWidth,
      zIndex: 80,
    });
  };

  useLayoutEffect(() => {
    if (!canShow || !open) {
      setPanelStyle(null);
      return undefined;
    }
    updatePanelPosition();
    window.addEventListener('resize', updatePanelPosition);
    window.addEventListener('scroll', updatePanelPosition, true);
    return () => {
      window.removeEventListener('resize', updatePanelPosition);
      window.removeEventListener('scroll', updatePanelPosition, true);
    };
  }, [canShow, open, busy, preview, error]);

  useEffect(() => {
    if (!canShow || !open) return undefined;
    const handlePointerDown = (event) => {
      const anchor = anchorRef.current;
      const panel = document.getElementById(panelId);
      if (anchor?.contains(event.target) || panel?.contains(event.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [canShow, open, panelId]);

  if (!canShow) return null;

  const run = async (item) => {
    if (!isAiActionAllowed(lane, item.action) && !entitlements.bypass) {
      setError(t('ai.upgradeForAction'));
      return;
    }
    setBusy(true);
    setError('');
    setPreview(null);
    setOpen(true);
    const effectiveFieldPath = item.fieldPath ?? fieldPath;
    const effectiveCurrentValue = item.currentValue ?? currentValue;
    const context = {
      name: formData?.name || '',
      specialty: formData?.specialty || '',
      vertical: formData?.vertical || 'generic',
    };
    try {
      let result;
      let meta = { lane, provider: engine };
      if (engine === 'local') {
        const system = buildAiSystemPrompt({ language, vertical: context.vertical });
        const user = buildAiUserPrompt({
          action: item.action,
          tone: item.tone,
          fieldPath: effectiveFieldPath,
          currentValue: effectiveCurrentValue,
          brief,
          context,
        });
        const ollama = getLocalOllamaConfig();
        result = await runLocalAssistant({ system, user, ...ollama });
        meta = { lane: 'lite', provider: 'local_ollama', model: ollama.model };
      } else {
        const data = await runAiAssistRemote({
          pageId,
          action: item.action,
          tone: item.tone,
          language,
          fieldPath: effectiveFieldPath,
          currentValue: effectiveCurrentValue,
          brief,
          input: { currentValue: effectiveCurrentValue, brief, context },
          // Let Cloud Functions pick AI_LITE_PROVIDER and fall back (Gemini) on quota.
        });
        result = data.result;
        meta = {
          lane: data.lane,
          provider: data.provider,
          model: data.model,
          usage: data.usage,
        };
      }
      setPreview({
        action: item.action,
        fieldPath: effectiveFieldPath,
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

  const panel = open && panelStyle ? (
    <div
      id={panelId}
      style={panelStyle}
      className="rounded-xl border border-gray-200 bg-white p-2 shadow-xl"
    >
      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
        {engine === 'local' ? t('ai.engineLocal') : (lane === 'full' ? t('ai.laneFull') : t('ai.laneLite'))}
      </p>

      {busy ? (
        <AiWorkingBanner
          active
          taskLabel={workingTaskLabel || t('ai.workingRewrite')}
          className="mx-1 my-1"
        />
      ) : (
        <>
          <div className="mb-1 flex gap-1 px-1">
            <button
              type="button"
              onClick={() => setEngine('platform')}
              className={`flex-1 rounded px-2 py-1 text-[10px] font-semibold transition ${engine === 'platform' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-400 hover:bg-indigo-100'}`}
            >
              {t('ai.enginePlatform')}
            </button>
            <button
              type="button"
              onClick={() => setEngine('local')}
              className={`flex-1 rounded px-2 py-1 text-[10px] font-semibold transition ${engine === 'local' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-400 hover:bg-indigo-100'}`}
            >
              {t('ai.engineLocal')}
            </button>
          </div>
          <ul className="max-h-48 space-y-0.5 overflow-y-auto">
            {menu.map((item) => (
              <li key={`${item.action}-${item.tone || item.labelKey}-${item.fieldPath || ''}`}>
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
        </>
      )}

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-2 py-1.5 text-[11px] text-red-700">{error}</p>
      )}

      {preview && !busy && (
        <div className="mt-2 space-y-2 border-t border-gray-100 pt-2">
          <p className="text-[10px] text-gray-400">
            {formatAiGenerationLabel({
              provider: preview.meta?.provider,
              model: preview.meta?.model,
              language: locale,
            }) || getAiProviderDisplayName(preview.meta?.provider, locale)}
            {' · '}
            {t('ai.reviewHint')}
          </p>
          <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-2 text-[11px] text-gray-800">
            {preview.result?.title && preview.result?.text
              ? `${preview.result.title}\n\n${preview.result.text}`
              : preview.result?.text
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
  ) : null;

  return (
    <div ref={anchorRef} className="relative inline-flex flex-col items-end gap-1">
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

      {typeof document !== 'undefined' && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
