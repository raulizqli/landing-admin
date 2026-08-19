import {
  collection,
  deleteDoc,
  doc,
  getDoc,
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
import {
  getPrivateHostingFields,
  mergePrivateHostingIntoPage,
} from '@raulizqli/landing-core/hostingDeploy';
import {
  DOMAIN_INDEX_COLLECTION,
  buildDomainIndexPayload,
  domainIndexDocId,
} from '@raulizqli/landing-core/domainIndex';
import { buildMarketingSeoArtifacts } from '@raulizqli/landing-core/marketingSeo';
import { assertMarketingSiteAccessRemote } from './billingFunctions';
import { getHubDb, getDbForConfig } from './firebaseClients';
import {
  mergeHubRouteWithExternalContent,
  shouldUseExternalFirebase,
  splitPageSavePayload,
} from './externalFirebase';
import { getPageSnapshot, pageDocRef, primaryPagesCollection } from './firestoreAccess';
import { hydratePageForm, normalizePageData } from './pageModel';

const PRIVATE_SUBCOLLECTION = 'private';
const PRIVATE_HOSTING_DOC = 'hosting';

function privateHostingRef(db, pageId, collectionName) {
  return doc(db, collectionName, pageId, PRIVATE_SUBCOLLECTION, PRIVATE_HOSTING_DOC);
}

async function loadPrivateHosting(db, pageId, collectionName) {
  try {
    const snapshot = await getDoc(privateHostingRef(db, pageId, collectionName));
    if (!snapshot.exists()) return {};
    return snapshot.data() || {};
  } catch (error) {
    console.warn('Could not load private hosting config:', error);
    return {};
  }
}

export async function savePrivateHostingConfig(pageId, formData) {
  const hubDb = getHubDb();
  const { collectionName } = await getPageSnapshot(hubDb, pageId);
  const hubCollection = collectionName || primaryPagesCollection();
  const payload = getPrivateHostingFields(formData);
  await setDoc(privateHostingRef(hubDb, pageId, hubCollection), payload, { merge: true });
  return payload;
}

async function savePrivateHosting(db, pageId, collectionName, formData) {
  const payload = getPrivateHostingFields(formData);
  await setDoc(privateHostingRef(db, pageId, collectionName), payload, { merge: true });
}

function stripServerOwnedPageFields(data) {
  const next = { ...data };
  delete next.id;
  delete next.marketingRoutes;
  delete next.activeMarketingRouteId;
  // Owned by billing sync (Cloud Functions), not the page editor.
  delete next.siteAccess;
  delete next.unpaidSince;
  // Deploy secrets live under private/hosting — clear public fields on save (migration).
  next.hostingDeployHookUrl = '';
  next.hostingGithubOwner = '';
  next.hostingGithubRepo = '';
  next.hostingGithubWorkflow = '';
  next.hostingGithubRef = '';
  return next;
}

async function syncDomainIndex(db, pageId, collectionName, nextDomain, previousDomain) {
  const next = domainIndexDocId(nextDomain);
  const prev = domainIndexDocId(previousDomain);

  if (prev && prev !== next) {
    try {
      await deleteDoc(doc(db, DOMAIN_INDEX_COLLECTION, prev));
    } catch (error) {
      console.warn('Could not remove previous domainIndex entry:', error);
    }
  }

  if (!next) return;

  try {
    await setDoc(
      doc(db, DOMAIN_INDEX_COLLECTION, next),
      buildDomainIndexPayload(pageId, collectionName),
      { merge: true },
    );
  } catch (error) {
    console.warn('Could not upsert domainIndex entry:', error);
  }
}

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
    const privateHosting = await loadPrivateHosting(hubDb, pageId, collectionName);
    return hydratePageForm(mergePrivateHostingIntoPage(
      { id: pageId, ...data, marketingRoutes },
      privateHosting,
    ));
  }

  const externalDb = getDbForConfig(route.externalFirebase);
  const { snapshot: externalSnapshot, collectionName } = await getPageSnapshot(externalDb, pageId);
  if (!externalSnapshot?.exists()) {
    return hydratePageForm({ id: pageId, ...route, marketingRoutes: [] });
  }

  const merged = mergeHubRouteWithExternalContent(route, externalSnapshot.data());
  const marketingRoutes = await loadMarketingRoutes(externalDb, pageId, collectionName);
  const hubCollection = primaryPagesCollection();
  const privateHosting = await loadPrivateHosting(hubDb, pageId, hubCollection);
  return hydratePageForm(mergePrivateHostingIntoPage(
    { ...merged, id: pageId, marketingRoutes },
    privateHosting,
  ));
}

export async function savePageFromEditor(pageId, formData) {
  const hubDb = getHubDb();
  const marketingRoutes = normalizeMarketingRoutes(formData.marketingRoutes);
  const withoutRoutes = stripMarketingEditorFields(formData);
  const payload = splitPageSavePayload(withoutRoutes);
  const dataToUpdate = stripServerOwnedPageFields({ ...payload.contentData });
  const hubData = stripServerOwnedPageFields({ ...payload.hubData });

  const firstSlide = dataToUpdate.heroSlides?.[0];
  if (firstSlide) {
    dataToUpdate.heroTitle = firstSlide.showTitle ? firstSlide.title || '' : '';
    dataToUpdate.heroSubtitle = firstSlide.showText ? firstSlide.text || '' : '';
  }
  dataToUpdate.videoSectionUrl = String(
    dataToUpdate.videoSectionItems?.[0]?.url || dataToUpdate.videoSectionUrl || '',
  ).trim();

  let seoArtifacts = dataToUpdate.seoArtifacts || null;
  if (dataToUpdate.siteMode === 'marketing') {
    // Server-side entitlement hard gate (Enterprise plan or Agency add-on; root bypass).
    await assertMarketingSiteAccessRemote(pageId);
    seoArtifacts = buildMarketingSeoArtifacts({
      ...dataToUpdate,
      marketingRoutes,
    });
    dataToUpdate.seoArtifacts = seoArtifacts;
  }

  const hubCollection = primaryPagesCollection();
  const { snapshot: existingHubSnap } = await getPageSnapshot(hubDb, pageId);
  const previousDomain = existingHubSnap?.exists()
    ? existingHubSnap.data()?.customDomain
    : '';

  if (payload.useExternal) {
    const externalDb = getDbForConfig(formData.externalFirebase);
    const { collectionName } = await getPageSnapshot(externalDb, pageId);
    await setDoc(pageDocRef(externalDb, pageId), dataToUpdate, { merge: true });
    if (dataToUpdate.siteMode === 'marketing' || marketingRoutes.length) {
      await saveMarketingRoutes(externalDb, pageId, collectionName || 'pages', marketingRoutes);
    }
    await setDoc(pageDocRef(hubDb, pageId, hubCollection), hubData, { merge: true });
    await savePrivateHosting(hubDb, pageId, hubCollection, formData);
    await syncDomainIndex(
      hubDb,
      pageId,
      hubCollection,
      hubData.customDomain ?? formData.customDomain,
      previousDomain,
    );
    return { migratedToExternal: true, marketingRoutes, seoArtifacts };
  }

  const { collectionName } = await getPageSnapshot(hubDb, pageId);
  const targetCollection = collectionName || hubCollection;
  await setDoc(pageDocRef(hubDb, pageId, hubCollection), dataToUpdate, { merge: true });
  await savePrivateHosting(hubDb, pageId, targetCollection, formData);
  await syncDomainIndex(
    hubDb,
    pageId,
    hubCollection,
    dataToUpdate.customDomain ?? formData.customDomain,
    previousDomain,
  );
  if (dataToUpdate.siteMode === 'marketing' || marketingRoutes.length) {
    await saveMarketingRoutes(hubDb, pageId, targetCollection, marketingRoutes);
  }
  return { migratedToExternal: false, marketingRoutes, seoArtifacts };
}

export async function createPageInHub({
  pageId,
  name = '',
  specialty = '',
  vertical = 'generic',
  draft = null,
}) {
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
    ...(draft && typeof draft === 'object' ? draft : {}),
    name: String(name ?? '').trim(),
    specialty: String(specialty ?? '').trim(),
    vertical,
    useExternalFirebase: false,
  });
  delete initial.id;
  delete initial.marketingRoutes;
  // Do not seed public docs with deploy secrets.
  initial.hostingDeployHookUrl = '';
  initial.hostingGithubOwner = '';
  initial.hostingGithubRepo = '';
  initial.hostingGithubWorkflow = '';
  initial.hostingGithubRef = '';

  const hubCollection = primaryPagesCollection();
  await setDoc(pageDocRef(hubDb, id, hubCollection), initial, { merge: false });
  await syncDomainIndex(hubDb, id, hubCollection, initial.customDomain, '');
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
