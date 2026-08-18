import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage as hubStorage } from '../firebase';
import { getContentStorageForPage } from './firebaseClients';
import { STORAGE_PAGES_ROOT, UNKNOWN_PAGE_ID } from './firestorePaths';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
export const DEFAULT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const HERO_SLIDE_IMAGE_MAX_BYTES = 15 * 1024 * 1024;

function safePageId(pageId) {
  return String(pageId || UNKNOWN_PAGE_ID).replace(/[^a-zA-Z0-9_-]/g, '_');
}

function extensionFor(file) {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName;
  }

  switch (file.type) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
}

export async function uploadPageImage(file, { pageId, folder, pageData, maxBytes = DEFAULT_IMAGE_MAX_BYTES } = {}) {
  if (!file) {
    throw new Error('No se seleccionó ningún archivo.');
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Formato no permitido. Usa JPG, PNG, WEBP o GIF.');
  }

  if (file.size > maxBytes) {
    const limitMb = Math.round(maxBytes / (1024 * 1024));
    throw new Error(`La imagen supera el límite de ${limitMb} MB.`);
  }

  const ext = extensionFor(file);
  const path = `${STORAGE_PAGES_ROOT}/${safePageId(pageId)}/${folder}-${Date.now()}.${ext}`;
  const storage = pageData ? getContentStorageForPage(pageData) : hubStorage;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}

// Legacy export name — prefer uploadPageImage
export const uploadPaginaImage = uploadPageImage;
