# Toqua marketing site

Public product site for Toqua (`https://toqua.site`). Bilingual ES/EN with English URL segments.

## Develop

```bash
cd toqua-site
npm install
npm run dev
```

Opens on **http://localhost:5176** (`strictPort`).

## Build & deploy

```bash
npm run build
npm run deploy   # firebase deploy --only hosting:toqua-marketing
```

`prebuild` runs `scripts/generate-seo.mjs` (sitemap, RSS, OG image).

## Env

See `.env.example`. `VITE_ADMIN_URL` drives signup CTAs (defaults to `https://admin.toqua.site`, or `http://localhost:5173` in development).
