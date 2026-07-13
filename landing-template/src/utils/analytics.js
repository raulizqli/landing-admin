import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported, logEvent } from 'firebase/analytics';
import { getHubConfigFromEnv, hasValidFirebaseConfig, normalizeFirebaseConfig } from './firebaseClients';

const firebaseConfig = getHubConfigFromEnv();

const ANALYTICS_APP_NAME = 'landing-analytics';

let analyticsInstance = null;

function shouldSkipAnalytics() {
  return import.meta.env.DEV;
}

export function resolveMeasurementId(data) {
  const fromPage = String(data?.analyticsMeasurementId ?? '').trim();
  const fromEnv = String(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? '').trim();
  const measurementId = fromPage || fromEnv;
  return /^G-[A-Z0-9]+$/i.test(measurementId) ? measurementId : '';
}

export async function initLandingAnalytics(data, { pageId, firebaseConfig: projectConfig = null } = {}) {
  if (shouldSkipAnalytics()) return;

  const measurementId = resolveMeasurementId(data);
  if (!measurementId) return;

  const supported = await isSupported();
  if (!supported) return;

  const baseConfig = hasValidFirebaseConfig(projectConfig)
    ? normalizeFirebaseConfig(projectConfig)
    : firebaseConfig;

  const existingApp = getApps().find((app) => app.name === ANALYTICS_APP_NAME);
  const analyticsApp = existingApp || initializeApp(
    { ...baseConfig, measurementId },
    ANALYTICS_APP_NAME,
  );

  analyticsInstance = getAnalytics(analyticsApp);

  logEvent(analyticsInstance, 'page_view', {
    page_id: pageId,
    page_title: data?.name || pageId,
    page_location: window.location.href,
  });
}

export function trackLandingEvent(eventName, params = {}) {
  if (!analyticsInstance || shouldSkipAnalytics()) return;
  logEvent(analyticsInstance, eventName, params);
}
