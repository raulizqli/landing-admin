# Testing

This monorepo uses two runners side by side:

- **Vitest** (`.test.js`) for unit, mocked integration, and smoke tests in `landing-core`, `landing-admin`, and `landing-template`
- **Node built-in test** (`.test.mjs`) for additional `landing-core` suites introduced with the enterprise marketing site (billing add-ons, site access, AI assist)

There is no browser E2E suite yet (Playwright/Cypress) and Firebase Auth/Firestore emulators are not wired for tests.

## Layers

| Layer | Where | What |
|---|---|---|
| Unit (Vitest) | `packages/landing-core/src/*.test.js` | Page model, translations, billing basics, phone/CTA, hostname, external Firebase split |
| Unit (node:test) | `packages/landing-core/src/*.test.mjs` | Marketing-site entitlements, site access, AI assist helpers |
| Integration | `landing-admin` / `landing-template` utils tests | Save/load and routing with mocked Firestore I/O |
| Smoke | `*/src/smoke.test.js` | Import critical modules and assert exports / happy-path helpers |

## Run locally

From the monorepo root:

```bash
npm test
```

`landing-core` runs Vitest then `node --test`:

```bash
npm test -w @raulizqli/landing-core
npm run test:vitest -w @raulizqli/landing-core
npm run test:node -w @raulizqli/landing-core
npm run test:core   # same as core package test script
```

Admin / template:

```bash
npm test --prefix landing-admin
npm test --prefix landing-template
```

Watch mode (Vitest, from a package directory):

```bash
npx vitest
```

## CI

Both pipelines stay in place:

1. **`.github/workflows/ci.yml`** — `npm run test:core`, Functions build, env checks, admin/template builds on PRs and `master`
2. **Firebase Hosting PR workflow** — dedicated `test` job runs full `npm test` (core + admin + template) and gates preview deploys

## Out of scope (for now)

- Browser E2E
- Live Stripe / Mercado Pago checkout
- Cloud Functions test suite
- Auth / Firestore emulator integration
