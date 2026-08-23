#!/usr/bin/env node
/**
 * Diagnose Firebase Hosting custom domain for toqua.site.
 * Requires: gcloud auth login (or ADC) with access to landing-admin-9452e.
 *
 * Usage: node scripts/check-toqua-site-dns.mjs
 */
import { execSync } from 'node:child_process';

const PROJECT = 'landing-admin-9452e';
const SITE = 'toqua-marketing';
const DOMAIN = 'toqua.site';

function getAccessToken() {
  try {
    return execSync(`gcloud auth print-access-token --project=${PROJECT}`, { encoding: 'utf8' }).trim();
  } catch {
    console.error('Run: gcloud auth login && gcloud config set project', PROJECT);
    process.exit(1);
  }
}

const token = getAccessToken();
const url = `https://firebasehosting.googleapis.com/v1beta1/projects/${PROJECT}/sites/${SITE}/customDomains/${DOMAIN}`;
const res = await fetch(url, {
  headers: {
    Authorization: `Bearer ${token}`,
    'x-goog-user-project': PROJECT,
  },
});

if (!res.ok) {
  console.error('API error', res.status, await res.text());
  process.exit(1);
}

const data = await res.json();
console.log(`Domain: ${DOMAIN}`);
console.log(`Site:   ${SITE}`);
console.log(`Host:   ${data.hostState}`);
console.log(`Owner:  ${data.ownershipState}`);

if (data.ownershipState !== 'OWNERSHIP_ACTIVE') {
  console.log('\n⚠ Ownership mismatch — update DNS at your registrar:\n');
  const updates = data.requiredDnsUpdates;
  if (updates?.discovered?.[0]?.records) {
    console.log('Current records Firebase sees:');
    for (const r of updates.discovered[0].records) {
      console.log(`  ${r.type}  ${r.rdata}${r.requiredAction ? `  (${r.requiredAction})` : ''}`);
    }
  }
  if (updates?.desired?.[0]?.records) {
    console.log('\nRequired records:');
    for (const r of updates.desired[0].records) {
      console.log(`  ${r.type}  ${r.rdata}${r.requiredAction ? `  (${r.requiredAction})` : ''}`);
    }
  }
  console.log('\nTypical fix for toqua.site:');
  console.log('  REMOVE TXT  hosting-site=landing-admin-9452e');
  console.log('  ADD    TXT  hosting-site=toqua-marketing');
  console.log('  KEEP   A     199.36.158.100');
  console.log('\nAfter DNS propagates (minutes to hours), re-run this script.');
  process.exit(1);
}

console.log('\n✓ Custom domain is active. https://toqua.site should serve toqua-marketing.');
