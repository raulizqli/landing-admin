// Keep in sync with landing-admin/src/utils/appCheck.js

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

  const appCheck = initializeAppCheck(getHubApp(), {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });

  initialized = true;
  return appCheck;
}
