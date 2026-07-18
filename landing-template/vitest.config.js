import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@raulizqli/landing-core': path.resolve(rootDir, '../packages/landing-core/src'),
      '@raulizqli/landing-core/': `${path.resolve(rootDir, '../packages/landing-core/src')}/`,
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
});
