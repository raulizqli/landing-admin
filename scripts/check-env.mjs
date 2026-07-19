#!/usr/bin/env node
/**
 * Heuristic guardrails for Dev/Stage/Prod builds.
 *
 * Usage:
 *   node scripts/check-env.mjs --mode production --env prod
 *   node scripts/check-env.mjs --mode staging --env stage
 *   npm run check:env
 *   npm run check:env:staging
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

function argValue(flag, fallback = '') {
  const index = process.argv.indexOf(flag);
  if (index === -1) return fallback;
  return process.argv[index + 1] || fallback;
}

const mode = argValue('--mode', process.env.VITE_ENV_MODE || 'production');
const envName = argValue('--env', process.env.FIREBASE_ENV || '');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const errors = [];
const warnings = [];

function readEnvFile(relPath) {
  const full = path.join(root, relPath);
  if (!existsSync(full)) return '';
  return readFileSync(full, 'utf8');
}

function parseEnv(text) {
  const map = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map[key] = value;
  }
  return map;
}

const processEnv = { ...process.env };
const fileCandidates = [];
if (mode === 'staging') {
  fileCandidates.push(
    'landing-admin/.env.staging',
    'landing-template/.env.staging',
    'functions/.env.landings-stage',
    'functions/.env.staging',
  );
} else if (mode === 'production') {
  fileCandidates.push(
    'landing-admin/.env.production',
    'landing-template/.env.production',
    'functions/.env',
  );
} else {
  fileCandidates.push(
    'landing-admin/.env',
    'landing-admin/.env.development',
    'functions/.env',
  );
}

const merged = { ...processEnv };
for (const file of fileCandidates) {
  Object.assign(merged, parseEnv(readEnvFile(file)));
}

// Strict Stripe/MP checks only when --env prod|stage is explicit (promote / deploy scripts).
// CI uses --mode production without --env so repo test keys do not fail pull requests.
const isProd = envName === 'prod';
const isStage = envName === 'stage' || (mode === 'staging' && envName !== 'prod');
const isProdLikeBuild = isProd || (mode === 'production' && !envName);

if (isProdLikeBuild) {
  if (merged.VITE_APP_CHECK_DEBUG_TOKEN) {
    errors.push('Prod build must not set VITE_APP_CHECK_DEBUG_TOKEN.');
  }
  if (merged.VITE_FUNCTIONS_EMULATOR_HOST) {
    errors.push('Prod build must not set VITE_FUNCTIONS_EMULATOR_HOST.');
  }
}

if (isProd) {
  if (String(merged.STRIPE_SECRET_KEY || '').startsWith('sk_test_')) {
    errors.push('Prod Functions appear to use Stripe test key (sk_test_). Use live keys.');
  }
  if (String(merged.MERCADOPAGO_ACCESS_TOKEN || '').startsWith('TEST-')) {
    errors.push('Prod Functions appear to use Mercado Pago TEST token.');
  }
}

if (isStage) {
  if (String(merged.STRIPE_SECRET_KEY || '').startsWith('sk_live_')) {
    warnings.push('Stage should use Stripe test keys, not sk_live_.');
  }
  if (merged.VITE_APP_CHECK_DEBUG_TOKEN) {
    warnings.push(
      'Stage has VITE_APP_CHECK_DEBUG_TOKEN set (OK for QA, disable for prod-like App Check tests).',
    );
  }
}

const projectId = merged.VITE_FIREBASE_PROJECT_ID || '';
if (isProd && projectId && /stage|dev|staging/i.test(projectId)) {
  errors.push(`Prod build points at non-prod Firebase project: ${projectId}`);
}
if (isStage && projectId && /prod|9452e/i.test(projectId) && !/stage/i.test(projectId)) {
  warnings.push(`Stage build may be pointing at prod-like project id: ${projectId}`);
}

for (const warning of warnings) {
  console.warn(`WARN: ${warning}`);
}

if (errors.length) {
  for (const error of errors) {
    console.error(`ERROR: ${error}`);
  }
  process.exit(1);
}

console.log(`check-env OK (mode=${mode}${envName ? ` env=${envName}` : ''})`);
