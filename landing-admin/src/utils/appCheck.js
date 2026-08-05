// Keep in sync with landing-template/src/utils/appCheck.js

import { initializeAppCheck, ReCaptchaV3Provider, getToken } from 'firebase/app-check';
import { getHubApp } from './firebaseClients';

let initialized = false;
let appCheckInstance = null;

/**
 * MUST run before any initializeAppCheck(). The Firebase SDK reads
 * FIREBASE_APPCHECK_DEBUG_TOKEN only once during initializeDebugMode();
 * setting it later leaves debug mode off and forces reCAPTCHA (which breaks
 * localhost unless every domain is allowlisted).
 */
function applyDebugTokenGlobal() {
  if (typeof window === 'undefined') return;
  if (!import.meta.env.DEV) return;

  const debugToken = String(import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN ?? '').trim();
  if (debugToken) {
    globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
    return;
  }
  globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

// Eager: import this module early from main.jsx so the flag is set before Auth/callables.
applyDebugTokenGlobal();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatAppCheckTokenError(detail) {
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  const hasDebugEnv = Boolean(String(import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN ?? '').trim());
  const lines = [
    `App Check no pudo emitir un token (${detail}).`,
  ];

  if (import.meta.env.DEV || isLocal) {
    lines.push(
      'En local:',
      '1) Confirma que VITE_APP_CHECK_DEBUG_TOKEN está en .env.local y reinicia Vite.',
      '2) Registra ese UUID en Firebase Console → App Check → Manage debug tokens.',
      '3) La site key de VITE_RECAPTCHA_SITE_KEY debe ser reCAPTCHA v3 (no v2) y tener localhost / 127.0.0.1 en dominios permitidos.',
      '4) Desactiva bloqueadores que corten www.google.com/recaptcha.',
    );
    if (!hasDebugEnv) {
      lines.push('Falta VITE_APP_CHECK_DEBUG_TOKEN en el entorno de Vite.');
    }
  } else {
    lines.push(
      'En producción: comprueba VITE_RECAPTCHA_SITE_KEY, que el dominio esté en reCAPTCHA v3, y que App Check use la misma site key para esta app web.',
    );
  }

  return lines.join(' ');
}

/**
 * Start App Check after the user is signed in (not on the bare /login page).
 * Once initialized it stays for the page lifetime — logout must full-reload
 * (see AuthContext.signOut) so the next login is not blocked by Auth+App Check.
 */
export function initHubAppCheck() {
  if (initialized || typeof window === 'undefined') return appCheckInstance;

  const siteKey = String(import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? '').trim();
  if (!siteKey) {
    if (import.meta.env.DEV) {
      console.warn(
        '[App Check] Falta VITE_RECAPTCHA_SITE_KEY. Crea una clave reCAPTCHA v3 y regístrala en Firebase Console → App Check.',
      );
    }
    return null;
  }

  applyDebugTokenGlobal();

  appCheckInstance = initializeAppCheck(getHubApp(), {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });

  initialized = true;

  const configuredDebug = String(import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN ?? '').trim();
  if (import.meta.env.DEV) {
    const debugActive = Boolean(globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN);
    if (configuredDebug) {
      console.info(
        `[App Check] Debug token configurado (activo=${debugActive}). Debe estar registrado en Firebase Console → App Check → Manage debug tokens.`,
      );
    } else {
      console.info(
        '[App Check] Modo debug activo (token auto). Copia el UUID de la consola y regístralo en Firebase → App Check → Manage debug tokens, o define VITE_APP_CHECK_DEBUG_TOKEN.',
      );
    }
  }

  return appCheckInstance;
}

export function isAppCheckConfigured() {
  return Boolean(String(import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? '').trim());
}

/**
 * Refresh Auth + App Check tokens before callables.
 * Prefer a cached ID token; only force-refresh when near expiry.
 * Forced refresh often surfaces as auth/network-request-failed on flaky networks.
 */
export async function ensureCallableSession(auth) {
  initHubAppCheck();

  const currentUser = auth?.currentUser;
  if (!currentUser) {
    throw new Error('Debes iniciar sesión.');
  }

  try {
    const tokenResult = await currentUser.getIdTokenResult();
    const expiresAtMs = Date.parse(String(tokenResult?.expirationTime || ''));
    const msLeft = Number.isFinite(expiresAtMs) ? expiresAtMs - Date.now() : NaN;
    const shouldForceRefresh = Number.isFinite(msLeft) && msLeft < 5 * 60 * 1000;
    await currentUser.getIdToken(shouldForceRefresh);
  } catch (error) {
    const code = String(error?.code || '');
    const message = String(error?.message || '');
    // Cached token is usually still accepted by Functions; avoid blocking the whole call.
    try {
      await currentUser.getIdToken(false);
    } catch (fallbackError) {
      if (code.includes('network-request-failed') || /network-request-failed/i.test(message)) {
        throw Object.assign(
          new Error(
            'No se pudo renovar la sesión con Firebase (red). Revisa conexión, VPN/proxy o extensiones que bloqueen Google, e inténtalo de nuevo.',
          ),
          { code: 'auth/network-request-failed', cause: error },
        );
      }
      throw fallbackError;
    }
    if (import.meta.env.DEV) {
      console.warn(
        '[Auth] Refresh forzado falló; se usa token en caché:',
        message || code || error,
      );
    }
  }

  if (appCheckInstance) {
    const attempts = [
      { force: false, waitMs: 0 },
      { force: false, waitMs: 400 },
      { force: true, waitMs: 0 },
    ];
    let lastError = null;
    for (const attempt of attempts) {
      if (attempt.waitMs) await sleep(attempt.waitMs);
      try {
        await getToken(appCheckInstance, attempt.force);
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (lastError) {
      const detail = lastError?.message || lastError;
      if (import.meta.env.DEV) {
        console.warn('[App Check] No se pudo obtener token antes del callable:', detail);
        console.warn(
          '[App Check] FIREBASE_APPCHECK_DEBUG_TOKEN =',
          globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN,
        );
      }
      throw Object.assign(
        new Error(formatAppCheckTokenError(detail)),
        { code: 'app-check/token-error', cause: lastError },
      );
    }
  }

  return currentUser;
}

export function appCheckDevHint() {
  if (!import.meta.env.DEV) return '';
  return ' En local: VITE_APP_CHECK_DEBUG_TOKEN registrado en Firebase → App Check → Manage debug tokens, reinicia Vite, y autoriza localhost en reCAPTCHA v3.';
}
