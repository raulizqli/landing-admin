import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import {
  LEGACY_PAGES_COLLECTION,
  PAGE_COLLECTIONS,
  PAGES_COLLECTION,
} from './firestorePaths';
import { normalizePageData } from './pageModel';

export function pageDocRef(db, pageId, collectionName = PAGES_COLLECTION) {
  return doc(db, collectionName, pageId);
}

export async function getPageSnapshot(db, pageId) {
  for (const collectionName of PAGE_COLLECTIONS) {
    const snapshot = await getDoc(pageDocRef(db, pageId, collectionName));
    if (snapshot.exists()) {
      return { snapshot, collectionName };
    }
  }
  return { snapshot: null, collectionName: PAGES_COLLECTION };
}

export async function listPageDocuments(db) {
  const byId = new Map();

  await Promise.all(PAGE_COLLECTIONS.map(async (collectionName) => {
    const snapshot = await getDocs(collection(db, collectionName));
    snapshot.docs.forEach((pageDoc) => {
      if (!byId.has(pageDoc.id) || collectionName === PAGES_COLLECTION) {
        byId.set(pageDoc.id, {
          id: pageDoc.id,
          collectionName,
          ...normalizePageData(pageDoc.data()),
        });
      }
    });
  }));

  return Array.from(byId.values());
}

export async function findPageRouteByDomain(db, hostname) {
  const domain = String(hostname ?? '').trim().toLowerCase().replace(/^www\./, '');
  if (!domain) return null;

  for (const collectionName of PAGE_COLLECTIONS) {
    const routeQuery = query(
      collection(db, collectionName),
      where('customDomain', '==', domain),
      limit(1),
    );
    const snapshot = await getDocs(routeQuery);
    if (snapshot.empty) continue;

    const routeDoc = snapshot.docs[0];
    return {
      pageId: routeDoc.id,
      collectionName,
      routeData: routeDoc.data(),
    };
  }

  return null;
}

export function primaryPagesCollection() {
  return PAGES_COLLECTION;
}

export function legacyPagesCollection() {
  return LEGACY_PAGES_COLLECTION;
}
