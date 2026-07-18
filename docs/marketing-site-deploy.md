# Marketing Site deploy notes (Phase 5)

Enterprise Marketing Sites are served by **`landing-template`** when `siteMode: 'marketing'`. The static `leftsidedev-site/` app remains a **design sandbox**; production apex should use the template + CMS.

## LeftSideDev showcase (client #0)

Seed / refresh Firestore:

```bash
cd functions
node scripts/seed-leftsidedev-page.mjs
```

This writes:

- `pages/leftsidedev` with `siteMode: 'marketing'`, `marketing`, `seo`, `seoArtifacts`
- `pages/leftsidedev/routes/*` (home, services, cases, blog, estimate, resources, contact)

Local preview:

```bash
# template
cd landing-template && npm run dev
# http://localhost:5174/?pageId=leftsidedev
# http://localhost:5174/services/ai-agents  (same origin once pageId resolved via env or query)
```

For path routes locally, set:

```env
VITE_PAGINA_ID=leftsidedev
```

Then open `http://localhost:5174/`, `/services`, `/blog`, etc.

## SEO feeds (sitemap / RSS / robots)

On **Guardar y Publicar** (marketing mode), the admin generates and stores:

```text
seoArtifacts: { sitemapXml, rssXml, robotsTxt, generatedAt, baseUrl }
```

Cloud Functions serve them with correct content types:

| Path | Function |
|---|---|
| `/sitemap.xml` | `marketingSitemap` |
| `/rss.xml` | `marketingRss` |
| `/robots.txt` | `marketingRobots` |

Resolution order: `?pageId=` → `Host` / `customDomain`.

### Deploy order (when you are ready)

```bash
npm run deploy:rules
npm run deploy:functions
npm run deploy:template
```

Ensure `canonicalBaseUrl` or `customDomain` is set (seed uses `https://leftsidedev.site`).

`landing-template/firebase.json` rewrites SEO paths to the functions **before** the SPA catch-all.

## Point `leftsidedev.site` at the template

1. Firebase Hosting target `template` already serves `landing-template/dist`.
2. Attach custom domain `leftsidedev.site` to that hosting site (not a separate marketing Vite deploy).
3. Keep `pages/leftsidedev.customDomain = leftsidedev.site`.
4. Set admin marketing redirect:

```env
VITE_MARKETING_URL=https://leftsidedev.site
```

5. Optional: stop deploying `leftsidedev-site` to any public host; keep the folder for design reference only.

## Edit showcase from admin

1. Enterprise/root → open `leftsidedev`
2. **Marketing Site** section + route chips
3. Mirror preview → **Guardar y Publicar**
4. SEO artifacts refresh automatically when `canonicalBaseUrl` / routes change
