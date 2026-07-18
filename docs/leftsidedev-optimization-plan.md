# LeftSideDev Optimization Plan — AI Engineering Studio

## Current state (analysis)

| Asset | Role today | Gap vs. target |
|---|---|---|
| `functions/scripts/seed-leftsidedev-page.mjs` | Firestore seed for `pages/leftsidedev` | Positions LeftSideDev as a **Landing CMS**, not an AI Engineering Studio |
| `landing-template` | Single-document SPA for all tenants | No multi-route services/blog/SEO shell; cream therapeutic aesthetic |
| `landing-admin` | Multi-tenant CMS | Guest `/` redirects to marketing URL; not a corporate site |
| SEO surface | Document `title` only | No OG/Twitter, schema, sitemap, RSS, GEO structure |

**Decision:** Ship a dedicated Vite app `leftsidedev-site/` for the corporate site. Keep the Landing CMS seed as a **product** page; do not overload psychologist landings with corporate IA marketing.

---

## Prioritized roadmap

### Quick Wins (shipped in this PR)

1. **Branding** — “AI Engineering Studio” + specialization list  
2. **Hero** — value prop, dual CTAs, stats, soft motion  
3. **Trust strip** — stack, process, methodologies  
4. **Final CTA** — discovery call + project estimate  
5. **SEO basics** — title/description/canonical/OG/Twitter, Organization + ProfessionalService schema, `robots.txt`, `sitemap.xml`  
6. **Conversion chrome** — sticky CTA, floating contact, Calendly-ready links  

### Medium Impact (shipped in this PR)

1. **Service pages** (`/services/*`) — GEO sections (what / who / benefits / architecture / process / FAQ / ROI / alternatives)  
2. **Case studies** — Problem → Solution → Architecture → Results  
3. **Portfolio** — interactive project detail (demo, stack, architecture, results)  
4. **Contact + estimate calculator** + newsletter/lead-magnet stubs  
5. **FAQ / Breadcrumb / Article** structured data where applicable  

### Long-Term Improvements (foundation + next iterations)

1. Expand blog to a full editorial calendar (all category pillars)  
2. True SSG/SSR (Astro/Vike) or Firebase prerender for every HTML shell  
3. Live Calendly embed + CRM webhook on forms  
4. Auto-publish social pipelines (LinkedIn/X/TikTok/YouTube) from blog CI  
5. Lighthouse CI gates (Performance/A11y/SEO/BP ≥ 95)  
6. Real case-study media (video, screenshots CDN) and client logos under NDA  
7. Point `leftsidedev.site` hosting target at `leftsidedev-site` dist  

---

## Architecture

```text
leftsidedev-site/          Corporate marketing (EN-first, dark premium)
  src/content/             Source of truth for copy (GEO + SEO)
  src/pages/               Route-level views
  src/components/          Layout, SEO, conversion, sections
  public/                  robots.txt, favicon, lead magnets
  scripts/generate-seo.mjs sitemap + RSS at build time
```

Separates cleanly from:

```text
landing-admin + landing-template + packages/*   ← Landing CMS product
```

---

## Design system (corporate)

- Dark premium, generous whitespace, subtle glass  
- CSS variables for ink / surface / accent / mist  
- Display: Syne · Body: DM Sans  
- Mobile-first, WCAG AA contrast, visible focus rings  
- Motion: fade/rise on hero, sticky CTA slide-in, section reveal  

Avoid: purple-indigo AI cliché, cream therapeutic CMS palette on this site, card-stuffed heroes.

---

## Conversion stack

| Element | Placement |
|---|---|
| Book a Discovery Call | Nav, hero, sticky, final CTA |
| View Case Studies | Hero secondary |
| Estimate My Project | Final CTA + `/estimate` |
| Floating contact | Global FAB |
| Contact form | `/contact` |
| Newsletter + lead magnet | Footer / resources |

---

## Success criteria

- International AI studio look in &lt;5s  
- Clear “what / for whom / benefit / CTA” above the fold  
- Indexable routes for services, cases, portfolio, blog  
- Cite-ready GEO answers on every service page  
- Existing Landing CMS admin/template flows unchanged  
