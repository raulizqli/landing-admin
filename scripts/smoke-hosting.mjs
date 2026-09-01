#!/usr/bin/env node
/**
 * HTTP smoke test for a static Hosting site (admin, template, marketing).
 *
 * Usage:
 *   node scripts/smoke-hosting.mjs --url https://admin.toqua.site
 *   node scripts/smoke-hosting.mjs --url https://admin.toqua.site --path /login
 */

import process from 'node:process';

function argValue(flag, fallback = '') {
  const index = process.argv.indexOf(flag);
  if (index === -1) return fallback;
  return process.argv[index + 1] || fallback;
}

const baseUrl = argValue('--url', '').replace(/\/+$/, '');
const extraPath = argValue('--path', '/');
const label = argValue('--label', baseUrl);

if (!baseUrl) {
  console.error('Usage: node scripts/smoke-hosting.mjs --url https://example.com [--path /login]');
  process.exit(1);
}

const targetUrl = new URL(extraPath, `${baseUrl}/`).toString();

async function fetchStatus(url, init = {}) {
  const res = await fetch(url, { redirect: 'follow', ...init });
  return { res, url };
}

async function main() {
  console.log(`[smoke-hosting] ${label} → ${targetUrl}`);

  const { res, url } = await fetchStatus(targetUrl);
  if (!res.ok) {
    throw new Error(`GET ${url} → HTTP ${res.status}`);
  }

  const html = await res.text();
  if (!html.includes('id="root"')) {
    throw new Error('HTML missing #root mount point');
  }

  const scriptMatch = html.match(/<script[^>]+src="(\/assets\/[^"]+\.js)"/);
  if (!scriptMatch) {
    throw new Error('HTML missing main JS bundle reference');
  }

  const assetUrl = new URL(scriptMatch[1], url).toString();
  const { res: assetRes } = await fetchStatus(assetUrl);
  if (!assetRes.ok) {
    throw new Error(`Main bundle ${assetUrl} → HTTP ${assetRes.status}`);
  }

  const cssMatch = html.match(/<link[^>]+href="(\/assets\/[^"]+\.css)"/);
  if (cssMatch) {
    const cssUrl = new URL(cssMatch[1], url).toString();
    const { res: cssRes } = await fetchStatus(cssUrl);
    if (!cssRes.ok) {
      throw new Error(`Main CSS ${cssUrl} → HTTP ${cssRes.status}`);
    }
  }

  console.log(`[smoke-hosting] OK — ${label}`);
}

main().catch((error) => {
  console.error(`[smoke-hosting] FAIL — ${label}:`, error.message || error);
  process.exit(1);
});
