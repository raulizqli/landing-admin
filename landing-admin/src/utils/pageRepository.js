import { setDoc, updateDoc } from 'firebase/firestore';
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
    await setDoc(pageDocRef(externalDb, pageId), dataToUpdate, { merge: true });
    await setDoc(pageDocRef(hubDb, pageId, hubCollection), payload.hubData, { merge: true });
    return;
  }

  await updateDoc(pageDocRef(hubDb, pageId, hubCollection), dataToUpdate);
}
