/**
 * Runtime environment for Toqua admin.
 * Prefer VITE_APP_ENV; fall back to Vite MODE / hostname.
 * Default when unknown: prod (deny demo logins).
 */

export const APP_ENVS = ['dev', 'stage', 'prod'];

export function normalizeAppEnv(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'production' || raw === 'prod') return 'prod';
  if (raw === 'staging' || raw === 'stage') return 'stage';
  if (raw === 'development' || raw === 'dev') return 'dev';
  return '';
}

export function resolveAppEnv({
  viteAppEnv = import.meta.env.VITE_APP_ENV,
  viteMode = import.meta.env.MODE,
  isDev = import.meta.env.DEV,
  hostname = typeof window !== 'undefined' ? window.location.hostname : '',
} = {}) {
  const explicit = normalizeAppEnv(viteAppEnv);
  if (explicit) return explicit;

  if (isDev) return 'dev';

  const mode = normalizeAppEnv(viteMode);
  if (mode) return mode;

  const host = String(hostname ?? '').trim().toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1') return 'dev';
  if (host.includes('stage') || host.includes('staging')) return 'stage';

  return 'prod';
}

/** Demo CMS users may sign in only on local/dev or stage — never production. */
export function allowsDemoUserLogin(env = resolveAppEnv()) {
  return env === 'dev' || env === 'stage';
}

/**
 * @returns {null | 'disabled' | 'demo' | 'pending' | 'rejected'}
 */
export function getLoginBlockReason(profile, env = resolveAppEnv()) {
  if (!profile) return null;
  const approval = String(profile.approvalStatus ?? '').trim().toLowerCase();
  if (approval === 'rejected') return 'rejected';
  if (profile.disabled === true) return 'disabled';
  if (approval === 'pending') return 'pending';
  if (!profile.role) return 'pending';
  if (profile.isDemo === true && !allowsDemoUserLogin(env)) return 'demo';
  return null;
}
