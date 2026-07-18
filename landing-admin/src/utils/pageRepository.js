import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  marketingRouteToFirestore,
  normalizeMarketingRoutes,
  ROUTES_SUBCOLLECTION,
  stripMarketingEditorFields,
} from '@raulizqli/landing-core/marketingSite';
import { getHubDb, getDbForConfig } from './firebaseClients';
import {
  mergeHubRouteWithExternalContent,
  shouldUseExternalFirebase,
  splitPageSavePayload,
} from './externalFirebase';
import { getPageSnapshot, pageDocRef, primaryPagesCollection } from './firestoreAccess';
import { hydratePageForm, normalizePageData } from './pageModel';

async function loadMarketingRoutes(db, pageId, collectionName) {
  try {
    const routesRef = collection(db, collectionName, pageId, ROUTES_SUBCOLLECTION);
    const snapshot = await getDocs(routesRef);
    if (snapshot.empty) return [];
    return normalizeMarketingRoutes(
      snapshot.docs.map((routeDoc) => ({ id: routeDoc.id, ...routeDoc.data() })),
    );
  } catch (error) {
    console.warn('Could not load marketing routes:', error);
    return [];
  }
}

async function saveMarketingRoutes(db, pageId, collectionName, routes) {
  const normalized = normalizeMarketingRoutes(routes);
  const routesRef = collection(db, collectionName, pageId, ROUTES_SUBCOLLECTION);
  const existing = await getDocs(routesRef);
  const keepIds = new Set(normalized.map((route) => route.id));
  const batch = writeBatch(db);

  existing.docs.forEach((routeDoc) => {
    if (!keepIds.has(routeDoc.id)) {
      batch.delete(routeDoc.ref);
    }
  });

  normalized.forEach((route) => {
    const payload = marketingRouteToFirestore(route);
    batch.set(doc(db, collectionName, pageId, ROUTES_SUBCOLLECTION, route.id), payload, { merge: true });
  });

  await batch.commit();
  return normalized;
}

export async function loadPageForEditor(pageId, hubRouteData = {}) {
  const hubDb = getHubDb();
  const route = normalizePageData(hubRouteData);

  if (!shouldUseExternalFirebase(route)) {
    const { snapshot, collectionName } = await getPageSnapshot(hubDb, pageId);
    if (!snapshot?.exists()) {
      return hydratePageForm({ id: pageId, ...route, marketingRoutes: [] });
    }
    const data = snapshot.data();
    const marketingRoutes = await loadMarketingRoutes(hubDb, pageId, collectionName);
    return hydratePageForm({ id: pageId, ...data, marketingRoutes });
  }

  const externalDb = getDbForConfig(route.externalFirebase);
  const { snapshot: externalSnapshot, collectionName } = await getPageSnapshot(externalDb, pageId);
  if (!externalSnapshot?.exists()) {
    return hydratePageForm({ id: pageId, ...route, marketingRoutes: [] });
  }

  const merged = mergeHubRouteWithExternalContent(route, externalSnapshot.data());
  const marketingRoutes = await loadMarketingRoutes(externalDb, pageId, collectionName);
  return hydratePageForm({ ...merged, id: pageId, marketingRoutes });
}

export async function savePageFromEditor(pageId, formData) {
  const hubDb = getHubDb();
  const marketingRoutes = normalizeMarketingRoutes(formData.marketingRoutes);
  const withoutRoutes = stripMarketingEditorFields(formData);
  const payload = splitPageSavePayload(withoutRoutes);
  const dataToUpdate = { ...payload.contentData };
  delete dataToUpdate.id;
  delete dataToUpdate.marketingRoutes;
  delete dataToUpdate.activeMarketingRouteId;

  const firstSlide = dataToUpdate.heroSlides?.[0];
  if (firstSlide) {
    dataToUpdate.heroTitle = firstSlide.showTitle ? firstSlide.title || '' : '';
    dataToUpdate.heroSubtitle = firstSlide.showText ? firstSlide.text || '' : '';
  }

  const hubCollection = primaryPagesCollection();

  if (payload.useExternal) {
    const externalDb = getDbForConfig(formData.externalFirebase);
    const { collectionName } = await getPageSnapshot(externalDb, pageId);
    await setDoc(pageDocRef(externalDb, pageId), dataToUpdate, { merge: true });
    if (dataToUpdate.siteMode === 'marketing' || marketingRoutes.length) {
      await saveMarketingRoutes(externalDb, pageId, collectionName || 'pages', marketingRoutes);
    }
    await setDoc(pageDocRef(hubDb, pageId, hubCollection), payload.hubData, { merge: true });
    return { migratedToExternal: true, marketingRoutes };
  }

  const { collectionName } = await getPageSnapshot(hubDb, pageId);
  await setDoc(pageDocRef(hubDb, pageId, hubCollection), dataToUpdate, { merge: true });
  if (dataToUpdate.siteMode === 'marketing' || marketingRoutes.length) {
    await saveMarketingRoutes(hubDb, pageId, collectionName || hubCollection, marketingRoutes);
  }
  return { migratedToExternal: false, marketingRoutes };
}

export async function createPageInHub({ pageId, name = '', specialty = '', vertical = 'generic' }) {
  const id = String(pageId ?? '').trim();
  if (!id) {
    throw new Error('Falta el ID de la página.');
  }

  const hubDb = getHubDb();
  const { snapshot } = await getPageSnapshot(hubDb, id);
  if (snapshot?.exists()) {
    throw new Error(`Ya existe una página con ID "${id}".`);
  }

  const initial = hydratePageForm({
    name: String(name ?? '').trim(),
    specialty: String(specialty ?? '').trim(),
    vertical,
    useExternalFirebase: false,
  });
  delete initial.id;
  delete initial.marketingRoutes;

  await setDoc(pageDocRef(hubDb, id, primaryPagesCollection()), initial, { merge: false });
  return hydratePageForm({ id, ...initial, marketingRoutes: [] });
}

export async function deleteMarketingRouteDoc(pageId, routeId, formData = {}) {
  const hubDb = getHubDb();
  if (shouldUseExternalFirebase(formData)) {
    const externalDb = getDbForConfig(formData.externalFirebase);
    const { collectionName } = await getPageSnapshot(externalDb, pageId);
    await deleteDoc(doc(externalDb, collectionName || 'pages', pageId, ROUTES_SUBCOLLECTION, routeId));
    return;
  }
  const { collectionName } = await getPageSnapshot(hubDb, pageId);
  await deleteDoc(doc(hubDb, collectionName || primaryPagesCollection(), pageId, ROUTES_SUBCOLLECTION, routeId));
}
