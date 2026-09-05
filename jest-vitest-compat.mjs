import fs from 'node:fs';
import path from 'node:path';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

const envSnapshot = { ...process.env };
const SOURCE_EXTENSIONS = ['', '.js', '.jsx', '.mjs', '.cjs'];

function resolveMockTarget(moduleName) {
  if (!moduleName.startsWith('.')) return moduleName;

  const stack = new Error().stack?.split('\n') ?? [];
  for (const line of stack) {
    const match = line.match(/\((.*):\d+:\d+\)/) || line.match(/at (file:\/\/[^:\s]+|\/[^:\s]+):\d+:\d+/);
    if (!match) continue;
    let file = match[1];
    if (file.startsWith('file://')) {
      file = new URL(file).pathname;
    }
    if (file.includes('jest-vitest-compat') || file.includes(`${path.sep}node_modules${path.sep}`)) {
      continue;
    }
    const candidate = path.resolve(path.dirname(file), moduleName);
    for (const ext of SOURCE_EXTENSIONS) {
      if (fs.existsSync(candidate + ext) && fs.statSync(candidate + ext).isFile()) {
        return candidate + ext;
      }
    }
    return candidate;
  }

  return moduleName;
}

export { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest };

export const vi = Object.assign(Object.create(jest), {
  fn: (...args) => jest.fn(...args),
  spyOn: (...args) => jest.spyOn(...args),
  mock(moduleName, factory) {
    return jest.unstable_mockModule(resolveMockTarget(moduleName), factory);
  },
  stubEnv(key, value) {
    if (value === undefined) {
      delete process.env[key];
      return;
    }
    process.env[key] = String(value);
  },
  unstubAllEnvs() {
    for (const key of Object.keys(process.env)) {
      if (!(key in envSnapshot)) delete process.env[key];
    }
    Object.assign(process.env, envSnapshot);
  },
});
