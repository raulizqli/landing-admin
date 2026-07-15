const STORAGE_KEY = 'adminLocale';
export const ADMIN_LOCALES = ['es', 'en'];
export const DEFAULT_ADMIN_LOCALE = 'es';

export function normalizeAdminLocale(value) {
  const locale = String(value ?? '').trim().toLowerCase().slice(0, 2);
  return ADMIN_LOCALES.includes(locale) ? locale : DEFAULT_ADMIN_LOCALE;
}

export function readStoredAdminLocale() {
  try {
    return normalizeAdminLocale(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_ADMIN_LOCALE;
  }
}

export function writeStoredAdminLocale(locale) {
  try {
    window.localStorage.setItem(STORAGE_KEY, normalizeAdminLocale(locale));
  } catch {
    // ignore
  }
}

/**
 * Resolve nested key paths like "billing.plans.pro.name".
 * Supports `{var}` interpolation from params.
 */
export function translate(messages, key, params = {}) {
  const path = String(key ?? '').split('.').filter(Boolean);
  let node = messages;
  for (const part of path) {
    if (node == null || typeof node !== 'object') {
      node = undefined;
      break;
    }
    node = node[part];
  }
  if (typeof node !== 'string') return key;
  return node.replace(/\{(\w+)\}/g, (_, name) => {
    if (params[name] == null) return `{${name}}`;
    return String(params[name]);
  });
}
