import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function adsenseBodyPlugin(mode) {
  const env = loadEnv(mode, process.cwd(), '');
  const client = String(env.VITE_GOOGLE_ADS_CLIENT || 'ca-pub-8125831908133216').trim();
  const slot = String(env.VITE_GOOGLE_ADS_SLOT || '').trim();

  return {
    name: 'adsense-body-inject',
    transformIndexHtml(html) {
      if (!slot) {
        return html.replace('<!-- ADSENSE_BODY_SLOT -->', '');
      }

      const block = `
    <div id="ld-static-ad" class="ld-ad-shell ld-ad-shell--bottom" aria-label="Sponsored">
      <ins
        class="adsbygoogle"
        style="display:block;width:100%"
        data-ad-client="${client}"
        data-ad-slot="${slot}"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
    <script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>`;

      return html.replace('<!-- ADSENSE_BODY_SLOT -->', block);
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), adsenseBodyPlugin(mode)],
  server: {
    port: 5175,
    strictPort: true,
  },
  preview: {
    port: 5175,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-router')) return 'router';
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react';
          }
          return undefined;
        },
      },
    },
  },
}));
