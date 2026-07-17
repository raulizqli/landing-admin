// Keep in sync with landing-template/src/utils/firebaseClients.js

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import {
  hasValidFirebaseConfig,
  normalizeFirebaseConfig,
} from '@raulizqli/landing-core/firebaseConfig';

export { hasValidFirebaseConfig, normalizeFirebaseConfig };

const HUB_APP_NAME = 'hub';
let functionsEmulatorConnected = false;
const firestoreByAppName = new Map();

/**
 * Firefox Enhanced Tracking Protection often blocks Firestore WebChannel.
 * Force long-polling so Auth can succeed while Firestore still loads profiles/pages.
 */
function getFirestoreForApp(app) {
  const key = app.name;
  if (firestoreByAppName.has(key)) {
    return firestoreByAppName.get(key);
  }

  const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
  firestoreByAppName.set(key, db);
  return db;
}

export function getHubConfigFromEnv() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };
}

export function getOrInitFirebaseApp(config, appName) {
  const normalized = normalizeFirebaseConfig(config);
  const existing = getApps().find((app) => app.name === appName);
  if (existing) return existing;
  return initializeApp(normalized, appName);
}

export function getHubApp() {
  return getOrInitFirebaseApp(getHubConfigFromEnv(), HUB_APP_NAME);
}

export function getHubDb() {
  return getFirestoreForApp(getHubApp());
}

export function getHubStorage() {
  return getStorage(getHubApp());
}

export function getHubAuth() {
  return getAuth(getHubApp());
}

export function getHubFunctions() {
  const functions = getFunctions(getHubApp(), 'us-central1');
  const emulatorHost = String(import.meta.env.VITE_FUNCTIONS_EMULATOR_HOST ?? '').trim();

  if (import.meta.env.DEV && emulatorHost && !functionsEmulatorConnected) {
    const [host, portValue] = emulatorHost.split(':');
    const port = Number(portValue) || 5001;
    connectFunctionsEmulator(functions, host || '127.0.0.1', port);
    functionsEmulatorConnected = true;
  }

  return functions;
}

export function getDbForConfig(config) {
  if (!hasValidFirebaseConfig(config)) {
    return getHubDb();
  }
  const normalized = normalizeFirebaseConfig(config);
  const appName = `ext-${normalized.projectId}`;
  return getFirestoreForApp(getOrInitFirebaseApp(normalized, appName));
}

export function getStorageForConfig(config) {
  if (!hasValidFirebaseConfig(config)) {
    return getHubStorage();
  }
  const normalized = normalizeFirebaseConfig(config);
  const appName = `ext-${normalized.projectId}`;
  return getStorage(getOrInitFirebaseApp(normalized, appName));
}

export function getContentDbForPage(pageData) {
  if (pageData?.useExternalFirebase === true && hasValidFirebaseConfig(pageData?.externalFirebase)) {
    return getDbForConfig(pageData.externalFirebase);
  }
  return getHubDb();
}

export function getContentStorageForPage(pageData) {
  if (pageData?.useExternalFirebase === true && hasValidFirebaseConfig(pageData?.externalFirebase)) {
    return getStorageForConfig(pageData.externalFirebase);
  }
  return getHubStorage();
}
