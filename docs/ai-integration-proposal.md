# Proposal: AI integration (free-model lite + paid Assist)

## Goal

Add **AI-assisted content tools inside the admin CMS**, with two tracks:

1. **Free / first tiers → cheap AI Lite** — Starter and unpaid/free-tier CMS use **free cloud models (Gemini/Groq)** and/or **Ollama** (no per-token bill).  
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
| **Free tier** (Starter **or** unpaid/lapsed CMS) | **AI Lite** | **Ollama** (preferred) and/or Gemini/Groq free | Soft cap ~30 gens / mo (Ollama can be higher) | Bio/hero **rewrite** only |
| **Pro** (active) | **AI Assist** | Paid mini (OpenAI / Gemini paid); Ollama optional | ~50 gens / mo | Rewrite, services, blog draft, SEO meta |
| **Agency** (active) | **AI Studio** | Paid mini, **BYOK**, or **own Ollama URL** | ~200 gens / mo | + batch, tone presets |
| **Enterprise** (active) | **AI Studio +** | Paid / BYOK / private Ollama | Custom | + Marketing Site generators |

**Rule of thumb:** first tiers prefer **Ollama / free APIs** so we don’t spend paid tokens; Pro+ can still use paid models for quality.

### Entitlement flags

```js
features: {
  aiAssistLite: true,  // starter + free-tier CMS (free models)
  aiAssist: true,      // pro+ paid models
}
```

Hard gate in `runAiAssist`:

- Resolve lane: `lite` vs `full` from plan + billing status.
- **Lite:** allow even when `past_due` / `canceled` / Starter; prefer **Ollama**, else Gemini/Groq free; lite action allow-list.
- **Full:** require `active|trialing` + Pro+; use paid provider, BYOK, or remote Ollama.
- Root bypass as today.
- Cloud API keys never exposed to the browser. **Local Ollama** is the exception: the admin browser may call `127.0.0.1` directly (no secret).

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
      → resolve lane: lite (free model) | full (paid/BYOK)
      → assert quota for that lane
      → provider adapter
      → structured JSON matching field schema
      → log usage to billingAccounts/{id}/aiUsage/{yyyy-mm}
  ← { result, usage, lane }
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
| **Ollama / local LLM** | Free (self-host) | **First-tier Lite (recommended)** | No per-token cost; needs CPU/GPU host |
| **OpenAI / Anthropic** | Paid | Pro+ platform default | No meaningful free production tier |

### Ollama for first tiers (recommended cheap path)

Ollama gives **better control and $0 token spend** for Starter / free-tier CMS. Three ways to wire it:

| Mode | Who runs the model | How the admin CMS calls it | Best for |
|---|---|---|---|
| **A. Hub Ollama** | Our small VPS/GPU | Cloud Function → `OLLAMA_BASE_URL` | Default Lite for all first-tier users (zero client setup) |
| **B. Local Ollama** | Editor’s machine | **Browser → `http://127.0.0.1:11434`** (Lite only) | Power users; fully free; works offline for generation |
| **C. Remote Ollama BYOK** | Client’s VPS | Function → their HTTPS Ollama/OpenAI-compatible URL | Agency / studios with their own box |

Suggested Lite models (Spanish/English copy, modest hardware):

- `llama3.2` / `llama3.1:8b`
- `qwen2.5:7b` (strong multilingual)
- `gemma2:9b` or `mistral:7b`

Admin UX for first tiers:

```text
AI Lite engine:
  (•) Platform Ollama (hub)     ← default, no tokens
  ( ) Cloud free (Gemini/Groq) ← fallback if hub busy
  ( ) Local Ollama on this PC  ← requires Ollama installed + model pulled
```

Notes:

- **Local Ollama cannot be reached from Cloud Functions** (`localhost` is the user’s PC). Mode B is browser-side for Lite rewrite only, with the same prompt templates and JSON validation as the server lane.
- Hub Ollama cost = **server electricity/RAM**, not tokens — usually cheaper at Lite volume than Gemini/OpenAI.
- Still enforce a soft monthly cap (abuse / CPU protection); can be higher than cloud-free Lite.
- If Ollama fails, fall back to Gemini/Groq free — **never** to paid OpenAI on the free tier.

**Recommendation — first tiers**

1. **Default Lite = Hub Ollama** (cheap, no client install).  
2. Optional **Local Ollama** for users who installed it on their PC.  
3. **Gemini/Groq free** as automatic fallback.  
4. **Pro+** keeps paid mini models for quality; they can still use Ollama if they want.

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
- Free-tier / Starter: **AI Lite only** (Ollama-first, free-cloud fallback). BYOK / remote Ollama stays Agency+.
- Offline public site does **not** block CMS AI Lite (editors can still polish copy while the apex is offline).

Platform secrets:

```bash
# Paid lane (Pro+)
AI_PROVIDER=openai
OPENAI_API_KEY=…
AI_MODEL=gpt-4.1-mini

# Free / Lite lane (Starter + unpaid free-tier) — prefer Ollama
AI_LITE_PROVIDER=ollama
OLLAMA_BASE_URL=http://ollama.internal:11434
AI_LITE_MODEL=qwen2.5:7b
AI_LITE_FALLBACK_PROVIDER=gemini
GEMINI_API_KEY=…
GROQ_API_KEY=…
ANTHROPIC_API_KEY=…       # full lane / BYOK optional
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

1. Free-tier / Starter uses ✨ Lite on **Ollama** (or free cloud fallback) → wants blog/SEO quality → upgrade to Pro.  
2. Agency multi-brand → higher quota + BYOK / remote Ollama + presets.  
3. Enterprise Marketing Site → route-aware generators.

Cost control: Ollama for Lite volume; paid mini only on Pro+; cache repeated SEO meta; optional `aiOverage` later.

---

## Implementation phases

### Phase 0 — Foundations (small)

- `aiAssistLite` + `aiAssist` + per-lane monthly caps on plans.
- `useEntitlements().canUseAiAssistLite` / `canUseAiAssist`.
- Callable stub `runAiAssist` with `lane: 'lite' | 'full'` + quota docs.
- Admin `AiAssistButton` on `aboutBio` (Lite allow-list).

**Exit:** free-tier account can run Lite rewrite into `formData`; Pro lane gated separately.

### Phase 1 — Lite (Ollama + free cloud) + Pro pack

- **Lite:** Hub Ollama adapter + Gemini/Groq fallback; optional **Local Ollama** from the admin browser.
- **Full:** paid OpenAI/Gemini — rewrite, hero, services, SEO meta, blog draft.
- Sidebar shows engine (Ollama / Gemini) + Lite vs Pro quota.
- Spanish/English prompts.

**Exit:** free user polishes bio via Ollama (no paid tokens); Pro user gets full assist.

### Phase 2 — Agency scale + BYOK + remote Ollama

- Brand tone preset per page (`aiTone` on page doc).
- Batch “improve empty sections” for one page.
- **BYOK** (OpenAI / Gemini / Anthropic) **and remote Ollama URL** on the billing account.
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

1. **Lite primary engine** — Hub Ollama (recommended) vs Gemini free first.  
2. **Hub Ollama host size** — CPU-only 7B vs small GPU.  
3. **Local Ollama in browser** — ship in v1 Lite vs Phase 1.5.  
4. **Lite monthly cap** — 15 vs 30 (higher OK if Ollama is hub-hosted).  
5. **BYOK / remote Ollama from which plan?** — Agency+ (recommended).  
6. **Public chatbot** — out of scope for v1.  
7. **Default language of prompts** — follow page `defaultLanguage` (recommended).

---

## Recommendation

Ship **Phase 0 + Phase 1** with:

- **First tiers → Ollama-first AI Lite** (hub + optional local), Gemini/Groq free as fallback — **no paid tokens**.  
- **Pro+ → paid models** for quality, plus Agency BYOK / remote Ollama later.  
- One assist UX, apply-to-`formData` only, quotas per lane.

That is the cheaper path to generate prompts for Starter/free-tier without burning cloud tokens.
