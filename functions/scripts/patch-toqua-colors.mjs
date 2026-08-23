/**
 * Patch pages/toqua color fields only (no content reset).
 *
 * Usage:
 *   cd functions && node scripts/patch-toqua-colors.mjs
 */
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import {
  TOQUA_PURPLE,
  TOQUA_WHITE,
  createToquaSectionThemes,
  patchCustomEmbedsColors,
  patchHeroSlides,
  patchServices,
} from './lib/toqua-theme.mjs';

const PROJECT_ID = 'landing-admin-9452e';
const PAGE_ID = 'toqua';

function init() {
  if (getApps().length === 0) {
    initializeApp({
      credential: applicationDefault(),
      projectId: PROJECT_ID,
    });
  }
}

async function main() {
  init();
  const db = getFirestore();
  const ref = db.collection('pages').doc(PAGE_ID);
  const snap = await ref.get();

  if (!snap.exists) {
    throw new Error(`Page "${PAGE_ID}" not found. Run seed-toqua-page.mjs first.`);
  }

  const data = snap.data();
  const patch = {
    navCtaBgColor: TOQUA_PURPLE,
    navCtaTextColor: TOQUA_WHITE,
    sectionThemes: createToquaSectionThemes(),
    heroSlides: patchHeroSlides(data.heroSlides),
    services: patchServices(data.services),
    customEmbeds: patchCustomEmbedsColors(data.customEmbeds),
    colorPatchedAt: FieldValue.serverTimestamp(),
    updatedAt: new Date().toISOString(),
  };

  await ref.update(patch);

  console.log(`patched  pages/${PAGE_ID}`);
  console.log(`text     ${TOQUA_PURPLE} (sectionThemes)`);
  console.log(`buttons  ${TOQUA_PURPLE} (nav CTA + hero + service titles)`);
  console.log(`live     https://web.toqua.site/?pageId=${PAGE_ID}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
