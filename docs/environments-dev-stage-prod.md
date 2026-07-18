# Plan: environments Dev / Stage / Prod

## Goal

Run the landings ecosystem (admin + template + Functions + Firestore/Storage) in **three isolated environments** so you can:

- develop and break things safely (**Dev**);
- validate releases with production-like config (**Stage**);
- serve real clients (**Prod**).

Principle: **one Firebase project per environment** (not shared Firestore). Same git repo; different project IDs, hosting sites, secrets, and domains.

---

## Recommended topology

```text
                    ┌─────────────────┐
   feature branch → │ Dev             │  emulators + optional cloud project
                    └────────┬────────┘
                             │ PR / merge to main (or release branch)
                             ▼
                    ┌─────────────────┐
                    │ Stage           │  full cloud stack, test billing, seed data
                    └────────┬────────┘
                             │ manual promote / tagged release
                             ▼
                    ┌─────────────────┐
                    │ Prod            │  real clients, live billing, real domains
                    └─────────────────┘
```

| Env | Firebase project (example) | Admin URL | Template URL | Purpose |
|---|---|---|---|---|
| **Dev** | `landings-dev` | `admin-dev.…` or localhost | `template-dev.…` / `:5174` | Daily coding; emulators preferred |
| **Stage** | `landings-stage` | `admin.stage.leftsidedev.site` | `sites.stage.leftsidedev.site` | QA, demos, Stripe **test** mode |
| **Prod** | `landings-prod` (current hub) | `admin.…` / current hosting | client domains + apex | Live tenants |

Rename IDs to match your Firebase naming; keep the **three-project** split.

---

## What is isolated per environment

| Resource | Dev | Stage | Prod |
|---|---|---|---|
| Firestore `pages`, `users`, `billingAccounts` | Own DB | Own DB | Own DB |
| Auth users | Dev accounts only | QA accounts | Real CMS users |
| Storage images | Dev bucket | Stage bucket | Prod bucket |
| Cloud Functions | Emulator or `landings-dev` | `landings-stage` | `landings-prod` |
| Hosting targets `admin` / `template` | Optional cloud sites | Always | Always |
| Stripe / Mercado Pago | Test keys or off | **Test** keys | **Live** keys |
| Google Ads / publicity | Off or test slots | Off | Prod slots |
| AI (`OPENAI_*`, `GEMINI_*`, Ollama) | Mock / local Ollama | Shared Lite keys (low quota) | Prod keys + hub Ollama |
| Client custom domains | Rarely | Optional `*.stage…` | Real domains only |

Never point Stage/Prod admin at another environment’s Firebase web config.

---

## Firebase project setup (once per env)

For each of `landings-dev`, `landings-stage`, `landings-prod`:

1. Create the Firebase project (Blaze if you need Functions).
2. Enable **Auth** (Email/Password), **Firestore**, **Storage**, **Functions**, **Hosting**.
3. Register **two** web apps (or one shared) and copy `VITE_FIREBASE_*`.
4. Create Hosting sites, e.g. `landings-{env}-admin`, `landings-{env}-template`.
5. Apply targets:

```bash
firebase use landings-stage
firebase target:apply hosting admin landings-stage-admin
firebase target:apply hosting template landings-stage-template
```

6. Deploy rules/indexes/functions/hosting to that project only.

### `.firebaserc` (aliases)

```json
{
  "projects": {
    "default": "landings-dev",
    "dev": "landings-dev",
    "stage": "landings-stage",
    "prod": "landings-prod"
  },
  "targets": {
    "landings-dev": {
      "hosting": {
        "admin": ["landings-dev-admin"],
        "template": ["landings-dev-template"]
      }
    },
    "landings-stage": {
      "hosting": {
        "admin": ["landings-stage-admin"],
        "template": ["landings-stage-template"]
      }
    },
    "landings-prod": {
      "hosting": {
        "admin": ["landings-prod-admin"],
        "template": ["landings-prod-template"]
      }
    }
  }
}
```

Use:

```bash
firebase use stage
npm run deploy:rules
npm run deploy:functions
npm run deploy:hosting
```

---

## Env files (Vite + Functions)

Do **not** commit real secrets. Pattern:

```text
landing-admin/.env.development      → local Dev (gitignored)
landing-admin/.env.staging.example  → committed template
landing-admin/.env.production.example

landing-template/.env.development
landing-template/.env.staging.example
landing-template/.env.production.example

functions/.env                      → loaded for the project you deploy (gitignored)
# Prefer Firebase params / Secret Manager per project in Prod
```

### Admin (`VITE_*`) checklist per env

| Variable | Dev | Stage | Prod |
|---|---|---|---|
| `VITE_FIREBASE_*` | Dev project | Stage project | Prod project |
| `VITE_TEMPLATE_PREVIEW_URL` | `http://localhost:5174` | Stage template URL | Prod template URL (if used) |
| `VITE_MARKETING_URL` | Local showcase or Stage marketing | Stage marketing | Prod marketing |
| `VITE_ADMIN_ORIGIN` | `http://localhost:5173` | Stage admin origin | Prod admin origin |
| `VITE_BOOTSTRAP_ROOT_EMAIL` | Your email | QA root | Ops root only |
| `VITE_RECAPTCHA_SITE_KEY` | Optional / debug | Stage App Check | Prod App Check |
| `VITE_APP_CHECK_DEBUG_TOKEN` | Yes | No | No |
| `VITE_FUNCTIONS_EMULATOR_HOST` | `127.0.0.1:5001` when emulating | empty | empty |
| `VITE_BILLING_SALES_EMAIL` | noop | QA inbox | Real sales |

### Template

| Variable | Dev | Stage | Prod |
|---|---|---|---|
| `VITE_FIREBASE_*` | Dev hub | Stage hub | Prod hub |
| `VITE_PAGINA_ID` | Optional seed page | Optional | Usually empty (domain routing) |
| `VITE_ADMIN_PUBLIC_URL` | Local admin | Stage admin | Prod admin |
| `VITE_GOOGLE_ADS_*` | Off | Off | Prod (unpaid publicity) |

### Functions (per project secrets)

| Secret | Dev | Stage | Prod |
|---|---|---|---|
| `ADMIN_PUBLIC_URL` | Local or Dev admin URL | Stage admin URL | Prod admin URL |
| `STRIPE_SECRET_KEY` / prices / webhook | test or unset | **test** | **live** |
| `MERCADOPAGO_ACCESS_TOKEN` | TEST- | TEST- | APP_USR- live |
| `AI_LITE_PROVIDER` / `OLLAMA_BASE_URL` | local Ollama / mock | Stage Ollama or Gemini free | Hub Ollama + fallbacks |
| `OPENAI_API_KEY` / `GEMINI_API_KEY` | optional | low-quota | production quotas |
| Deploy hooks / GitHub token | optional | Stage hooks | Prod hooks |

Stripe webhooks: **one endpoint per env**  
`https://us-central1-<project>.cloudfunctions.net/stripeBillingWebhook`

---

## Runtime behavior by environment

### Dev

- Prefer **Firebase Emulators** (Auth, Firestore, Functions, Storage) for CMS work.
- Vite: `landing-admin` `:5173`, `landing-template` `:5174`, optional `leftsidedev-site` `:5175`.
- AI: **Local Ollama** or Functions **mock** (no paid tokens).
- Billing: skip or Stripe test; root bypass for UI work.
- Seed: small fixtures (`leftsidedev`, one psychologist page).

### Stage

- Full cloud stack mirroring Prod topology.
- Stripe/MP **test mode** only; never live prices.
- Seed anonymized / fake clients; no real patient data.
- Unpaid publicity: keep ads **off** (or non-revenue test slots).
- QA checklist before promote: login, save/publish, mirror, marketing routes, sitemap functions, AI Lite + Pro gate, billing checkout test card.
- Optional password protection / allowlist on admin Hosting.

### Prod

- Live billing, real domains, App Check enforced.
- No debug tokens, no emulator hosts.
- Deploy only from tagged releases or `main` after Stage sign-off.
- Backups: enable Firestore scheduled exports.
- Separate monitoring (Functions errors, Hosting, Stripe dashboard).

---

## Git / CI promotion flow

```text
feature/*  →  PR  →  main
                 │
                 ├─ CI: lint, test:core, build admin+template+functions
                 ├─ auto-deploy → Stage (on merge to main)
                 └─ manual workflow “Promote to Prod” (approval + tag vX.Y.Z)
```

Suggested GitHub Environments: `stage`, `prod` (required reviewers on prod).

Example jobs:

1. **CI** — `npm run test:core`, `npm run build`, `functions` `tsc`.
2. **Deploy Stage** — `firebase use stage` + rules + functions + hosting; inject Stage secrets from GitHub Environment.
3. **Deploy Prod** — same with `firebase use prod` after approval.

Never deploy Prod from a dirty feature branch.

---

## Data rules

| Action | Allowed? |
|---|---|
| Copy Prod Firestore → Stage (anonymized) | Yes, for QA snapshots |
| Copy Stage → Prod | **No** (except controlled seeds) |
| Shared Auth between envs | **No** |
| Client `customDomain` in Stage | Only `*.stage…` or test hosts |
| Prod page IDs reused in Stage | OK if content is fake |

Seed scripts (`functions/scripts/seed-*.mjs`) must take `GOOGLE_CLOUD_PROJECT` / ADC for the target env explicitly.

---

## Domains (suggestion)

| Env | Admin | Public template |
|---|---|---|
| Dev | localhost / `admin-dev.web.app` | localhost / `template-dev.web.app` |
| Stage | `admin.stage.yourdomain.com` | `preview.stage.yourdomain.com` (+ optional client-stage domains) |
| Prod | `admin.yourdomain.com` | Client apex domains → Prod template hosting |

Update `ADMIN_PUBLIC_URL` and Stripe redirect URLs when domains change.

---

## AI & billing specifics

**AI**

- Dev: local Ollama / mock.  
- Stage: hub Ollama or Gemini free; confirm Lite vs Pro gates.  
- Prod: hub Ollama + paid OpenAI/Gemini for Pro+; BYOK allowed Agency+.

**Billing**

- Stage webhooks + price IDs must be Stripe **test** mode.  
- Prod webhooks + price IDs **live**.  
- Manual Enterprise activation: root-only; document who has root per env.

**Unpaid publicity**

- Prod only for real AdSense.  
- Stage/Dev: `siteAccess` can still be tested with `forceStage` ops toggles without real ads.

---

## npm scripts to add (implementation follow-up)

```json
{
  "deploy:stage": "firebase use stage && npm run deploy:rules && npm run deploy:functions && npm run deploy:hosting",
  "deploy:prod": "firebase use prod && npm run deploy:rules && npm run deploy:functions && npm run deploy:hosting",
  "use:dev": "firebase use dev",
  "use:stage": "firebase use stage",
  "use:prod": "firebase use prod"
}
```

Optional: `scripts/check-env.mjs` that fails CI if Prod build contains `VITE_APP_CHECK_DEBUG_TOKEN` or Stripe `sk_test_` in Functions secrets (heuristic).

---

## Rollout phases

### Phase A — Foundations (no client impact)

1. Create `landings-dev` + `landings-stage` projects (keep current hub as Prod).  
2. Commit `.firebaserc` aliases + `.env.*.example` for staging.  
3. Document secrets checklist in this file / password manager.  
4. Wire CI build + Stage auto-deploy.

### Phase B — Stage parity

1. Deploy rules, functions, admin, template to Stage.  
2. Seed QA pages + root user.  
3. Connect Stripe test webhooks.  
4. Run smoke checklist (auth, publish, marketing, AI, billing test card).

### Phase C — Prod hygiene

1. Rename aliases so `prod` = current production project.  
2. Move Functions secrets to Secret Manager.  
3. Require GitHub Environment approval for Prod.  
4. Enable Firestore backups + alerting.

---

## Smoke checklist (Stage → Prod gate)

- [ ] Admin login / role matrix  
- [ ] Create page, edit, mirror updates without Firestore spam  
- [ ] Guardar y Publicar  
- [ ] Template resolves by `customDomain` / `pageId`  
- [ ] Marketing mode routes + sitemap/rss/robots  
- [ ] AI Lite generate + Apply; Pro action gated  
- [ ] Billing checkout (test card) updates plan  
- [ ] Unpaid forceStage ads/offline (ops)  
- [ ] No debug App Check / test Stripe keys on Prod  

---

## Non-goals

- Separate git repos per environment.  
- Sharing one Firestore across Stage and Prod.  
- Running live Stripe against Stage.  
- Pointing real client domains at Stage Hosting.

---

## Relationship to current repo

| Today | After this plan |
|---|---|
| Mostly one Firebase hub (see `.firebaserc.example`) | Explicit `dev` / `stage` / `prod` aliases |
| Local `.env` + production examples | + staging examples and CI secrets |
| Manual deploys | Stage on merge; Prod on approval |

Implementation of scripts/CI can follow this document without changing the product model (`pageModel`, entitlements, etc.).
