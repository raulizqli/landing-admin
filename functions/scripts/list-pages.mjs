import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'landing-admin-9452e' });
}

const candidates = process.argv.slice(2);
const db = getFirestore();

async function main() {
  if (candidates.length) {
    for (const id of candidates) {
      const s = await db.collection('pages').doc(id).get();
      console.log(`${id}: ${s.exists ? 'EXISTS' : 'free'}`);
    }
    return;
  }
  const pages = await db.collection('pages').get();
  console.log(`pages total: ${pages.size}`);
  console.log(pages.docs.map((d) => d.id).sort().join('\n'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
