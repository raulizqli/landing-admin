#!/usr/bin/env node
/**
 * Create (or reuse) TapSite Stripe Products + recurring Prices for Starter / Pro / Agency.
 * Monthly + yearly (20% off 12 months) in USD and MXN.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_... node functions/scripts/ensure-stripe-catalog.mjs
 *   # or load from file:
 *   node functions/scripts/ensure-stripe-catalog.mjs --env functions/.env.production
 *
 * Writes price IDs to stdout as env lines you can paste into functions/.env / .env.production.
 * Does not print the secret key.
 *
 * Idempotent: looks up products by metadata.tapsite_plan + existing prices by
 * metadata.tapsite_plan + metadata.tapsite_currency + recurring interval.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import Stripe from 'stripe';

// Keep in sync with packages/landing-core/src/billingPlans.js (+ MXN Mercado Pago amounts).
const ANNUAL_DISCOUNT = 0.2;
const CATALOG = [
  {
    planId: 'starter',
    name: 'TapSite Starter',
    description: '1 page, basic sections, AI Assist Lite.',
    usd: 1000,
    mxn: 18900,
  },
  {
    planId: 'pro',
    name: 'TapSite Pro',
    description: 'Blog, gallery, embeds, hosting deploy, AI Assist.',
    usd: 2500,
    mxn: 46900,
  },
  {
    planId: 'agency',
    name: 'TapSite Agency',
    description: 'Up to 5 pages, external Firebase, priority support.',
    usd: 7500,
    mxn: 139900,
  },
];

function yearlyUnitAmount(monthlyCents) {
  const monthlyMajor = monthlyCents / 100;
  return Math.round(monthlyMajor * 12 * (1 - ANNUAL_DISCOUNT)) * 100;
}

function loadEnvFile(path) {
  if (!path || !existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return out;
}

function parseArgs(argv) {
  let envPath = '';
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--env' && argv[i + 1]) {
      envPath = resolve(argv[i + 1]);
      i += 1;
    }
  }
  return { envPath };
}

async function findProduct(stripe, planId) {
  const listed = await stripe.products.search({
    query: `metadata['tapsite_plan']:'${planId}' AND active:'true'`,
    limit: 1,
  });
  return listed.data[0] || null;
}

async function listPlanPrices(stripe, productId, planId, currency, interval) {
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    type: 'recurring',
    limit: 100,
  });
  return prices.data.filter((price) => (
    price.currency === currency
    && price.recurring?.interval === interval
    && price.metadata?.tapsite_plan === planId
    && price.metadata?.tapsite_currency === currency
  ));
}

async function ensurePrice(stripe, productId, plan, currency, unitAmount, interval) {
  const matches = await listPlanPrices(stripe, productId, plan.planId, currency, interval);
  const exact = matches.find((price) => price.unit_amount === unitAmount);
  if (exact) return exact;

  for (const outdated of matches) {
    try {
      await stripe.prices.update(outdated.id, { active: false });
      console.error(`  archived old ${currency} ${interval} price ${outdated.id} (${outdated.unit_amount})`);
    } catch (error) {
      console.error(`  could not archive ${outdated.id}:`, error.message || error);
    }
  }

  return stripe.prices.create({
    product: productId,
    currency,
    unit_amount: unitAmount,
    recurring: { interval },
    nickname: `${plan.planId}_${currency}_${interval === 'year' ? 'yearly' : 'monthly'}`,
    metadata: {
      tapsite_plan: plan.planId,
      tapsite_currency: currency,
      tapsite_interval: interval,
    },
  });
}

async function main() {
  const { envPath } = parseArgs(process.argv.slice(2));
  const fileEnv = loadEnvFile(envPath);
  const secretKey = String(
    process.env.STRIPE_SECRET_KEY || fileEnv.STRIPE_SECRET_KEY || '',
  ).trim();

  if (!secretKey) {
    console.error('Missing STRIPE_SECRET_KEY (env or --env file).');
    process.exit(1);
  }

  const mode = secretKey.startsWith('sk_live_')
    ? 'live'
    : secretKey.startsWith('sk_test_')
      ? 'test'
      : 'unknown';

  if (mode === 'unknown') {
    console.error('STRIPE_SECRET_KEY does not look like sk_live_ / sk_test_.');
    process.exit(1);
  }

  console.error(`Stripe mode: ${mode}`);
  const stripe = new Stripe(secretKey);
  const envLines = [];

  for (const plan of CATALOG) {
    let product = await findProduct(stripe, plan.planId);
    if (!product) {
      product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { tapsite_plan: plan.planId },
      });
      console.error(`created product ${plan.planId}: ${product.id}`);
    } else {
      console.error(`reuse product ${plan.planId}: ${product.id}`);
    }

    const usd = await ensurePrice(stripe, product.id, plan, 'usd', plan.usd, 'month');
    const mxn = await ensurePrice(stripe, product.id, plan, 'mxn', plan.mxn, 'month');
    const usdYear = await ensurePrice(
      stripe,
      product.id,
      plan,
      'usd',
      yearlyUnitAmount(plan.usd),
      'year',
    );
    const mxnYear = await ensurePrice(
      stripe,
      product.id,
      plan,
      'mxn',
      yearlyUnitAmount(plan.mxn),
      'year',
    );
    console.error(`  usd=${usd.id}  mxn=${mxn.id}  usd_yearly=${usdYear.id}  mxn_yearly=${mxnYear.id}`);

    const planEnv = plan.planId.toUpperCase();
    envLines.push(`STRIPE_PRICE_${planEnv}_USD=${usd.id}`);
    envLines.push(`STRIPE_PRICE_${planEnv}_MXN=${mxn.id}`);
    envLines.push(`STRIPE_PRICE_${planEnv}_USD_YEARLY=${usdYear.id}`);
    envLines.push(`STRIPE_PRICE_${planEnv}_MXN_YEARLY=${mxnYear.id}`);
    envLines.push(`STRIPE_PRICE_${planEnv}=${usd.id}`);
  }

  console.log('');
  console.log('# Paste into functions/.env.production (Prod) or functions/.env.staging (Stage)');
  console.log(envLines.join('\n'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
