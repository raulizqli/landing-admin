# Toqua product marketing site (`toqua-site/`)

Sitio público de producto en **https://toqua.site** (local: **http://localhost:5176**).

Independiente de `leftsidedev-site/` (LeftSideDev en `leftsidedev.site` no se modifica).

## Qué es

Marketing bilingüe **ES / EN** para Toqua: ayuda a profesionales (psicología, pediatría, etc.) a tener y cuidar su página en internet, en lenguaje llano (sin jerga técnica).

## Desarrollo

```bash
npm run dev:toqua
# http://localhost:5176  → redirige a /es
```

Variables opcionales:

| Variable | Uso |
|---|---|
| `VITE_ADMIN_URL` | CTA «Crear mi página» (dev default `http://localhost:5173`) |

## Rutas

Prefijo de idioma + paths siempre en inglés:

- `/es`, `/en`
- `/es/what-you-get`, `/es/pricing`, `/es/professions`, `/es/how-it-works`, `/es/faq`, `/es/blog`, `/es/resources`, `/es/contact`, `/es/compare`

## Colorimetría

Tokens en `toqua-site/src/index.css` y `landing-admin/src/index.css`:

- `--bg-primary: #FCFBF9`
- `--text-purple: #523677`
- `--q-gradient` (púrpura → azul)

## Logos

Fuente: `landing-admin/public/brand/` (nombres `toqua-{pieza}-{layout}-{fondo}`). Copiados a `toqua-site/public/brand/`.

| Uso | Asset |
|---|---|
| Login / header marketing ES | `toqua-lockup-horizontal-light-tagline-short.png` (sin fondo) |
| Hero / footer | `*-transparent.png` (stacked, wordmark-q, lockup largo) |
| Admin sidebar / favicon | `toqua-mark-square-dark.png` |

## Deploy

```bash
npm run build:toqua
npm run deploy:toqua
# firebase deploy --only hosting:toqua-marketing
```

Requiere sitio Firebase Hosting `toqua-marketing` vinculado al target en `.firebaserc`.

## Dominio custom (`toqua.site`)

El dominio debe apuntar al sitio **`toqua-marketing`**, no al sitio por defecto del proyecto.

| Registro | Valor |
|---|---|
| `A` | `199.36.158.100` |
| `TXT` | `hosting-site=toqua-marketing` |

Si el TXT sigue en `hosting-site=landing-admin-9452e`, Firebase responde **404** aunque el deploy esté bien (`toqua-marketing.web.app` sí funciona).

Diagnóstico:

```bash
node scripts/check-toqua-site-dns.mjs
```

En Firebase Console: **Hosting → toqua-marketing → Dominios personalizados → toqua.site**.

## AdSense

- Script + meta en `toqua-site/index.html`
- `public/ads.txt` (publisher `ca-pub-8125831908133216`)
- CSP en `toqua-site/firebase.json` incluye dominios de Google Ads

Validar en AdSense con `toqua.site` solo después de que el dominio custom responda 200 (TXT correcto).

## SEO

`npm run generate:seo` (también en `prebuild`): `sitemap.xml`, `rss.xml`, `og-default.svg` para ES y EN.
