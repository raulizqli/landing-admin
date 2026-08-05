import { useMemo, useState } from 'react';
import {
  VERTICALS,
  normalizeVertical,
} from '@raulizqli/landing-core/verticals';
import { TOGGLEABLE_PAGE_SECTIONS } from '@raulizqli/landing-core/sectionVisibility';
import {
  applyAiAssistResult,
  isAiActionAllowed,
  normalizeStructureSuggestion,
  resolveAiAssistLane,
} from '../utils/aiAssist';
import { runAiAssistRemote } from '../utils/aiAssistFunctions';
import { useEntitlements } from '../hooks/useEntitlements';
import { useLocale } from '../i18n/LocaleContext';
import AiWorkingBanner from './AiWorkingBanner';

const FRIENDLY_VERTICAL_KEYS = {
  beauty: 'ai.structure.verticals.styling',
  fitness: 'ai.structure.verticals.lifestyle',
  psychology: 'ai.structure.verticals.psychology',
  veterinary: 'ai.structure.verticals.veterinary',
};

/**
 * First editor section: pick what the page is about → suggested structure.
 * Apply writes only to local formData (mirror-friendly).
 */
export default function PageStructureAssistSection({
  formData,
  onChange,
  pageId,
}) {
  const { locale, t } = useLocale();
  const entitlements = useEntitlements();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState(null);

  const lane = entitlements.aiLane
    || resolveAiAssistLane(entitlements.account, { bypass: entitlements.bypass });
  const effectiveLane = entitlements.bypass ? 'full' : lane;
  const canFull = effectiveLane === 'full';
  const language = formData?.defaultLanguage === 'en' || formData?.labelLanguage === 'en' ? 'en' : 'es';
  const selectedVertical = normalizeVertical(formData?.vertical);

  const sectionLabelByFlag = useMemo(() => {
    const map = {};
    for (const section of TOGGLEABLE_PAGE_SECTIONS) {
      map[section.flag] = section.label;
    }
    return map;
  }, []);

  const verticalLabel = (item) => {
    const key = FRIENDLY_VERTICAL_KEYS[item.id];
    if (key) return t(key);
    return item.label?.[locale] || item.label?.es || item.id;
  };

  const handleSelectVertical = (verticalId) => {
    onChange({
      ...formData,
      vertical: normalizeVertical(verticalId),
    });
    setSuggestion(null);
    setError('');
  };

  const handleSuggest = async () => {
    if (!canFull) {
      setError(t('ai.upgradeForAction'));
      return;
    }
    if (!isAiActionAllowed('full', 'suggest_page_structure') && !entitlements.bypass) {
      setError(t('ai.upgradeForAction'));
      return;
    }
    if (!pageId) {
      setError(t('ai.error'));
      return;
    }

    setBusy(true);
    setError('');
    setSuggestion(null);

    const context = {
      name: formData?.name || '',
      specialty: formData?.specialty || '',
      vertical: selectedVertical,
    };
    const brief = String(note || '').trim();

    try {
      const data = await runAiAssistRemote({
        pageId,
        action: 'suggest_page_structure',
        language,
        brief,
        context,
        input: { brief, context },
      });
      const normalized = normalizeStructureSuggestion(data?.result || data);
      if (!normalized.recommendedSections.length && !normalized.summary) {
        const provider = data?.provider ? ` (${data.provider})` : '';
        throw new Error(
          `La IA no devolvió una estructura usable${provider}. Prueba de nuevo o revisa el proveedor.`,
        );
      }
      setSuggestion(normalized);
    } catch (err) {
      setError(err?.message || t('ai.error'));
    } finally {
      setBusy(false);
    }
  };

  const handleApply = () => {
    if (!suggestion) return;
    onChange(applyAiAssistResult(formData, {
      action: 'suggest_page_structure',
      result: suggestion,
    }));
    setSuggestion(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-gray-600 leading-relaxed">
        {t('ai.structure.description')}
      </p>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">
          {t('ai.structure.aboutTitle')}
        </p>
        <div className="flex flex-wrap gap-2">
          {VERTICALS.map((item) => {
            const selected = selectedVertical === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectVertical(item.id)}
                className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition ${
                  selected
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-indigo-100 bg-indigo-50 text-indigo-400 hover:bg-indigo-100'
                }`}
              >
                {verticalLabel(item)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold text-gray-400 uppercase">
          {t('ai.structure.noteLabel')}
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={5}
          maxLength={4000}
          placeholder={t('ai.structure.notePlaceholder')}
          className="w-full resize-y rounded-lg border border-gray-200 p-2.5 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <p className="text-[10px] text-gray-400 text-right">
          {String(note || '').length}/4000
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSuggest}
          disabled={busy || !pageId || !canFull}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {busy ? t('ai.generating') : t('ai.structure.suggest')}
        </button>
        {!canFull && (
          <p className="text-[10px] text-amber-700">{t('ai.upgradeForAction')}</p>
        )}
      </div>

      <AiWorkingBanner active={busy} taskLabel={t('ai.workingStructure')} />

      {error && (
        <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {suggestion && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 space-y-3">
          {suggestion.summary && (
            <p className="text-[11px] text-indigo-900 leading-relaxed">{suggestion.summary}</p>
          )}
          <ul className="space-y-1.5">
            {suggestion.recommendedSections.map((item) => (
              <li
                key={item.flag}
                className="flex items-start gap-2 text-[11px] text-indigo-900"
              >
                <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                  item.enabled ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-400 border border-indigo-100'
                }`}
                >
                  {item.enabled ? t('ai.structure.on') : t('ai.structure.off')}
                </span>
                <span>
                  <strong>{sectionLabelByFlag[item.flag] || item.flag}</strong>
                  {item.reason ? ` — ${item.reason}` : ''}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={handleApply}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-500"
            >
              {t('ai.apply')}
            </button>
            <button
              type="button"
              onClick={() => setSuggestion(null)}
              className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50"
            >
              {t('ai.discard')}
            </button>
            <p className="w-full text-[10px] text-indigo-500">{t('ai.reviewHint')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
