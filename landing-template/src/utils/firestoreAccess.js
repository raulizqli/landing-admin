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
  DOMAIN_INDEX_COLLECTION,
  domainIndexDocId,
} from '@raulizqli/landing-core/domainIndex';
import {
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

/**
 * List pages (CMS / tooling). Prefer scoped pageIds — anonymous list is denied (F03 Step B).
 */
export async function listPageDocuments(db, options = {}) {
  const scopedIds = Array.isArray(options.pageIds)
    ? [...new Set(options.pageIds.map((id) => String(id ?? '').trim()).filter(Boolean))]
    : null;

  if (scopedIds) {
    const byId = new Map();
    await Promise.all(scopedIds.map(async (pageId) => {
      const { snapshot, collectionName } = await getPageSnapshot(db, pageId);
      if (snapshot?.exists()) {
        byId.set(pageId, {
          id: pageId,
          collectionName,
          ...normalizePageData(snapshot.data()),
        });
      }
    }));
    return Array.from(byId.values());
  }

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

async function findPageRouteByDomainQuery(db, domain) {
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

async function findPageRouteByDomainIndex(db, domain) {
  const indexId = domainIndexDocId(domain);
  if (!indexId) return null;

  const indexSnap = await getDoc(doc(db, DOMAIN_INDEX_COLLECTION, indexId));
  if (!indexSnap.exists()) return null;

  const indexData = indexSnap.data() || {};
  const pageId = String(indexData.pageId ?? '').trim();
  if (!pageId) return null;

  const preferred = indexData.collectionName === 'paginas' ? 'paginas' : 'pages';
  const ordered = preferred === 'pages'
    ? PAGE_COLLECTIONS
    : [preferred, ...PAGE_COLLECTIONS.filter((name) => name !== preferred)];

  for (const collectionName of ordered) {
    const snapshot = await getDoc(pageDocRef(db, pageId, collectionName));
    if (!snapshot.exists()) continue;
    return {
      pageId,
      collectionName,
      routeData: snapshot.data(),
    };
  }

  return { pageId, collectionName: preferred, routeData: indexData };
}

/**
 * Resolve custom domain → page via domainIndex (anonymous-safe). Query fallback for staff.
 */
export async function findPageRouteByDomain(db, hostname) {
  const domain = domainIndexDocId(hostname);
  if (!domain) return null;

  const fromIndex = await findPageRouteByDomainIndex(db, domain);
  if (fromIndex?.pageId) return fromIndex;

  try {
    return await findPageRouteByDomainQuery(db, domain);
  } catch (error) {
    console.warn('Domain query fallback failed (expected for anonymous clients):', error?.code || error);
    return null;
  }
}
