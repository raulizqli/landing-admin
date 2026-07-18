import { collection, getDocs } from 'firebase/firestore';
import {
  normalizeMarketingRoutes,
  ROUTES_SUBCOLLECTION,
} from '@raulizqli/landing-core/marketingSite';
import { getDbForConfig, getHubDb } from './firebaseClients';
import { getPageSnapshot } from './firestoreAccess';
import { normalizePageData } from './pageModel';

async function loadMarketingRoutes(db, pageId, collectionName) {
  try {
    const snapshot = await getDocs(collection(db, collectionName, pageId, ROUTES_SUBCOLLECTION));
    if (snapshot.empty) return [];
    return normalizeMarketingRoutes(
      snapshot.docs.map((routeDoc) => ({ id: routeDoc.id, ...routeDoc.data() })),
    );
  } catch (error) {
    console.warn('Could not load marketing routes:', error);
    return [];
  }
}

export async function fetchPageContent(pageId, routeData = null) {
  const hubDb = getHubDb();
  const route = routeData ? normalizePageData(routeData) : null;

  if (route?.useExternalFirebase && route.externalFirebase?.projectId) {
    const externalDb = getDbForConfig(route.externalFirebase);
    const { snapshot: externalSnap, collectionName } = await getPageSnapshot(externalDb, pageId);
    if (!externalSnap?.exists()) return null;
    const marketingRoutes = await loadMarketingRoutes(externalDb, pageId, collectionName);
    return normalizePageData({
      ...externalSnap.data(),
      customDomain: route.customDomain,
      useExternalFirebase: route.useExternalFirebase,
      externalFirebase: route.externalFirebase,
      siteMode: route.siteMode || externalSnap.data()?.siteMode,
      marketingRoutes,
    });
  }

  const { snapshot, collectionName } = await getPageSnapshot(hubDb, pageId);
  if (!snapshot?.exists()) return null;
  const data = snapshot.data();
  const marketingRoutes = data?.siteMode === 'marketing' || route?.siteMode === 'marketing'
    ? await loadMarketingRoutes(hubDb, pageId, collectionName)
    : [];
  return normalizePageData({ ...data, marketingRoutes });
}
