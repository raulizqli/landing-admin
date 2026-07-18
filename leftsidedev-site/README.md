# LeftSideDev Site — AI Engineering Studio (design sandbox)

Corporate marketing **reference UI** for **LeftSideDev**, positioned as an AI Engineering Studio.

> **Production path (Phase 5):** the live apex domain should be served by `landing-template` with `pages/leftsidedev` in `siteMode: 'marketing'`, edited in `landing-admin`. See [docs/marketing-site-deploy.md](../docs/marketing-site-deploy.md). This Vite app remains useful for design experiments; it is not required for production hosting.

## Stack

- Vite + React 19 + React Router
- Tailwind CSS v4
- `react-helmet-async` for per-route SEO
- Build-time `sitemap.xml` + `rss.xml` generation

## Local development

```bash
# from repo root
npm install
npm run dev:site
```

URL: `http://localhost:5175`

Optional env (`leftsidedev-site/.env.local`):

```bash
VITE_CALENDLY_URL=https://calendly.com/your-link
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server on port 5175 |
| `npm run build` | Generate SEO artifacts + production bundle |
| `npm run generate:seo` | Only sitemap / RSS / OG asset |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

## Routes

- `/` — Home (hero, services, cases, trust, final CTA)
- `/services` and `/services/:slug` — GEO service pages
- `/case-studies` — Problem → Solution → Architecture → Results
- `/portfolio` — Interactive project detail
- `/blog` — Technical blog + social publishing kits
- `/contact` — Form + Calendly
- `/estimate` — Project calculator
- `/resources` — Lead magnet checklist + AI guide

## Deploy notes

Point the `leftsidedev.site` Firebase Hosting target (or equivalent) at `leftsidedev-site/dist` when ready. Until then, the Landing CMS seed page remains available via `landing-template?pageId=leftsidedev`.

See [docs/leftsidedev-optimization-plan.md](../docs/leftsidedev-optimization-plan.md) for the prioritized roadmap.
