import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const packagesDir = path.resolve(rootDir, '../packages')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      allow: ['..'],
    },
    watch: {
      // Workspace packages are symlinked; ensure file changes trigger HMR.
      ignored: [`!${packagesDir}/**`],
    },
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  // Do not prebundle linked workspace packages — that freezes UI/core until restart.
  optimizeDeps: {
    exclude: ['@raulizqli/landing-core', '@raulizqli/landing-ui'],
  },
})
