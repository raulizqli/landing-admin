import { useEffect, useMemo, useState } from 'react';
import {
  VERTICALS,
  normalizeVertical,
} from '@raulizqli/landing-core/verticals';
import { TOGGLEABLE_PAGE_SECTIONS } from '@raulizqli/landing-core/sectionVisibility';
import {
  STRUCTURE_CONTENT_TARGETS,
  applyAiAssistResult,
  applyGeneratedPageContent,
  buildAiSystemPrompt,
  buildAiUserPrompt,
  isAiActionAllowed,
  normalizeGeneratedPageContent,
  normalizeStructureSuggestion,
  resolveAiAssistLane,
} from '../utils/aiAssist';
import { runAiAssistRemote, runLocalAssistant } from '../utils/aiAssistFunctions';
import { getDefaultAiEngine, getLocalOllamaConfig } from '../utils/aiEngine';
import { formatAiGenerationLabel } from '../utils/aiProviderLabel';
import {
  loadStructureAssistPrefs,
  saveStructureAssistPrefs,
} from '../utils/structureAssistPrefs';
import { useEntitlements } from '../hooks/useEntitlements';
import { useLocale } from '../i18n/LocaleContext';
import AiWorkingBanner from './AiWorkingBanner';

const FRIENDLY_VERTICAL_KEYS = {
  beauty: 'ai.structure.verticals.styling',
  fitness: 'ai.structure.verticals.lifestyle',
  psychology: 'ai.structure.verticals.psychology',
  veterinary: 'ai.structure.verticals.veterinary',
};

const CONTENT_LABEL_KEYS = {
  seo: 'ai.structure.content.seo',
  hero: 'ai.structure.content.hero',
  preHero: 'ai.structure.content.preHero',
  about: 'ai.structure.content.about',
  services: 'ai.structure.content.services',
  catalog: 'ai.structure.content.catalog',
  testimonials: 'ai.structure.content.testimonials',
  blog: 'ai.structure.content.blog',
};

/**
 * First editor section: pick what the page is about → suggested structure → optional content pre-fill.
 * Apply writes only to local formData (mirror-friendly). Note + content picks persist per page in localStorage.
 */
export default function PageStructureAssistSection({
  formData,
  onChange,
  pageId,
}) {
  const { locale, t } = useLocale();
  const entitlements = useEntitlements();
  const [note, setNote] = useState('');
  const [contentTargets, setContentTargets] = useState({});
  const [busy, setBusy] = useState(false);
  const [contentBusy, setContentBusy] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [structureMeta, setStructureMeta] = useState(null);
  const [contentMeta, setContentMeta] = useState(null);
  const [sectionSelections, setSectionSelections] = useState({});
  const [generatedContent, setGeneratedContent] = useState(null);

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

  const selectedContentIds = useMemo(
    () => STRUCTURE_CONTENT_TARGETS
      .filter((item) => contentTargets[item.id])
      .map((item) => item.id),
    [contentTargets],
  );

  useEffect(() => {
    if (!pageId) return;
    const prefs = loadStructureAssistPrefs(pageId);
    setNote(prefs.note);
    setContentTargets(prefs.contentTargets);
  }, [pageId]);

  useEffect(() => {
    if (!pageId) return;
    saveStructureAssistPrefs(pageId, { note, contentTargets });
  }, [pageId, note, contentTargets]);

  useEffect(() => {
    if (!suggestion) return;
    const next = {};
    for (const item of suggestion.recommendedSections) {
      next[item.flag] = item.enabled;
    }
    setSectionSelections(next);
    setGeneratedContent(null);
  }, [suggestion]);

  const verticalLabel = (item) => {
    const key = FRIENDLY_VERTICAL_KEYS[item.id];
    if (key) return t(key);
    return item.label?.[locale] || item.label?.es || item.id;
  };

  const contentLabel = (id) => t(CONTENT_LABEL_KEYS[id] || id);

  const handleSelectVertical = (verticalId) => {
    onChange({
      ...formData,
      vertical: normalizeVertical(verticalId),
    });
    setSuggestion(null);
    setGeneratedContent(null);
    setStructureMeta(null);
    setContentMeta(null);
    setError('');
  };

  const toggleContentTarget = (id) => {
    setContentTargets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleSectionSelection = (flag) => {
    setSectionSelections((prev) => ({
      ...prev,
      [flag]: !prev[flag],
    }));
  };

  const buildContext = (extra = {}) => ({
    name: formData?.name || '',
    specialty: formData?.specialty || '',
    vertical: selectedVertical,
    language,
    ...extra,
  });

  const runAiJson = async ({ action, briefOverride, contextExtra = {} }) => {
    const brief = String(briefOverride ?? note ?? '').trim();
    const context = buildContext(contextExtra);
    const preferLocal = getDefaultAiEngine() === 'local';

    const runRemote = async () => {
      const data = await runAiAssistRemote({
        pageId,
        action,
        language,
        brief,
        context,
        input: { brief, context },
      });
      return {
        result: data?.result ?? data,
        meta: {
          provider: data?.provider,
          model: data?.model,
          lane: data?.lane,
        },
      };
    };

    if (preferLocal) {
      try {
        const ollama = getLocalOllamaConfig();
        const system = buildAiSystemPrompt({ language, vertical: selectedVertical });
        const user = buildAiUserPrompt({
          action,
          brief,
          context,
        });
        const result = await runLocalAssistant({
          system,
          user,
          ...ollama,
        });
        return {
          result,
          meta: {
            provider: 'local_ollama',
            model: ollama.model,
            lane: 'lite',
          },
        };
      } catch (localError) {
        console.warn('[AI] Motor local no disponible; usando plataforma:', localError?.message || localError);
        return runRemote();
      }
    }
    return runRemote();
  };

  const filteredSuggestion = useMemo(() => {
    if (!suggestion) return null;
    return {
      ...suggestion,
      recommendedSections: suggestion.recommendedSections.map((item) => ({
        ...item,
        enabled: sectionSelections[item.flag] ?? item.enabled,
      })),
    };
  }, [suggestion, sectionSelections]);

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
    setGeneratedContent(null);
    setStructureMeta(null);
    setContentMeta(null);

    try {
      const { result: rawResult, meta } = await runAiJson({ action: 'suggest_page_structure' });
      const normalized = normalizeStructureSuggestion(rawResult);
      if (!normalized.recommendedSections.length && !normalized.summary) {
        throw new Error(t('ai.structure.emptySuggestion'));
      }
      setSuggestion(normalized);
      setStructureMeta(meta);
    } catch (err) {
      setError(err?.message || t('ai.error'));
    } finally {
      setBusy(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!canFull || !suggestion || !selectedContentIds.length) return;
    if (!isAiActionAllowed('full', 'generate_page_content') && !entitlements.bypass) {
      setError(t('ai.upgradeForAction'));
      return;
    }

    setContentBusy(true);
    setError('');

    try {
      const { result: rawResult, meta } = await runAiJson({
        action: 'generate_page_content',
        contextExtra: {
          targets: selectedContentIds,
          structureSummary: suggestion.summary || '',
        },
      });
      const normalized = normalizeGeneratedPageContent(rawResult);
      if (!Object.keys(normalized).length) {
        throw new Error(t('ai.structure.emptyContent'));
      }
      setGeneratedContent(normalized);
      setContentMeta(meta);
    } catch (err) {
      setError(err?.message || t('ai.error'));
    } finally {
      setContentBusy(false);
    }
  };

  const applyStructure = () => {
    if (!filteredSuggestion) return;
    onChange(applyAiAssistResult(formData, {
      action: 'suggest_page_structure',
      result: filteredSuggestion,
    }));
  };

  const applyContent = () => {
    if (!generatedContent || !selectedContentIds.length) return;
    onChange(applyGeneratedPageContent(formData, generatedContent, {
      targets: selectedContentIds,
      onlyEmpty: true,
    }));
  };

  const handleApplyStructure = () => {
    applyStructure();
    setSuggestion(null);
    setGeneratedContent(null);
    setStructureMeta(null);
    setContentMeta(null);
  };

  const handleApplyContent = () => {
    applyContent();
    setGeneratedContent(null);
  };

  const handleApplyAll = () => {
    if (!filteredSuggestion) return;
    let next = applyAiAssistResult(formData, {
      action: 'suggest_page_structure',
      result: filteredSuggestion,
    });
    if (generatedContent && selectedContentIds.length) {
      next = applyGeneratedPageContent(next, generatedContent, {
        targets: selectedContentIds,
        onlyEmpty: true,
      });
    }
    onChange(next);
    setSuggestion(null);
    setGeneratedContent(null);
    setStructureMeta(null);
    setContentMeta(null);
  };

  const structureModelLabel = formatAiGenerationLabel({
    provider: structureMeta?.provider,
    model: structureMeta?.model,
    language: locale,
  });
  const contentModelLabel = formatAiGenerationLabel({
    provider: contentMeta?.provider,
    model: contentMeta?.model,
    language: locale,
  });

  const generatedSummary = useMemo(() => {
    if (!generatedContent) return [];
    return selectedContentIds
      .filter((id) => generatedContent[id])
      .map((id) => contentLabel(id));
  }, [generatedContent, selectedContentIds, locale, t]);

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
        <p className="text-[10px] text-gray-400">
          {t('ai.structure.prefsHint')}
        </p>
        <p className="text-[10px] text-gray-400 text-right">
          {String(note || '').length}/4000
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
          {t('ai.structure.contentTargetsTitle')}
        </p>
        <p className="text-[10px] text-gray-500 leading-relaxed">
          {t('ai.structure.contentTargetsHint')}
        </p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {STRUCTURE_CONTENT_TARGETS.map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-2 rounded-lg border border-white bg-white px-2.5 py-2 text-[11px] text-gray-700 cursor-pointer hover:border-indigo-100"
            >
              <input
                type="checkbox"
                checked={Boolean(contentTargets[item.id])}
                onChange={() => toggleContentTarget(item.id)}
                className="mt-0.5 shrink-0"
              />
              <span>{contentLabel(item.id)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSuggest}
          disabled={busy || contentBusy || !pageId || !canFull}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {busy ? t('ai.generating') : t('ai.structure.suggest')}
        </button>
        {!canFull && (
          <p className="text-[10px] text-amber-700">{t('ai.upgradeForAction')}</p>
        )}
      </div>

      <AiWorkingBanner
        active={busy}
        taskLabel={t('ai.workingStructure')}
      />
      <AiWorkingBanner
        active={contentBusy}
        taskLabel={t('ai.workingContent')}
      />

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
          {structureModelLabel && (
            <p className="text-[10px] text-indigo-600/80">
              {t('ai.structure.structureModelLabel', { label: structureModelLabel })}
            </p>
          )}
          <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-500">
            {t('ai.structure.sectionsTitle')}
          </p>
          <ul className="space-y-1.5">
            {suggestion.recommendedSections.map((item) => {
              const enabled = sectionSelections[item.flag] ?? item.enabled;
              return (
                <li
                  key={item.flag}
                  className="flex items-start gap-2 text-[11px] text-indigo-900"
                >
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => toggleSectionSelection(item.flag)}
                    className="mt-0.5 shrink-0"
                    aria-label={sectionLabelByFlag[item.flag] || item.flag}
                  />
                  <span>
                    <strong>{sectionLabelByFlag[item.flag] || item.flag}</strong>
                    {item.reason ? ` — ${item.reason}` : ''}
                  </span>
                </li>
              );
            })}
          </ul>

          {generatedContent && generatedSummary.length > 0 && (
            <div className="rounded-lg border border-indigo-100 bg-white/80 px-3 py-2 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-500">
                {t('ai.structure.generatedTitle')}
              </p>
              {contentModelLabel && (
                <p className="text-[10px] text-indigo-600/80">
                  {t('ai.structure.contentModelLabel', { label: contentModelLabel })}
                </p>
              )}
              <ul className="list-disc pl-4 text-[11px] text-indigo-900 space-y-0.5">
                {generatedSummary.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={handleGenerateContent}
              disabled={contentBusy || busy || !selectedContentIds.length}
              className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
            >
              {contentBusy ? t('ai.generating') : t('ai.structure.generateContent')}
            </button>
            <button
              type="button"
              onClick={handleApplyStructure}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-500"
            >
              {t('ai.structure.applyStructure')}
            </button>
            {generatedContent && (
              <button
                type="button"
                onClick={handleApplyContent}
                className="rounded-lg border border-indigo-600 bg-indigo-600/10 px-3 py-1.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                {t('ai.structure.applyContent')}
              </button>
            )}
            {generatedContent && (
              <button
                type="button"
                onClick={handleApplyAll}
                className="rounded-lg bg-indigo-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-600"
              >
                {t('ai.structure.applyAll')}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setSuggestion(null);
                setGeneratedContent(null);
                setStructureMeta(null);
                setContentMeta(null);
              }}
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
