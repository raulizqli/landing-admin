#!/usr/bin/env node
/**
 * Runs landing-admin smoke tests that verify boot-critical imports.
 * Uses Vitest so JSX / import.meta.env resolve like CI builds.
 *
 * Usage: node scripts/smoke-admin-bootstrap.mjs
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const result = spawnSync(
  'npm',
  ['test', '--prefix', 'landing-admin', '--', 'src/smoke.test.js'],
  { cwd: root, stdio: 'inherit', env: process.env },
);

if (result.status !== 0) {
  console.error('[smoke-admin-bootstrap] landing-admin smoke tests failed.');
  process.exit(result.status ?? 1);
}

console.log('[smoke-admin-bootstrap] OK');
