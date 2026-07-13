// Keep in sync with landing-admin/src/utils/appCheck.js
// Public template: App Check is opt-in. Enforcing it without registering
// every Hosting/custom domain in reCAPTCHA breaks anonymous Firestore reads.

import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getHubApp } from './firebaseClients';

let initialized = false;

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

  const enabled = String(import.meta.env.VITE_ENABLE_APP_CHECK ?? '').trim() === 'true';
  if (!enabled) {
    if (import.meta.env.DEV) {
      console.info(
        '[App Check] Desactivado en el template (sitio público). Actívalo con VITE_ENABLE_APP_CHECK=true cuando el dominio esté en reCAPTCHA v3.',
      );
    }
    return null;
  }

  const siteKey = String(import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? '').trim();
  if (!siteKey) {
    console.warn(
      '[App Check] VITE_ENABLE_APP_CHECK=true pero falta VITE_RECAPTCHA_SITE_KEY.',
    );
    return null;
  }

  configureDebugToken();

  const appCheck = initializeAppCheck(getHubApp(), {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });

  initialized = true;
  return appCheck;
}
