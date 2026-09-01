#!/usr/bin/env node
/**
 * Static guard: landing-admin must not call getFunctions()/getAuth()/getFirestore()
 * without the hub app at module top-level (breaks boot with app/no-app).
 *
 * Usage: node scripts/lint-firebase-clients.mjs
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'landing-admin', 'src');
const FORBIDDEN_TOP_LEVEL = [
  /\bgetFunctions\s*\(\s*\)/,
  /\bgetAuth\s*\(\s*\)/,
  /\bgetFirestore\s*\(\s*\)/,
  /\bgetStorage\s*\(\s*\)/,
];

const ALLOWLIST = new Set([
  path.join(root, 'utils', 'firebaseClients.js'),
]);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (/\.(js|jsx|ts|tsx)$/.test(entry)) files.push(full);
  }
  return files;
}

function isTopLevelCall(source, pattern) {
  const lines = source.split('\n');
  let depth = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    if (pattern.test(line) && depth === 0) return true;
    depth += (line.match(/\{/g) || []).length;
    depth -= (line.match(/\}/g) || []).length;
    depth += (line.match(/\(/g) || []).length;
    depth -= (line.match(/\)/g) || []).length;
    if (depth < 0) depth = 0;
  }
  return false;
}

const violations = [];

for (const file of walk(root)) {
  if (ALLOWLIST.has(file)) continue;
  const source = readFileSync(file, 'utf8');
  for (const pattern of FORBIDDEN_TOP_LEVEL) {
    if (isTopLevelCall(source, pattern)) {
      violations.push(`${path.relative(root, file)}: top-level ${pattern}`);
    }
  }
}

if (violations.length) {
  console.error('[lint-firebase-clients] Forbidden top-level Firebase default-app calls:\n');
  for (const v of violations) console.error(`  - ${v}`);
  console.error('\nUse getHubFunctions(), getHubAuth(), getHubDb(), getHubStorage() from firebaseClients.js.');
  process.exit(1);
}

console.log('[lint-firebase-clients] OK');
