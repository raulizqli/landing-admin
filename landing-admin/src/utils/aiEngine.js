/**
 * Default AI engine for the CMS assist UI.
 * On localhost / Vite DEV, prefer browser-side Ollama (no Cloud Functions round-trip).
 */
export function getDefaultAiEngine({
  isDev = import.meta.env.DEV,
  hostname = typeof window !== 'undefined' ? window.location.hostname : '',
} = {}) {
  const host = String(hostname || '').toLowerCase().replace(/^www\./, '');
  const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  return (isDev || isLocalHost) ? 'local' : 'platform';
}

export function getLocalOllamaConfig() {
  const baseUrl = String(import.meta.env.VITE_OLLAMA_BASE_URL || 'http://127.0.0.1:11434').trim()
    || 'http://127.0.0.1:11434';
  const model = String(import.meta.env.VITE_OLLAMA_MODEL || 'llama3.2').trim() || 'llama3.2';
  return { baseUrl, model };
}
