import {
  defaultStructureContentTargets,
  normalizeStructureContentTargets,
} from '@raulizqli/landing-core/aiAssist';

const STORAGE_PREFIX = 'tapsite:structure-assist:';

export function loadStructureAssistPrefs(pageId) {
  if (!pageId || typeof window === 'undefined' || !window.localStorage) {
    return {
      note: '',
      contentTargets: defaultStructureContentTargets(),
    };
  }
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${pageId}`);
    if (!raw) {
      return {
        note: '',
        contentTargets: defaultStructureContentTargets(),
      };
    }
    const parsed = JSON.parse(raw);
    return {
      note: String(parsed?.note ?? ''),
      contentTargets: normalizeStructureContentTargets(parsed?.contentTargets),
    };
  } catch {
    return {
      note: '',
      contentTargets: defaultStructureContentTargets(),
    };
  }
}

export function saveStructureAssistPrefs(pageId, prefs = {}) {
  if (!pageId || typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${pageId}`, JSON.stringify({
      note: String(prefs.note ?? ''),
      contentTargets: normalizeStructureContentTargets(prefs.contentTargets),
    }));
  } catch {
    // ignore quota / private mode
  }
}
