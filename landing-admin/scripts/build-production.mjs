#!/usr/bin/env node
/**
 * Production build: non-empty values in .env.production win over the shell.
 * Empty/missing file keys fall back to shell VITE_* (GitHub Actions secrets).
 * (Vite gives process.env precedence over dotenv files, so we control the merge.)
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
];

/** Snapshot shell VITE_* then clear so vite loadEnv / assign order is explicit. */
const shellVite = {};
for (const key of Object.keys(process.env)) {
  if (!key.startsWith('VITE_')) continue;
  shellVite[key] = process.env[key];
  delete process.env[key];
}

const fileEnv = loadEnv('production', rootDir, '');
Object.assign(process.env, fileEnv);

for (const [key, value] of Object.entries(shellVite)) {
  if (!String(process.env[key] ?? '').trim() && String(value ?? '').trim()) {
    process.env[key] = value;
  }
}

const missing = REQUIRED.filter((key) => !String(process.env[key] ?? '').trim());
if (missing.length) {
  console.error(
    `[build-production] Missing required env: ${missing.join(', ')}. `
    + 'Provide landing-admin/.env.production or CI secrets.',
  );
  process.exit(1);
}

const result = spawnSync('vite', ['build'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
