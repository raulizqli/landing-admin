# Proposal: AI integration for paid subscribers

## Goal

Add **AI-assisted content and SEO tools inside the admin CMS**, available only to **paid, active** subscriptions, without breaking:

- local mirror preview (zero Firestore writes per keystroke);
- English data model + `normalizePageData()`;
- plan entitlements (`accountHasFeature` + Cloud Functions hard gates);
- free-tier / unpaid publicity rules (AI stays locked when not paid).

AI should feel like a **co-pilot for psychologists / studios**, not a separate product.

---

## Product packaging (recommended)

| Plan | AI access | Monthly AI budget (suggested) | Capabilities |
|---|---|---|---|
| **Starter** | None (or 5 trial generations once) | — | Upgrade wall |
| **Pro** | **AI Assist** included | ~50 generations / mo | Section rewrite, bio polish, blog draft, SEO meta |
| **Agency** | **AI Studio** | ~200 generations / mo · multi-page | Everything in Pro + batch per page + tone presets per brand |
| **Enterprise** | **AI Studio +** | Custom / higher limits | Marketing Site routes, case-study drafts, GEO FAQ, optional BYO API key |

Optional later: sell `features.aiAssist` as an **add-on** on Starter (same pattern as `addons.marketingSite`).

### Entitlement flag

```js
features: {
  // existing…
  aiAssist: false, // starter
  aiAssist: true,  // pro+
}
```

Hard gate in Cloud Functions (same pattern as `assertMarketingSiteAccess`):

- Callable `runAiAssist` checks `active|trialing` + `accountHasFeature(..., 'aiAssist')` (or root bypass).
- Never call the model from the browser with a secret key.

---

## Use cases (admin-only)

Prioritize jobs that map 1:1 to existing English fields.

### Phase A — Content assist (highest ROI)

1. **About / bio polish** — improve `aboutTagline`, `aboutBio` (tone: warm, professional, ES/EN).
2. **Hero copy** — suggest `heroSlides[].title` / `text` from name + specialty + vertical.
3. **Services blurbs** — fill `services[].description` from titles.
4. **Blog draft** — outline + body paragraphs into `blogPosts[]` (Pro+) or marketing `blog_post` routes (Enterprise).
5. **Tone rewrite** — “shorter / more formal / more empathetic” on selected field.

### Phase B — SEO / GEO assist

6. **Meta pack** — `seo.defaultTitle`, `seo.defaultDescription`, OG suggestions.
7. **FAQ generator** — for marketing `service` routes (`content.faqs[]`).
8. **Alt text / image captions** — gallery / embeds (optional).

### Phase C — Marketing Site (Enterprise)

9. **Service page skeleton** — whoFor, problems, benefits, process from a short brief.
10. **Case study skeleton** — problem → solution → results structure.
11. **Estimate copy** — supporting text for `/estimate` / `/resources`.

### Explicit non-goals (v1)

- Auto-publish without user review (always **Apply to form** → user hits Guardar y Publicar).
- Chatbot on the public landing (separate product; privacy/consent heavy).
- Training on other tenants’ content.
- Image generation in v1 (cost + brand risk); text-only first.

---

## UX in the admin

Keep the three-pane layout. AI is contextual, not a fourth dashboard.

```text
[Field label]  [ ✨ Mejorar con IA ▾ ]
                 → Shorter
                 → More empathetic
                 → Translate ES↔EN
                 → Generate from brief…
```

Patterns:

- Button next to long text fields + a small **AI panel** drawer (“Brief → Generate → Diff → Apply”).
- **Apply** writes only into local `formData` (mirror updates instantly).
- Show remaining monthly quota in the sidebar near subscription health.
- PlanGate when `!canUseAiAssist`.

Language: prompts respect `defaultLanguage` / `enabledLanguages`; UI labels stay Spanish-capable, model output matches selected language.

---

## Architecture

```text
Admin UI
  → httpsCallable('runAiAssist')
      → assert paid + aiAssist (+ quota)
      → provider (OpenAI / Anthropic / Gemini via env)
      → structured JSON matching field schema
      → log usage to billingAccounts/{id}/aiUsage/{yyyy-mm}
  ← { result, usage }
  → merge into formData (no Firestore write yet)
```

### Suggested callable payload

```js
{
  pageId: 'ana-garcia',
  action: 'rewrite_field' | 'generate_section' | 'seo_meta' | 'blog_draft' | 'service_skeleton',
  language: 'es' | 'en',
  fieldPath: 'aboutBio',          // when applicable
  input: { brief, currentValue, context: { name, specialty, vertical } },
  tone: 'empathetic' | 'formal' | 'concise'
}
```

### Quota model

```js
// billingAccounts/{accountId}/aiUsage/{2026-07}
{
  period: '2026-07',
  generations: 42,
  tokensIn: 12000,
  tokensOut: 8000,
  updatedAt: '…'
}
```

Limits by plan in `billingPlans.js` (e.g. `aiMonthlyGenerations: 50 | 200 | null`).

Soft warn at 80%; hard reject at 100% with upgrade CTA.

### Secrets

Functions only:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=…
AI_MODEL=gpt-4.1-mini   # cost-efficient default
```

Enterprise optional: `externalAi.apiKey` encrypted or “bring your own key” stored on the billing account (Phase C+).

---

## Safety & brand fit

- System prompt locked to **psychology / health / professional services** verticals; refuse clinical diagnosis claims.
- Output must remain editable; show disclaimer: “Revisa antes de publicar.”
- Strip HTML from model output; map into plain fields / allowed structures only.
- Rate-limit per UID + account (abuse).
- No PII from other pages in the prompt context—only the current page brief + fields the editor already sees.
- Log prompts/responses retention: short (e.g. 30 days) or hash-only for Enterprise.

---

## Commercial positioning

Buyer promise:

> Paid plans include an AI co-pilot that drafts and polishes your landing copy in your voice—preview instantly, publish when you approve.

Upsell path:

1. Starter user hits ✨ → upgrade to Pro.  
2. Agency multi-brand → higher quota + presets.  
3. Enterprise Marketing Site → route-aware generators.

Cost control: default small model; cache repeated SEO meta; charge overage later if needed (`aiOverage` add-on).

---

## Implementation phases

### Phase 0 — Foundations (small)

- `features.aiAssist` + `aiMonthlyGenerations` on plans.
- `useEntitlements().canUseAiAssist`.
- Callable stub `runAiAssist` (echo / fake) + quota doc.
- Admin `AiAssistButton` wired to one field (`aboutBio`) with Apply → `formData`.

**Exit:** paid check + quota + local apply works without a real provider.

### Phase 1 — Pro content pack

- Real provider integration.
- Actions: rewrite, hero, services blurb, SEO meta, blog draft.
- Sidebar quota meter.
- Spanish/English prompts.

**Exit:** Pro subscriber can generate and publish polished bio + SEO in &lt;10 minutes.

### Phase 2 — Agency scale + BYOK

- Brand tone preset per page (`aiTone` on page doc).
- Batch “improve empty sections” for one page.
- **Bring-your-own API key** (OpenAI / Gemini / Anthropic) on the billing account.
- Usage export for agency owners.

### Phase 3 — Enterprise Marketing Site

- Service / case-study / FAQ generators into `marketingRoutes`.
- BYOK + optional higher platform quota in contract.

---

## Success metrics

- % of paid accounts with ≥1 AI apply / month.
- Time-to-first-publish for new pages (target ↓).
- Generations → publish rate (not abandoned drafts).
- Gross margin after model cost ≥ target (track tokens / account).
- No increase in accidental Firestore writes from preview.

---

## Open decisions

1. **Provider** — OpenAI vs Gemini (price/latency in MX/LATAM) vs Anthropic.  
2. **Starter trial** — 5 free gens vs hard paywall.  
3. **Overage** — hard stop vs metered add-on.  
4. **Public chatbot** — out of scope for v1; revisit as separate entitlement `aiChatWidget`.  
5. **Default language of prompts** — follow page `defaultLanguage` (recommended).

---

## Recommendation

Ship **Phase 0 + Phase 1** as the first paid differentiator after Marketing Site:

- Entitlement on **Pro+**.
- One callable, field-scoped actions, apply-to-`formData` only.
- Quota on the billing account.
- Enterprise route generators as the natural upsell into Marketing Site.

This reuses the existing entitlement, billing health, and admin UX patterns without forking the template for AI.
