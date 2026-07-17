let sequence = 0;

export function createContentId(prefix = 'item') {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${sequence.toString(36)}`;
}

export function normalizeContentId(value, fallback = '') {
  return String(value ?? '').trim() || String(fallback ?? '').trim();
}
