# Plan: Enterprise Marketing Site (admin-configurable)

## Goal

Offer clients a **multi-page marketing site** (home, services, case studies, blog, contact, conversion chrome) as an **Enterprise** capability, while keeping:

- the same admin mental model (list → form → mirror preview);
- local preview with **zero Firestore writes per keystroke**;
- existing single-landing product for Starter / Pro / Agency;
- English data model + `normalizePageData()` as source of truth.

LeftSideDev’s own `leftsidedev-site/` remains the **reference implementation / showcase**. Client sites must be **data-driven from the CMS**, not forks of that repo.

---

## Product packaging

| Plan | Site type | Editable in admin |
|---|---|---|
| Starter | Single landing | Current sections |
| Pro | Single landing + blog/embeds | Current + Pro features |
| Agency | Up to 5 single landings | Current + Agency features |
| **Enterprise** | **Marketing Site** (multi-route) **or** unlimited single landings | Current + Marketing Site editor |

### Entitlement

Add feature flag (not only plan rank):

```js
features: {
  // existing…
  marketingSite: false, // starter/pro/agency
  marketingSite: true,  // enterprise (default on)
}
```

Optional later: sell `marketingSite` as a paid add-on on Agency without full Enterprise.

### Buyer promise

> Same CMS. More pages, SEO structure, and conversion blocks—configured in the panel, published like today.

---

## Information architecture (client site)

Default Marketing Site routes (enable/disable per site):

| Route | Purpose |
|---|---|
| `/` | Home composition (hero, trust, services teaser, CTA) |
| `/services` | Services index |
| `/services/:slug` | Service detail (GEO sections) |
| `/case-studies` | Case studies index |
| `/case-studies/:slug` | Case detail |
| `/blog` | Blog index |
| `/blog/:slug` | Article |
| `/contact` | Contact + Calendly |
| `/estimate` | Optional calculator (Enterprise) |
| `/resources` | Optional lead magnet |

Nav labels, CTA URLs, and which routes exist remain admin-configurable.

---

## Data model

Keep one **site root** document; add a **routes subcollection** (or embedded map for MVP).

### Option A — Recommended

```text
pages/{pageId}                      # site root (brand, nav, theme, SEO defaults, siteMode)
pages/{pageId}/routes/{routeId}     # one doc per routable page
pages/{pageId}/posts/{postId}       # blog posts (or reuse routes type=blog_post)
```

### Site root fields (additions)

```js
{
  siteMode: 'landing' | 'marketing', // default 'landing'
  marketing: {
    enabledRouteTypes: ['home', 'service', 'case_study', 'blog_post', 'contact', 'estimate', 'resources'],
    primaryCta: { label, href, external },
    secondaryCta: { label, href, external },
    stickyCtaEnabled: true,
    floatingContactEnabled: true,
    calendlyUrl: '',
    newsletterEnabled: false,
    stats: [{ value, label }],
    specializations: [String],
    techStack: [String],
    processSteps: [{ title, description }],
  },
  seo: {
    defaultTitle,
    defaultDescription,
    ogImageUrl,
    canonicalBaseUrl, // https://client.com
  }
}
```

### Route document

```js
{
  id: 'svc-ai-agents',
  type: 'home' | 'services_index' | 'service' | 'case_studies_index' | 'case_study' | 'blog_index' | 'blog_post' | 'contact' | 'estimate' | 'resources' | 'custom',
  slug: 'ai-agents',           // used in URL when applicable
  path: '/services/ai-agents', // derived or stored
  enabled: true,
  sortOrder: 10,
  title: '',
  seo: { title, description, ogImageUrl, noIndex },
  // type-specific payload (English keys only)
  content: {
    // service example
    summary, whoFor, problems[], benefits[], technologies[],
    architecture[], process[], faqs[{question,answer}],
    comparison, roi, metaDescription,
  }
}
```

### Compatibility

- `siteMode: 'landing'` (default): current template behavior, ignore routes.
- Existing pages keep working with zero migration.
- `normalizePageData()` gains `normalizeMarketingSite()`; legacy Spanish keys never introduced.

---

## Admin UX (keep 3-panel flexibility)

### Left panel (Enterprise + marketingSite)

When `siteMode === 'marketing'`:

1. Site root (Brand, Nav, Theme, Global SEO, CTAs)
2. **Routes** tree grouped by type
3. Blog posts list
4. (Optional) Case studies list

Starter/Pro/Agency users never see the tree—only the current page list.

### Center panel

Reuse current controlled `formData` pattern:

- Selecting a route loads that route into `formData` (or `formData.route`).
- Editors per type: ServiceFieldsEditor, CaseStudyFieldsEditor, BlogPostFieldsEditor, HomeMarketingFieldsEditor, SeoFieldsEditor, ConversionFieldsEditor.
- Language switching stays as today (shared media; translated copy fields).

### Right panel (mirror)

- `LandingMirror` evolves into `SiteMirror` that accepts `{ site, route, previewPath }`.
- Keystrokes update local state only.
- Device frames unchanged (desktop / mobile).
- **Still no iframe polling of Firestore.**

### Publish

- **Guardar y Publicar** writes site root + dirty route docs in one batch.
- Preview never writes.

### Upgrade wall

If account lacks `marketingSite`:

- show locked “Marketing Site” card with CTA to Enterprise sales;
- `siteMode` cannot be set to `marketing` from the client UI.

---

## Public renderer

### Decision

Extend **`landing-template`** (not per-client forks of `leftsidedev-site`):

1. Resolve `pageId` as today (domain / query / env).
2. Load site root once.
3. If `siteMode !== 'marketing'` → current `LandingPage`.
4. If marketing → React Router routes + fetch route/post docs (cache in memory).

### Rendering strategy

| Concern | Approach |
|---|---|
| Design | Shared marketing UI kit in `packages/landing-ui` (dark/premium skin configurable via `sectionThemes` / tokens) |
| SEO | Per-route meta + JSON-LD (Organization, Service, FAQ, Article, Breadcrumb) |
| sitemap/robots | Generated at publish time (Function) or static hosting rewrite + Cloud Function |
| Performance | Code-split route types; lazy images; one initial `getDoc` for root + targeted route fetch |

### Showcase relationship

- `leftsidedev-site/` stays until LeftSideDev itself is migrated to `siteMode: 'marketing'` on `pages/leftsidedev`.
- Then apex domain can point to template hosting with that pageId—one engine for showcase + clients.

---

## Billing & access control

### `landing-core` / Functions

1. Add `marketingSite` to `BILLING_PLANS` features (true only on `enterprise` initially).
2. `planHasFeature(planId, 'marketingSite')` gates admin UI and publish validation.
3. Cloud Function `publishPage` / existing save path rejects `siteMode: 'marketing'` without entitlement.
4. Firestore rules: routes subcollection writable only if account plan allows (or rely on Admin SDK publish later; at minimum enforce in Functions).

### Sales motion

- Enterprise remains custom pricing.
- Checklist for success: discovery call → enable plan → seed marketing skeleton → client configures in admin.

---

## Phased delivery

### Phase 0 — Product definition (docs / design)

- Finalize route types and empty templates.
- Define Enterprise sales one-pager + admin screenshots.
- Confirm LeftSideDev becomes client #0 of the model.

**Exit:** approved IA + field list.

### Phase 1 — Data model + entitlements (foundation)

- `siteMode`, `marketing`, `seo` on page model.
- `marketingSite` feature flag on plans.
- Normalize + EMPTY defaults.
- Admin: read-only badge “Landing vs Marketing” (no full editor yet).

**Exit:** feature flag works; no behavior change for existing tenants.

### Phase 2 — Admin route editor MVP

- Left tree: Home + Services + Contact only.
- Center editors for those types.
- Mirror preview for selected route (local state).
- Batch publish site root + routes.

**Exit:** Enterprise account can create `/`, `/services/:slug`, `/contact` without code.

### Phase 3 — Template marketing router

- `landing-template` branches on `siteMode`.
- Renders marketing shell + route content.
- SEO head + FAQ/Service schema for service routes.
- Domain still resolves via `customDomain`.

**Exit:** one Enterprise pilot live on their domain.

### Phase 4 — Case studies, blog, conversion

- Case study + blog editors (reuse/extend existing blog model where possible).
- Sticky CTA, floating contact, Calendly field, estimate/resources toggles.
- Newsletter/lead magnet as optional embeds or first-class blocks.

**Exit:** feature parity with showcase site capabilities (~80%).

### Phase 5 — SEO automation + migrate showcase

- On publish: generate `sitemap.xml` / RSS artifacts (Hosting + Function or Storage public files).
- Migrate `leftsidedev-site` content into `pages/leftsidedev` marketing mode.
- Point `leftsidedev.site` at template; deprecate static `leftsidedev-site` deploy (or keep as design sandbox only).

**Exit:** one engine; showcase edited from admin.

### Phase 6 — Hardening

- Lighthouse budgets, a11y pass, entitlement tests.
- Agency add-on option (optional).
- Docs for onboarding Enterprise clients.

---

## Non-goals (for this initiative)

- Letting Starter/Pro invent arbitrary multi-route sites.
- Requiring clients to deploy their own Vite marketing repo.
- Breaking mirror preview cost rules.
- Spanish field names in new collections.
- Replacing vertical psychologist landings—those stay `siteMode: 'landing'`.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Template bundle grows too large | Lazy route modules; landing mode tree-shaken where possible |
| Admin complexity overwhelms users | Progressive disclosure; seed wizard “Create Marketing Site” |
| SEO weaker than static `leftsidedev-site` | Publish-time prerender or SSR later; start with solid meta + sitemap |
| Entitlement bypass | Enforce in Functions + rules, not only UI |
| Dual systems confusion during migration | Clear docs: showcase static → CMS marketing mode |

---

## Success metrics

- Enterprise pilot publishes a multi-page site **only from admin**.
- Time-to-first-marketing-site &lt; 1 day after plan activation (with seed).
- Mirror preview remains 0 writes/keystroke.
- Existing landing tenants unaffected (regression suite / smoke on `siteMode: 'landing'`).
- LeftSideDev corporate site editable via CMS by end of Phase 5.

---

## Suggested first implementation slice (when coding starts)

1. `marketingSite` flag on Enterprise in `billingPlans.js`.
2. `siteMode` + empty `marketing` object in `pageModel.js` (both packages synced).
3. Admin toggle + upgrade wall.
4. Subcollection `routes` with `home` + `service` types only.
5. Template router stub behind `siteMode === 'marketing'`.

Everything else builds on that vertical slice.

---

## Implementation status (shipped MVP)

| Item | Status |
|---|---|
| `marketingSite` entitlement on Enterprise | Done |
| `siteMode` / `marketing` / `seo` in `pageModel` | Done |
| `marketingSite.js` route helpers + skeleton | Done |
| `pages/{pageId}/routes/{routeId}` rules | Done |
| Admin load/save routes batch | Done |
| Admin Marketing Site + Routes editors | Done |
| Mirror preview via `MarketingSite` | Done |
| Template path-based marketing renderer | Done (home, services, contact) |
| Case studies / blog / estimate / resources editors + views | Done (Phase 4) |
| Sticky CTA / floating contact / Calendly / newsletter teaser | Done (Phase 4) |
| Service FAQ + Article JSON-LD in template | Done |
| Publish-time sitemap generation | Not yet (Phase 5) |
| Migrate LeftSideDev showcase into CMS marketing mode | Not yet (Phase 5) |
| Functions hard entitlement reject | Soft client gate only for now |

---

## Relationship to current work

| Asset | Role in this plan |
|---|---|
| `leftsidedev-site/` | Design/UX reference + interim corporate deploy |
| `docs/leftsidedev-optimization-plan.md` | Marketing quality bar (SEO/GEO/CRO) |
| `landing-admin` / `landing-template` | Permanent product surface for client marketing sites |
| Enterprise plan | Commercial gate |

---

## Open decisions (resolve in Phase 0)

1. Embedded routes on the page doc vs subcollection? → **Prefer subcollection** for scale.
2. Blog: extend existing `blog` array vs `posts` subcollection? → **Subcollection for marketing mode**; keep array for classic landings.
3. Visual theme: force dark premium skin vs fully themeable? → **Themeable tokens with a “Studio” preset**.
4. Add-on for Agency or Enterprise-only at launch? → **Enterprise-only for v1**.
