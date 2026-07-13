import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { USERS_COLLECTION } from './firestorePaths';
import { normalizePageIdList, normalizeRole } from './permissions';

const BOOTSTRAP_ROOT_EMAIL = String(import.meta.env.VITE_BOOTSTRAP_ROOT_EMAIL ?? '').trim().toLowerCase();

export function normalizeUserProfile(uid, data = {}) {
  const role = normalizeRole(data.role);
  return {
    uid,
    email: String(data.email ?? '').trim().toLowerCase(),
    displayName: String(data.displayName ?? '').trim(),
    role,
    assignedPageIds: normalizePageIdList(data.assignedPageIds),
    pageId: String(data.pageId ?? '').trim(),
    updatedAt: data.updatedAt ?? null,
    createdAt: data.createdAt ?? null,
  };
}

export async function getUserProfile(db, uid) {
  if (!uid) return null;

  const snapshot = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (!snapshot.exists()) return null;

  return normalizeUserProfile(uid, snapshot.data());
}

/**
 * Ensures the configured bootstrap email always has role `root`.
 * Safe for demo: only upgrades the matching email; never demotes other roots.
 */
export async function ensureBootstrapRootProfile(db, authUser) {
  if (!authUser?.uid || !BOOTSTRAP_ROOT_EMAIL) {
    return authUser?.uid ? getUserProfile(db, authUser.uid) : null;
  }

  const email = String(authUser.email ?? '').trim().toLowerCase();
  if (!email || email !== BOOTSTRAP_ROOT_EMAIL) {
    return getUserProfile(db, authUser.uid);
  }

  const existing = await getUserProfile(db, authUser.uid);
  if (existing?.role === 'root') {
    return existing;
  }

  const now = new Date().toISOString();
  const profile = {
    email,
    displayName: String(authUser.displayName ?? existing?.displayName ?? '').trim(),
    role: 'root',
    assignedPageIds: [],
    pageId: '',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  await setDoc(doc(db, USERS_COLLECTION, authUser.uid), profile, { merge: true });
  return normalizeUserProfile(authUser.uid, profile);
}

export async function bootstrapRootProfileIfNeeded(db, authUser) {
  return ensureBootstrapRootProfile(db, authUser);
}

export async function listUserProfiles(db) {
  const snapshot = await getDocs(collection(db, USERS_COLLECTION));
  return snapshot.docs
    .map((userDoc) => normalizeUserProfile(userDoc.id, userDoc.data()))
    .sort((a, b) => a.email.localeCompare(b.email));
}

export async function saveUserProfile(db, uid, payload) {
  const role = normalizeRole(payload.role);
  if (!role) {
    throw new Error('Selecciona un rol válido.');
  }

  const email = String(payload.email ?? '').trim().toLowerCase();
  if (!email) {
    throw new Error('El email es obligatorio.');
  }

  const assignedPageIds = normalizePageIdList(payload.assignedPageIds);
  const pageId = String(payload.pageId ?? '').trim();

  if (role === 'admin' && assignedPageIds.length === 0) {
    throw new Error('Un admin debe tener al menos una página asignada.');
  }

  if (role === 'user' && !pageId) {
    throw new Error('Un usuario regular debe tener una página asignada.');
  }

  const data = {
    email,
    displayName: String(payload.displayName ?? '').trim(),
    role,
    assignedPageIds: role === 'admin' ? assignedPageIds : [],
    pageId: role === 'user' ? pageId : '',
    updatedAt: new Date().toISOString(),
  };

  const userRef = doc(db, USERS_COLLECTION, uid);
  const existing = await getDoc(userRef);

  if (existing.exists()) {
    await updateDoc(userRef, data);
  } else {
    await setDoc(userRef, {
      ...data,
      createdAt: new Date().toISOString(),
    });
  }

  return normalizeUserProfile(uid, data);
}

export async function deleteUserProfile(db, uid) {
  await deleteDoc(doc(db, USERS_COLLECTION, uid));
}
