/**
 * Clone pages/{sourceId} → pages/{targetId} in Firestore.
 *
 * Usage:
 *   cd functions && node scripts/clone-page.mjs --to <targetId> [--from <sourceId>]
 *
 * --from defaults to leftsidedev. --to is required.
 */
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
  clonePageDocument,
  clonePageUsage,
  parseCloneArgs,
} from './lib/page-clone.mjs';

const PROJECT_ID = 'landing-admin-9452e';

function init() {
  if (getApps().length === 0) {
    initializeApp({
      credential: applicationDefault(),
      projectId: PROJECT_ID,
    });
  }
}

async function main() {
  let args;
  try {
    args = parseCloneArgs();
  } catch (err) {
    console.error(String(err.message || err));
    console.error('');
    console.error(clonePageUsage());
    process.exit(1);
  }

  if (args.help) {
    console.log(clonePageUsage());
    return;
  }

  init();
  const db = getFirestore();
  const result = await clonePageDocument(db, {
    from: args.from,
    to: args.to,
  });

  console.log(`cloned  pages/${result.from} → pages/${result.to}`);
  console.log(`routes  removed ${result.routes.removed}, copied ${result.routes.copied}`);
  console.log(`preview http://localhost:5174/?pageId=${result.to}`);
  console.log(`live     https://web.toqua.site/?pageId=${result.to}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
