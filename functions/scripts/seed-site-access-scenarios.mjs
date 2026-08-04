/**
 * Seed QA pages + billing accounts for unpaid site-access stages.
 *
 * Scenarios (new policy: 1 month grace → ads until 6 months → offline):
 *   qa-unpaid-ads      → ~45 days unpaid → stage "ads"
 *   qa-unpaid-offline  → ~200 days unpaid → stage "offline"
 *
 * Usage:
 *   cd functions && node scripts/seed-site-access-scenarios.mjs
 *   PROJECT_ID=landings-stage node scripts/seed-site-access-scenarios.mjs
 */
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import {
  resolveSiteAccessFromAccount,
  SITE_ACCESS_ADS_AFTER_DAYS,
  SITE_ACCESS_OFFLINE_AFTER_DAYS,
} from '../../packages/landing-core/src/siteAccess.js';

const PROJECT_ID = process.env.PROJECT_ID || 'landing-admin-9452e';
const DEFAULT_PASSWORD = 'DemoTest123!';
const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgoIso(days) {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}

function slide(partial) {
  return {
    imageUrl: '',
    title: '',
    text: '',
    showTitle: true,
    showText: true,
    showButtons: true,
    buttonsPosition: 'bottom-left',
    ...partial,
  };
}

const BASE_PAGE = {
  navMode: 'profile',
  navIconUrl: '',
  navLogoUrl: '',
  navIconOnly: false,
  navShowCta: true,
  navShowMenu: false,
  navAlign: 'spread',
  navCtaTarget: 'email',
  navCtaLink: '',
  heroSectionEnabled: true,
  aboutSectionEnabled: true,
  aboutBioEnabled: true,
  servicesSectionEnabled: true,
  contactSectionEnabled: true,
  socialSectionEnabled: false,
  useExternalFirebase: false,
  labelLanguage: 'es',
  customLabels: { es: {}, en: {} },
  vertical: 'generic',
};

const SCENARIOS = [
  {
    pageId: 'qa-unpaid-ads',
    accountId: 'qa-billing-unpaid-ads',
    unpaidDays: Math.max(SITE_ACCESS_ADS_AFTER_DAYS + 15, 45),
    email: 'qa.ads@demo.leftsidedev.test',
    displayName: 'QA Unpaid Ads',
    name: 'QA · Mes de prueba vencido (ads)',
    specialty: 'Escenario: publicidad activa',
    aboutTagline: 'Simula unpaidSince pasado el primer mes.',
    aboutBio: 'Este sitio debería mostrar el banner de publicidad / Google Ads en el template público.',
  },
  {
    pageId: 'qa-unpaid-offline',
    accountId: 'qa-billing-unpaid-offline',
    unpaidDays: Math.max(SITE_ACCESS_OFFLINE_AFTER_DAYS + 20, 200),
    email: 'qa.offline@demo.leftsidedev.test',
    displayName: 'QA Unpaid Offline',
    name: 'QA · Offline por falta de pago',
    specialty: 'Escenario: sitio offline',
    aboutTagline: 'Simula unpaidSince más de 6 meses sin ingresos de ads.',
    aboutBio: 'Este sitio debería mostrar la página de offline en el template público.',
  },
];

function init() {
  if (getApps().length === 0) {
    initializeApp({
      credential: applicationDefault(),
      projectId: PROJECT_ID,
    });
  }
}

async function upsertAuthUser(auth, db, { email, displayName, pageId }) {
  const normalized = email.toLowerCase();
  let uid;
  let created = false;

  try {
    const existing = await auth.getUserByEmail(normalized);
    uid = existing.uid;
    await auth.updateUser(uid, {
      displayName,
      password: DEFAULT_PASSWORD,
      emailVerified: true,
      disabled: false,
    });
  } catch (err) {
    if (err?.code !== 'auth/user-not-found') throw err;
    const createdUser = await auth.createUser({
      email: normalized,
      password: DEFAULT_PASSWORD,
      displayName,
      emailVerified: true,
    });
    uid = createdUser.uid;
    created = true;
  }

  await db.collection('users').doc(uid).set(
    {
      email: normalized,
      displayName,
      role: 'user',
      pageId,
      assignedPageIds: [],
      billingAccountId: null,
      seeded: true,
      updatedAt: new Date().toISOString(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { uid, created, email: normalized };
}

async function main() {
  init();
  const auth = getAuth();
  const db = getFirestore();
  const nowIso = new Date().toISOString();

  console.log(`Seeding site-access scenarios on ${PROJECT_ID}…\n`);
  console.log(
    `Policy: grace 0–${SITE_ACCESS_ADS_AFTER_DAYS}d → ads → offline at ${SITE_ACCESS_OFFLINE_AFTER_DAYS}d\n`,
  );

  for (const scenario of SCENARIOS) {
    const unpaidSince = daysAgoIso(scenario.unpaidDays);
    const siteAccess = resolveSiteAccessFromAccount(
      {
        status: 'canceled',
        unpaidSince,
        monetization: { adsRevenueOk: false, forceStage: '' },
      },
      { now: Date.now() },
    );

    const { uid, created, email } = await upsertAuthUser(auth, db, scenario);

    await db.collection('billingAccounts').doc(scenario.accountId).set(
      {
        ownerUid: uid,
        planId: 'pro',
        status: 'canceled',
        pageIds: [scenario.pageId],
        unpaidSince,
        monetization: { adsRevenueOk: false, forceStage: '' },
        siteAccess,
        seeded: true,
        updatedAt: nowIso,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await db.collection('users').doc(uid).set(
      { billingAccountId: scenario.accountId },
      { merge: true },
    );

    await db.collection('pages').doc(scenario.pageId).set(
      {
        ...BASE_PAGE,
        name: scenario.name,
        specialty: scenario.specialty,
        aboutTagline: scenario.aboutTagline,
        aboutBio: scenario.aboutBio,
        email,
        phone: '',
        location: 'QA · LeftSideDev',
        heroSlides: [
          slide({
            title: scenario.name,
            text: scenario.aboutTagline,
          }),
        ],
        heroTitle: scenario.name,
        heroSubtitle: scenario.aboutTagline,
        services: [
          {
            layout: 'title_description',
            title: `Stage: ${siteAccess.stage}`,
            description: `unpaidSince ≈ ${scenario.unpaidDays} días · adsEnabled=${siteAccess.adsEnabled} · offline=${siteAccess.offline}`,
            listItems: [],
            imageUrl: '',
          },
        ],
        siteAccess,
        billingAccountId: scenario.accountId,
        seededAt: FieldValue.serverTimestamp(),
        updatedAt: nowIso,
      },
      { merge: true },
    );

    console.log(
      `${created ? 'created' : 'updated'}  ${scenario.pageId.padEnd(22)} stage=${siteAccess.stage.padEnd(8)} unpaid≈${scenario.unpaidDays}d  ${email}`,
    );
    console.log(`  preview  http://localhost:5174/?pageId=${scenario.pageId}`);
  }

  console.log(`\nDone. Password for QA users: ${DEFAULT_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
