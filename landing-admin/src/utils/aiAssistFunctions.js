import { httpsCallable } from 'firebase/functions';
import { getHubFunctions } from './firebaseClients';

function mapAiError(error) {
  const code = String(error?.code ?? '');
  if (code.includes('unauthenticated')) return 'Debes iniciar sesión.';
  if (code.includes('resource-exhausted')) {
    return error?.message || 'Cuota de IA agotada este mes.';
  }
  if (code.includes('permission-denied')) {
    return error?.message || 'Tu plan no permite esta acción de IA.';
  }
  if (code.includes('not-found') || code.includes('functions/not-found')) {
    return 'Cloud Function de IA no desplegada. Despliega runAiAssist.';
  }
  return error?.message || 'No se pudo generar con IA.';
}

export async function runAiAssistRemote(payload) {
  try {
    const callable = httpsCallable(getHubFunctions(), 'runAiAssist', { timeout: 120000 });
    const result = await callable(payload);
    return result.data;
  } catch (error) {
    throw new Error(mapAiError(error));
  }
}

export async function getAiAssistUsageRemote() {
  try {
    const callable = httpsCallable(getHubFunctions(), 'getAiAssistUsage');
    const result = await callable({});
    return result.data;
  } catch (error) {
    throw new Error(mapAiError(error));
  }
}

export async function setAiProviderConfigRemote(payload) {
  try {
    const callable = httpsCallable(getHubFunctions(), 'setAiProviderConfig');
    const result = await callable(payload);
    return result.data;
  } catch (error) {
    throw new Error(mapAiError(error));
  }
}

/** Browser-side Local Ollama (Lite) — never sends secrets to our backend. */
export async function runLocalOllamaAssist({
  system,
  user,
  model = 'qwen2.5:7b',
  baseUrl = 'http://127.0.0.1:11434',
} = {}) {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      format: 'json',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Ollama local no disponible (${response.status}). ¿Está corriendo ollama serve?`);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('Respuesta inválida de Ollama local.');
  }
  const content = data?.message?.content || '{}';
  try {
    return JSON.parse(content);
  } catch {
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(content.slice(start, end + 1));
    return { text: String(content).trim() };
  }
}
