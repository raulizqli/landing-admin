# LeftSideDev marketing site — transformation audit

**Scope:** `leftsidedev-site/` only (https://leftsidedev.site).  
**Date:** 2026-08-04  
**Constraint honored:** Existing palette, typography (Syne / DM Sans), glass/rise-in motion, Tailwind layout, and SPA architecture preserved. No Next.js migration (`next/image` N/A — Vite SPA; images use lazy-ready placeholders).

---

## Completed changes

### Positioning & hero
- Rewrote H1 to **Custom Software, AI Automation & Scalable Applications**
- Subheadline, CTAs (**Book a Free Consultation** / **View Our Work**), and four proof points
- Brand remains a strong signal; single H1 on home

### Conversion sections (home)
- Why LeftSideDev (6 value cards)
- Expanded services grid (problem / benefits / technologies)
- Industries We Serve (+ `/industries` and `/industries/:slug`)
- Premium portfolio cards (challenge / solution / tech / outcome + placeholders)
- Testimonials (placeholders marked **PLACEHOLDER — replace**)
- Technology cards (not icon chips alone)
- 6-step process timeline
- FAQ (17 Qs) + FAQPage JSON-LD
- AI-search factual Q&A blocks
- Section-level CTAs + sticky CTA copy refresh

### Content & IA
- `agencyServices.js`, `industries.js`, `testimonials.js`, `faq.js`, `aiAnswers.js`
- Portfolio enriched; blog categories expanded for future posts (no articles generated)
- `DetailPageLayout` for reusable service/industry/case/article chrome
- Nav includes Industries

### SEO / AI discoverability
- Stronger static `index.html` title, description, OG, Twitter, robots, canonical
- Home schemas: WebSite, Organization, Person, FAQPage
- Sitemap generator includes industry routes
- Semantic sections, breadcrumbs on industry pages

---

## Remaining recommendations

1. **Replace placeholders** — real testimonials, portfolio screenshots, social URLs, Calendly.
2. **SSR / prerender** — SPA meta is client-injected; add prerender or migrate apex to CMS marketing mode for crawlers that skip JS.
3. **Wire newsletter** — footer still alerts; connect ESP.
4. **Real tech logos** — current tech cards use initials; SVG sprites would lift perceived polish without JS cost.
5. **Service GEO pages** — keep existing 13 detail pages; optionally add full GEO pages for API / cloud / maintenance slugs.
6. **Blog posts** — categories ready; publish 4–6 cornerstone articles.
7. **Lighthouse CI** — run against preview after deploy; watch home weight (many sections).
8. **Contact form backend** — still mailto; Forms/Functions would improve lead capture.
9. **GitHub AdSense secrets** — unrelated CMS work; ensure `VITE_GOOGLE_ADS_SLOT_ADMIN` is set so CI does not wipe admin ads.

---

## Lighthouse expectations

| Category | Expectation | Notes |
|----------|-------------|--------|
| Performance | ≥ 95 | Possible dip on home length; mitigate with lazy below-fold if needed |
| Accessibility | ≥ 95 | Accordion, landmarks, focus rings, alt/placeholders |
| SEO | ~100 | Meta + sitemap + FAQ schema; SPA caveat remains |
| Best Practices | ~100 | No new third-party JS beyond existing AdSense/fonts |

Re-run: `npx @lhci/cli autorun` with existing `lighthouserc.json` after deploy.

---

## Future roadmap

1. Prerender critical routes (`/`, services, industries)
2. Case study photography + verified quotes
3. Industry landing campaigns (paid + organic)
4. Blog publishing cadence (AI, automation, cloud)
5. Optional merge of this site into CMS `siteMode: 'marketing'` for unified editing
6. Estimate calculator localization / CRM webhook

---

## Code map (new / key)

| Path | Role |
|------|------|
| `src/content/site.js` | Hero, value props, tech cards, process, CTAs |
| `src/content/agencyServices.js` | Home service cards |
| `src/content/industries.js` | Industries catalog |
| `src/content/faq.js` / `aiAnswers.js` / `testimonials.js` | FAQ, AI blocks, quotes |
| `src/components/home/*` | Home sections |
| `src/pages/IndustriesPage.jsx` / `IndustryDetailPage.jsx` | Industry routes |
| `src/components/layout/DetailPageLayout.jsx` | Shared detail chrome |
| `docs` → this file | Audit report |
