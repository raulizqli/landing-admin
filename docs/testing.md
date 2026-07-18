# Testing

This monorepo uses **Vitest** for unit, mocked integration, and smoke tests. There is no browser E2E suite yet (Playwright/Cypress) and Firebase Auth/Firestore emulators are not wired for tests.

## Layers

| Layer | Where | What |
|---|---|---|
| Unit | `packages/landing-core/src/*.test.js` | Pure logic: page model, translations, billing, phone/CTA, hostname, external Firebase split |
| Integration | `landing-admin` / `landing-template` utils tests | Save/load and routing with mocked Firestore I/O |
| Smoke | `*/src/smoke.test.js` | Import critical modules and assert exports / happy-path helpers |

## Run locally

From the monorepo root:

```bash
npm test
```

Per package:

```bash
npm test -w @raulizqli/landing-core
npm test --prefix landing-admin
npm test --prefix landing-template
```

Watch mode (from a package directory):

```bash
npx vitest
```

## CI

Pull requests run a dedicated `test` job (`npm ci` → `npm test`) before Firebase Hosting preview builds. Preview deploy jobs depend on that job succeeding.

## Out of scope (for now)

- Browser E2E
- Live Stripe / Mercado Pago checkout
- Cloud Functions test suite
- Auth / Firestore emulator integration
