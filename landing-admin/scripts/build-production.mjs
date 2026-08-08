#!/usr/bin/env node
/**
 * Production build: .env.production must win over stale VITE_* in the shell.
 * (Vite gives process.env precedence over dotenv files.)
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const key of Object.keys(process.env)) {
  if (key.startsWith('VITE_')) {
    delete process.env[key];
  }
}

const fileEnv = loadEnv('production', rootDir, '');
Object.assign(process.env, fileEnv);

const result = spawnSync('vite', ['build'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
