import { httpsCallable } from 'firebase/functions';
import { getHubFunctions } from './firebaseClients';

function extractCallableErrorDetail(error) {
  const details = error?.details ?? error?.customData?.details ?? error?.customData;
  if (typeof details === 'string' && details.trim()) {
    return details.trim();
  }
  if (details && typeof details === 'object') {
    const fromDetails = details.detail || details.message || details.error;
    if (fromDetails) return String(fromDetails).trim();
  }

  const raw = String(error?.message ?? '').trim();
  const cleaned = raw
    .replace(/^FirebaseError:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .replace(/^functions\//i, '')
    .trim();

  if (!cleaned || /^(internal|unknown|unavailable)$/i.test(cleaned)) {
    return '';
  }
  // Client SDK sometimes prefixes: "unavailable: actual message"
  return cleaned.replace(/^(internal|unknown|unavailable|failed-precondition):\s*/i, '').trim();
}

export function mapAiError(error) {
  const code = String(error?.code ?? '');
  const detail = extractCallableErrorDetail(error);

  if (code.includes('unauthenticated')) {
    return detail || 'Debes iniciar sesión.';
  }
  if (code.includes('resource-exhausted')) {
    return detail || 'Cuota de IA agotada este mes.';
  }
  if (code.includes('permission-denied')) {
    return detail || 'Tu plan no permite esta acción de IA.';
  }
  if (code.includes('invalid-argument')) {
    return detail || 'La solicitud de IA no es válida.';
  }
  if (code.includes('not-found')) {
    return detail || 'Cloud Function de IA no desplegada. Despliega runAiAssist / generateLandingDraft.';
  }
  if (code.includes('unavailable') || code.includes('failed-precondition')) {
    return detail || 'El servicio de IA no está disponible. Revisa API key, modelo y conectividad.';
  }
  if (code.includes('deadline-exceeded') || code.includes('timeout')) {
    return detail || 'La generación con IA tardó demasiado. Inténtalo de nuevo.';
  }
  if (code.includes('internal') || code.includes('unknown')) {
    return detail || 'Error del servicio de IA. Revisa la configuración del proveedor (API key, modelo, cuota).';
  }
  return detail || 'No se pudo generar con IA.';
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

export async function generateLandingDraftRemote(payload) {
  try {
    const callable = httpsCallable(getHubFunctions(), 'generateLandingDraft', { timeout: 120000 });
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

export async function createCmsPageRemote(payload) {
  try {
    const callable = httpsCallable(getHubFunctions(), 'createCmsPage', { timeout: 60000 });
    const result = await callable(payload);
    return result.data;
  } catch (error) {
    const code = String(error?.code ?? '');
    const detail = extractCallableErrorDetail(error);
    const raw = String(error?.message ?? '');

    if (code.includes('already-exists')) {
      throw new Error(detail || 'Ya existe una página con ese ID.');
    }
    if (code.includes('resource-exhausted')) {
      throw new Error(detail || 'Límite de páginas alcanzado para tu plan.');
    }
    if (code.includes('permission-denied')) {
      throw new Error(detail || 'No tienes permiso para crear páginas.');
    }
    if (code.includes('invalid-argument')) {
      throw new Error(detail || 'Revisa el ID y el nombre de la página.');
    }
    if (code.includes('failed-precondition')) {
      if (/app check|appcheck|recaptcha/i.test(`${raw} ${detail}`)) {
        throw new Error(
          'App Check rechazó la petición. En local: registra el debug token de la consola en Firebase → App Check. En prod: verifica reCAPTCHA y el dominio del admin.',
        );
      }
      throw new Error(detail || 'No se pudo crear la página (suscripción o precondiciones).');
    }
    if (code.includes('unauthenticated')) {
      throw new Error(detail || 'Debes iniciar sesión de nuevo para crear páginas.');
    }
    if (code.includes('not-found') || code.includes('functions/not-found')) {
      throw new Error('Cloud Function createCmsPage no desplegada.');
    }
    throw new Error(detail || raw || 'No se pudo crear la página.');
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

/** Browser-side local model engine (Lite) — never sends secrets to our backend. */
export async function runLocalAssistant({
  system,
  user,
  model = 'llama3.2',
  baseUrl = 'http://127.0.0.1:11434',
} = {}) {
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/chat`;
  let response;
  try {
    response = await fetch(endpoint, {
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
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `El motor local no responde en ${baseUrl}. Comprueba que el servicio y el modelo estén disponibles. (${detail})`,
    );
  }
  const raw = await response.text();
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        `El modelo local «${model}» no está disponible. Instálalo o selecciona otro modelo.`,
      );
    }
    throw new Error(`El motor local falló (${response.status}): ${raw.slice(0, 160) || 'sin detalle'}`);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('Respuesta inválida del motor local.');
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
