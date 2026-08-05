# Unpaid site publicity & offline policy

When a subscription stops being paid, the CMS stays on **free tier**, and the **public site** follows a timed publicity policy.

## Timeline (from `billingAccounts.unpaidSince`)

| Stage | When | Public site |
|---|---|---|
| **grace** | 0–1 month unpaid | Online, no ads |
| **ads** | 1–6 months unpaid | Online + Google Ads / publicity banner (platform revenue) |
| **offline** | 6+ months unpaid **and** ad revenue not confirmed | Offline notice page |

If root marks **`monetization.adsRevenueOk = true`**, the site can stay on the **ads** stage past 6 months (publicity is covering hosting).

Paid again (`active` / `trialing`) → stage **paid**, ads off, offline cleared.

## Data model

### Billing account

```js
{
  unpaidSince: '2026-01-01T00:00:00.000Z' | null,
  monetization: {
    adsRevenueOk: false,          // ops: ads are earning enough
    forceStage: '' | 'grace' | 'ads' | 'offline',
  },
  siteAccess: { stage, unpaidSince, adsEnabled, offline, updatedAt }
}
```

### Page (denormalized for the public template)

```js
siteAccess: { stage, unpaidSince, adsEnabled, offline, updatedAt }
```

Synced on billing status changes and daily by `syncSiteAccessDaily`.

## QA seed scenarios

```bash
cd functions && node scripts/seed-site-access-scenarios.mjs
```

Creates:

| Page ID | Stage | Preview |
|---|---|---|
| `qa-unpaid-ads` | ads (~45 days unpaid) | `http://localhost:5174/?pageId=qa-unpaid-ads` |
| `qa-unpaid-offline` | offline (~200 days unpaid) | `http://localhost:5174/?pageId=qa-unpaid-offline` |

## Template env (Prod only)

Stage/Dev leave ads empty. Prod uses `landing-template/.env.production` and GitHub Actions secrets:

```env
VITE_GOOGLE_ADS_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
VITE_GOOGLE_ADS_SLOT=##########
VITE_ADMIN_PUBLIC_URL=https://admin.leftsidedev.site
```

Admin CMS (free-tier bar + Save & Publish) uses a **separate** Display slot in `landing-admin/.env.production` (`VITE_GOOGLE_ADS_SLOT`), synced to GitHub as `VITE_GOOGLE_ADS_SLOT_ADMIN`.

1. Create AdSense **display** ad units (responsive). Do **not** use an AMP unit — TapSite pages are React/Vite SPAs (`adsbygoogle`), not AMP HTML (`amp-ad`).
2. Put publisher ID + **landing** slot in `landing-template/.env.production`; put the **admin** slot in `landing-admin/.env.production`.
3. Sync secrets: `./scripts/sync-github-secrets.sh`
4. Redeploy template/admin hosting so the Vite bundles pick up the values.

## Admin / ops

Root → **Billing** → **Ops: unpaid site publicity**:

- Mark ad revenue OK / not OK
- Force ads or offline immediately
- Clear forced stage

## Deploy

```bash
npm run deploy:functions   # setBillingMonetization + syncSiteAccessDaily + billing unpaidSince sync
npm run deploy:template
```
