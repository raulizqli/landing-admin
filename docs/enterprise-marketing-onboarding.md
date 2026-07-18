# Enterprise Marketing Site — client onboarding

Use this checklist when activating a **Marketing Site** for an Enterprise client (or Agency with the paid add-on).

## 1. Commercial activation

| Path | Action |
|---|---|
| **Enterprise** | Root → Plans → activate Enterprise manually, or sales closes custom deal |
| **Agency + add-on** | Root → Plans → **Ops: Marketing Site add-on** → set `billingAccounts/{id}` add-on ON |

Entitlement sources (any one is enough):

1. Plan `enterprise` with status `active` / `trialing`
2. Account `addons.marketingSite: true` (typically Agency)
3. User role `root` (ops bypass)

Hard gate: Cloud Function `assertMarketingSiteAccess` runs on every **Guardar y Publicar** when `siteMode === 'marketing'`. Soft UI gate still downgrades to landing if the client lacks entitlement.

## 2. Create / convert the site

1. Create a page (or pick an existing hub page).
2. Open **Marketing Site** in the editor → **Enable Marketing Site**.
3. Fill brand: `name`, `specialty`, primary/secondary CTAs, stats, process steps.
4. Edit routes (home, services, case studies, blog, contact, estimate, resources).
5. Set `seo.canonicalBaseUrl` to the client apex (`https://client.com`).
6. Preview in the right-hand mirror (local `formData`, zero Firestore writes per keystroke).
7. **Guardar y Publicar** — writes page + `routes` + `seoArtifacts`.

## 3. Domain & hosting

1. Point the client domain at the **landing-template** hosting target (same as classic landings).
2. Ensure the page resolves via `customDomain` / Host header (see `docs/marketing-site-deploy.md`).
3. After functions deploy, verify:

```text
https://client.com/sitemap.xml
https://client.com/rss.xml
https://client.com/robots.txt
```

## 4. Quality bar (Phase 6)

- Accessibility: skip link, landmarks, focus rings, reduced motion, mobile nav — shipped in `MarketingSite`.
- Lighthouse budgets:
  - Shared: `packages/landing-ui/marketing-lighthouse-budget.json`
  - Showcase sandbox: `leftsidedev-site/lighthouserc.json`
- Entitlement unit tests: `npm run test:core`

Suggested Lighthouse run against the sandbox after `npm run build:site`:

```bash
npx @lhci/cli autorun --config=leftsidedev-site/lighthouserc.json
```

## 5. Handoff to the client

- Admin login (admin / user roles as needed).
- Explain: mirror preview is instant; publish is explicit.
- Warn: changing `siteMode` back to `landing` keeps classic sections but hides marketing routes in the public template.
- Share SEO URLs and Calendly / primary CTA configuration.

## Related docs

- Product plan: `docs/enterprise-marketing-site-plan.md`
- Deploy notes: `docs/marketing-site-deploy.md`
- Design reference (static): `leftsidedev-site/`
