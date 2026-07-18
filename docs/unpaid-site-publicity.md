# Unpaid site publicity & offline policy

When a subscription stops being paid, the CMS stays on **free tier**, and the **public site** follows a timed publicity policy.

## Timeline (from `billingAccounts.unpaidSince`)

| Stage | When | Public site |
|---|---|---|
| **grace** | 0–6 months unpaid | Online, no ads |
| **ads** | 6–9 months unpaid | Online + Google Ads / publicity banner (platform revenue) |
| **offline** | 9+ months unpaid **and** ad revenue not confirmed | Offline notice page |

If root marks **`monetization.adsRevenueOk = true`**, the site can stay on the **ads** stage past 9 months (publicity is covering hosting).

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

## Template env

```env
VITE_GOOGLE_ADS_CLIENT=ca-pub-xxxxxxxx
VITE_GOOGLE_ADS_SLOT=##########
VITE_ADMIN_PUBLIC_URL=https://admin.example.com
```

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
