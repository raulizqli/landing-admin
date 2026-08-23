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

## SEO

`npm run generate:seo` (también en `prebuild`): `sitemap.xml`, `rss.xml`, `og-default.svg` para ES y EN.
