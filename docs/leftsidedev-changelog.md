# LeftSideDev implementation changelog

## 2026-07-18 — Enterprise Marketing Site MVP (CMS)

- Entitlement `marketingSite` on Enterprise plans
- `siteMode` / `marketing` / `seo` + `marketingRoutes` model in `landing-core`
- Firestore `pages/{pageId}/routes/{routeId}` rules
- Admin editors + mirror preview for marketing mode
- Template path-based renderer (`MarketingSite`) for home / services / contact
- Plan: `docs/enterprise-marketing-site-plan.md`

## 2026-07-18 — Corporate site foundation

### Architecture

- Added `leftsidedev-site/` Vite + React app (port `5175`) as the corporate marketing surface.
- Kept Landing CMS (`landing-admin` / `landing-template`) unchanged in responsibility.
- Documented plan in `docs/leftsidedev-optimization-plan.md`.

### Quick wins

- Repositioned brand to **AI Engineering Studio** with specialization list.
- Redesigned home hero: what / for whom / benefits, dual CTAs, stats, motion.
- Trust section: stack, process, methodologies.
- Final CTA: “Let’s build your next AI-powered product.”
- Sticky CTA + floating contact button.
- SEO head manager: title, description, robots, canonical, Open Graph, Twitter.
- Organization + ProfessionalService + Person schemas on home.
- `robots.txt`, generated `sitemap.xml`, `rss.xml`, OG asset.

### Medium impact

- 13 GEO service pages under `/services/*` (problems, benefits, tech, architecture, process, FAQ, ROI, alternatives + FAQ/Service/Breadcrumb schema).
- Case studies with Problem → Solution → Architecture → Results.
- Interactive portfolio detail pages (demo/video/GitHub hooks, architecture, stack, results).
- Contact form + Calendly link, estimate calculator, newsletter footer, lead-magnet checklist.

### Long-term foundation

- Technical blog with categories + 9 starter posts.
- Per-article social kits (LinkedIn, X thread, Reel/TikTok script, YouTube, Facebook, Instagram).
- Firebase hosting config stub (`hosting:marketing`).
- Seed `pages/leftsidedev` copy aligned to AI studio positioning (CMS remains a product line).

### Follow-ups

- Point `leftsidedev.site` hosting target at `leftsidedev-site/dist`.
- Set real `VITE_CALENDLY_URL` and CRM/newsletter providers.
- Expand service articles toward 1.2k–2.5k words with client-approved examples.
- Add true SSG/prerender HTML shells for crawler-first SEO.
- Wire Lighthouse CI gates.
