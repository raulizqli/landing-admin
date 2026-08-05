// Keep in sync with landing-template/src/utils/appCheck.js

import { initializeAppCheck, ReCaptchaV3Provider, getToken } from 'firebase/app-check';
import { getHubApp } from './firebaseClients';

let initialized = false;
let appCheckInstance = null;

function configureDebugToken() {
  if (!import.meta.env.DEV) return;

  const debugToken = String(import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN ?? '').trim();
  if (debugToken) {
    globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
    return;
  }

  globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

export function initHubAppCheck() {
  if (initialized || typeof window === 'undefined') return null;

  const siteKey = String(import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? '').trim();
  if (!siteKey) {
    if (import.meta.env.DEV) {
      console.warn(
        '[App Check] Falta VITE_RECAPTCHA_SITE_KEY. Crea una clave reCAPTCHA v3 y regístrala en Firebase Console → App Check.',
      );
    }
    return null;
  }

  configureDebugToken();

  appCheckInstance = initializeAppCheck(getHubApp(), {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });

  initialized = true;

  const configuredDebug = String(import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN ?? '').trim();
  if (import.meta.env.DEV) {
    if (configuredDebug) {
      console.info(
        '[App Check] Usando VITE_APP_CHECK_DEBUG_TOKEN. Debe estar registrado en Firebase Console → App Check → Manage debug tokens.',
      );
    } else {
      console.info(
        '[App Check] Modo debug activo. Copia el token de la consola del navegador y regístralo en Firebase Console → App Check → Manage debug tokens. O define VITE_APP_CHECK_DEBUG_TOKEN en .env.local.',
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
    try {
      await getToken(appCheckInstance, /* forceRefresh */ false);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[App Check] No se pudo obtener token antes del callable:', error?.message || error);
      }
    }
  }

  return currentUser;
}

export function appCheckDevHint() {
  if (!import.meta.env.DEV) return '';
  return ' En local, App Check suele causar "Unauthenticated": registra VITE_APP_CHECK_DEBUG_TOKEN (o el token de la consola) en Firebase → App Check → Manage debug tokens y reinicia Vite.';
}
