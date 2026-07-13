import { getDbForConfig, getHubDb } from './firebaseClients';
import { getPageSnapshot } from './firestoreAccess';
import { normalizePageData } from './pageModel';

export async function fetchPageContent(pageId, routeData = null) {
  const hubDb = getHubDb();
  const route = routeData ? normalizePageData(routeData) : null;

  if (route?.useExternalFirebase && route.externalFirebase?.projectId) {
    const externalDb = getDbForConfig(route.externalFirebase);
    const { snapshot: externalSnap } = await getPageSnapshot(externalDb, pageId);
    if (!externalSnap?.exists()) return null;
    return normalizePageData({
      ...externalSnap.data(),
      customDomain: route.customDomain,
      useExternalFirebase: route.useExternalFirebase,
      externalFirebase: route.externalFirebase,
    });
  }

  const { snapshot } = await getPageSnapshot(hubDb, pageId);
  if (!snapshot?.exists()) return null;
  return normalizePageData(snapshot.data());
}
