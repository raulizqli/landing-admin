import { setDoc } from 'firebase/firestore';
import { getHubDb, getDbForConfig } from './firebaseClients';
import {
  mergeHubRouteWithExternalContent,
  shouldUseExternalFirebase,
  splitPageSavePayload,
} from './externalFirebase';
import { getPageSnapshot, pageDocRef, primaryPagesCollection } from './firestoreAccess';
import { hydratePageForm, normalizePageData } from './pageModel';

export async function loadPageForEditor(pageId, hubRouteData = {}) {
  const hubDb = getHubDb();
  const route = normalizePageData(hubRouteData);

  if (!shouldUseExternalFirebase(route)) {
    const { snapshot } = await getPageSnapshot(hubDb, pageId);
    if (!snapshot?.exists()) {
      return hydratePageForm({ id: pageId, ...route });
    }
    return hydratePageForm({ id: pageId, ...snapshot.data() });
  }

  const externalDb = getDbForConfig(route.externalFirebase);
  const { snapshot: externalSnapshot } = await getPageSnapshot(externalDb, pageId);
  if (!externalSnapshot?.exists()) {
    return hydratePageForm({ id: pageId, ...route });
  }

  return hydratePageForm(mergeHubRouteWithExternalContent(route, externalSnapshot.data()));
}

export async function savePageFromEditor(pageId, formData) {
  const hubDb = getHubDb();
  const payload = splitPageSavePayload(formData);
  const dataToUpdate = { ...payload.contentData };
  delete dataToUpdate.id;

  const firstSlide = dataToUpdate.heroSlides?.[0];
  if (firstSlide) {
    dataToUpdate.heroTitle = firstSlide.showTitle ? firstSlide.title || '' : '';
    dataToUpdate.heroSubtitle = firstSlide.showText ? firstSlide.text || '' : '';
  }

  const hubCollection = primaryPagesCollection();

  if (payload.useExternal) {
    const externalDb = getDbForConfig(formData.externalFirebase);
    // Migrate/publish content into the client's Firebase project.
    await setDoc(pageDocRef(externalDb, pageId), dataToUpdate, { merge: true });
    // Hub only keeps routing + pointer to external config.
    await setDoc(pageDocRef(hubDb, pageId, hubCollection), payload.hubData, { merge: true });
    return { migratedToExternal: true };
  }

  await setDoc(pageDocRef(hubDb, pageId, hubCollection), dataToUpdate, { merge: true });
  return { migratedToExternal: false };
}

export async function createPageInHub({ pageId, name = '', specialty = '' }) {
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
    useExternalFirebase: false,
  });
  delete initial.id;

  await setDoc(pageDocRef(hubDb, id, primaryPagesCollection()), initial, { merge: false });
  return hydratePageForm({ id, ...initial });
}
