export function normalizeFirebaseConfig(config = {}) {
  return {
    apiKey: String(config.apiKey ?? '').trim(),
    authDomain: String(config.authDomain ?? '').trim(),
    projectId: String(config.projectId ?? '').trim(),
    storageBucket: String(config.storageBucket ?? '').trim(),
    messagingSenderId: String(config.messagingSenderId ?? '').trim(),
    appId: String(config.appId ?? '').trim(),
  };
}

export function hasValidFirebaseConfig(config) {
  const next = normalizeFirebaseConfig(config);
  return Boolean(next.apiKey && next.projectId && next.appId);
}
