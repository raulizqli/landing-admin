# Proposal: AI integration (free-model lite + paid Assist)

## Goal

Add **AI-assisted content tools inside the admin CMS**, with two tracks:

1. **Free tier → free models** — Starter and unpaid/free-tier CMS accounts get **AI Lite** routed to free-tier providers (Gemini / Groq), tight monthly caps.  
2. **Paid Pro+ → paid models** — better quality, higher quotas, BYOK on Agency/Enterprise.

Without breaking:

- local mirror preview (zero Firestore writes per keystroke);
- English data model + `normalizePageData()`;
- plan entitlements + Cloud Functions hard gates;
- unpaid publicity / offline site policy (public site rules stay separate from CMS AI).

---

## Product packaging (recommended)

| Tier | AI access | Model path | Monthly budget (suggested) | Capabilities |
|---|---|---|---|---|
| **Free tier** (Starter **or** unpaid/lapsed CMS) | **AI Lite** | **Free models** — Gemini Flash / Groq (platform free-tier keys) | ~15 gens / mo | Bio/hero **rewrite** only (no blog batch, no Marketing Site) |
| **Pro** (active) | **AI Assist** | Paid mini (OpenAI / Gemini paid) | ~50 gens / mo | Rewrite, services, blog draft, SEO meta |
| **Agency** (active) | **AI Studio** | Paid mini **or BYOK** | ~200 gens / mo | + batch, tone presets, own API token |
| **Enterprise** (active) | **AI Studio +** | Paid / BYOK | Custom | + Marketing Site generators |

**Rule of thumb:** free users never burn paid OpenAI tokens; paid users never depend on flaky free quotas for core UX.

### Entitlement flags

```js
features: {
  aiAssistLite: true,  // starter + free-tier CMS (free models)
  aiAssist: true,      // pro+ paid models
}
```

Hard gate in `runAiAssist`:

- Resolve lane: `lite` vs `full` from plan + billing status.
- **Lite:** allow even when `past_due` / `canceled` / Starter; use free-model provider; enforce lite quota + lite action allow-list.
- **Full:** require `active|trialing` + Pro+; use paid provider or BYOK.
- Root bypass as today.
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

### Which AI APIs — multi-provider design

Architecture uses a **provider adapter** inside Cloud Functions. Adding another API = new adapter + UI option, not a rewrite.

```text
runAiAssist
  → resolve credentials (platform | BYOK)
  → AiProvider.chatJson({ system, user, schema })
      ├── openai      (OpenAI, Azure OpenAI, Groq, Mistral, DeepSeek, Together… via baseUrl)
      ├── gemini      (Google AI Studio / Vertex)
      └── anthropic   (Claude)
  → validate JSON against field schema
```

**Platform default (included quota on Pro+):**

| Setting | Default | Why |
|---|---|---|
| Provider | **OpenAI** | Structured JSON + mature SDK |
| Model | **`gpt-4.1-mini`** (or current mini tier) | Cheap/fast for short landing copy |
| Env fallback | **Gemini Flash** | Optional LATAM cost/latency switch |

**Supported providers (roadmap)**

| Provider | v1 | BYOK | Notes |
|---|---|---|---|
| **OpenAI** | ✅ default | ✅ | `gpt-4.1-mini`, `gpt-4o-mini`, etc. |
| **Google Gemini** | ✅ adapter | ✅ | `gemini-2.0-flash` / 1.5 flash |
| **Anthropic Claude** | ✅ adapter | ✅ | `claude-sonnet` / Haiku for cost |
| **Azure OpenAI** | Phase 2 | ✅ | Same OpenAI adapter + custom `baseUrl` + deployment name |
| **OpenAI-compatible** | Phase 2 | ✅ | One adapter covers **Groq, Mistral, DeepSeek, Together, Fireworks, OpenRouter**, local gateways |
| **Grok (xAI)** | Later | ✅ | Usually OpenAI-compatible endpoint |
| **Perplexity** | Out of scope v1 | — | Search-oriented; weak fit for structured CMS fills |
| **Custom HTTP** | Enterprise | ✅ | Rare; only if client has a private LLM proxy |

OpenAI-compatible BYOK fields:

```js
{
  provider: 'openai_compatible',
  baseUrl: 'https://api.groq.com/openai/v1',  // or mistral/deepseek/together…
  apiKeyEncrypted: '…',
  model: 'llama-3.3-70b-versatile'
}
```

All calls go through Cloud Functions — the browser never sees platform or BYOK secrets.

### Free / low-cost API options

There is no reliable **unlimited free** API for a multi-tenant SaaS. What exists are **free tiers** (quotas, rate limits, ToS that can change):

| Option | Cost | Fit for us | Caveats |
|---|---|---|---|
| **Google Gemini (AI Studio)** | Free tier | Best “free” BYOK / platform trial | Daily RPM/token caps; production should use paid/Vertex |
| **Groq** | Free tier | Great BYOK via `openai_compatible` | Rate limits; model list changes |
| **OpenRouter** | Some free models | BYOK compatible | Free models crowded/slow; quality varies |
| **Mistral / DeepSeek** | Free or cheap tiers | BYOK compatible | Check current ToS for commercial use |
| **Hugging Face Inference** | Limited free | Weak for v1 | Cold starts, less stable JSON |
| **Ollama / local LLM** | Free (self-host) | Enterprise only | Client must host GPU/CPU; not our cloud default |
| **OpenAI / Anthropic** | Paid | Platform default | No meaningful free production tier |

**Recommendation**

1. **Platform default:** paid mini model (OpenAI or Gemini paid) so Pro subscribers get predictable quality.  
2. **“Free for the subscriber” path:** BYOK with **Gemini free tier** or **Groq free tier** (Agency+). They use their own free quota; we don’t pay tokens.  
3. **Optional platform trial:** route Starter’s 5 trial gens through Gemini free/paid with hard caps — not unlimited.  
4. Never depend on a free tier alone for all paid customers (outages, ToS, rate limits).

### Bring your own API key (BYOK) — yes

Paid subscribers (recommended **Agency + Enterprise**; optional Pro add-on) can choose:

1. **Platform AI** — our key + monthly generation quota.  
2. **Your own token** — their OpenAI / Gemini / Anthropic / Azure / OpenAI-compatible key; **soft abuse cap only**, no platform token cost.

Admin UX (Billing → AI settings):

```text
AI provider:  ( ) Platform included   (•) Use my API key
Provider:     [ OpenAI ▾ | Gemini | Anthropic | Azure OpenAI | OpenAI-compatible ]
Base URL:     [ https://api.groq.com/openai/v1 ]   ← compatible / Azure only
API key:      [ •••••••••••••••• ]
Model:        [ gpt-4.1-mini ]
Test connection  ·  Remove key
```

Storage (Functions / Admin SDK only):

```js
// billingAccounts/{accountId}.aiProvider
{
  mode: 'platform' | 'byok',
  provider: 'openai' | 'gemini' | 'anthropic' | 'azure_openai' | 'openai_compatible',
  baseUrl: '',                 // required for azure / compatible
  apiKeyEncrypted: '…',        // Secret Manager or KMS-wrapped
  apiKeyLast4: 'ab12',
  model: 'gpt-4.1-mini',
  updatedAt: '…'
}
```

Rules:

- Key is sent once over HTTPS to `setAiProviderConfig` (account admin / root).
- `runAiAssist` decrypts server-side; responses never echo the key.
- BYOK failure → clear error; offer platform fallback if quota remains.
- Free-tier / unpaid: AI disabled (platform and BYOK).

Platform secrets (default mode only):

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=…
AI_MODEL=gpt-4.1-mini
GEMINI_API_KEY=…
ANTHROPIC_API_KEY=…
```

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

1. **Default platform provider** — OpenAI mini (recommended) vs Gemini Flash for LATAM cost.  
2. **BYOK from which plan?** — Agency+ (recommended) vs Pro add-on.  
3. **Starter trial** — 5 free gens vs hard paywall.  
4. **Overage on platform mode** — hard stop vs metered add-on.  
5. **Public chatbot** — out of scope for v1; revisit as separate entitlement `aiChatWidget`.  
6. **Default language of prompts** — follow page `defaultLanguage` (recommended).

---

## Recommendation

Ship **Phase 0 + Phase 1** as the first paid differentiator after Marketing Site:

- Entitlement on **Pro+**.
- One callable, field-scoped actions, apply-to-`formData` only.
- Quota on the billing account.
- Enterprise route generators as the natural upsell into Marketing Site.

This reuses the existing entitlement, billing health, and admin UX patterns without forking the template for AI.
