import { beforeEach, describe, expect, it, vi } from 'vitest';

const setDoc = vi.fn(async () => undefined);
const getDocs = vi.fn(async () => ({ empty: true, docs: [] }));
const collection = vi.fn((...args) => ({ path: args.join('/') }));
const doc = vi.fn((...args) => ({ path: args.join('/') }));
const deleteDoc = vi.fn(async () => undefined);
const writeBatch = vi.fn(() => ({
  delete: vi.fn(),
  set: vi.fn(),
  commit: vi.fn(async () => undefined),
}));

const getHubDb = vi.fn(() => ({ name: 'hub-db' }));
const getDbForConfig = vi.fn(() => ({ name: 'external-db' }));
const getPageSnapshot = vi.fn();
const pageDocRef = vi.fn((db, pageId, collectionName = 'pages') => ({
  path: `${db.name}/${collectionName}/${pageId}`,
}));
const primaryPagesCollection = vi.fn(() => 'pages');
const assertMarketingSiteAccessRemote = vi.fn(async () => undefined);

vi.mock('firebase/firestore', () => ({
  setDoc: (...args) => setDoc(...args),
  getDocs: (...args) => getDocs(...args),
  collection: (...args) => collection(...args),
  doc: (...args) => doc(...args),
  deleteDoc: (...args) => deleteDoc(...args),
  writeBatch: (...args) => writeBatch(...args),
}));

vi.mock('./firebaseClients', () => ({
  getHubDb: (...args) => getHubDb(...args),
  getDbForConfig: (...args) => getDbForConfig(...args),
}));

vi.mock('./firestoreAccess', () => ({
  getPageSnapshot: (...args) => getPageSnapshot(...args),
  pageDocRef: (...args) => pageDocRef(...args),
  primaryPagesCollection: (...args) => primaryPagesCollection(...args),
}));

vi.mock('./billingFunctions', () => ({
  assertMarketingSiteAccessRemote: (...args) => assertMarketingSiteAccessRemote(...args),
}));

const { loadPageForEditor, savePageFromEditor } = await import('./pageRepository.js');

describe('savePageFromEditor', () => {
  beforeEach(() => {
    setDoc.mockClear();
    getDocs.mockClear();
    getHubDb.mockClear();
    getDbForConfig.mockClear();
    pageDocRef.mockClear();
    primaryPagesCollection.mockClear();
    getPageSnapshot.mockReset();
    getPageSnapshot.mockResolvedValue({
      snapshot: { exists: () => true, data: () => ({}) },
      collectionName: 'pages',
    });
  });

  it('writes English keys and syncs heroTitle/heroSubtitle from the first slide', async () => {
    const formData = {
      id: 'dra-ana',
      name: 'Ana',
      specialty: 'Psicología',
      useExternalFirebase: false,
      externalFirebase: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
      },
      heroSlides: [
        {
          title: 'Bienvenida',
          text: 'Un espacio seguro',
          showTitle: true,
          showText: true,
        },
      ],
    };

    const result = await savePageFromEditor('dra-ana', formData);

    expect(result.migratedToExternal).toBe(false);
    expect(setDoc).toHaveBeenCalledTimes(1);
    const [, payload, options] = setDoc.mock.calls[0];
    expect(options).toEqual({ merge: true });
    expect(payload).not.toHaveProperty('id');
    expect(payload).not.toHaveProperty('marketingRoutes');
    expect(payload.name).toBe('Ana');
    expect(payload.specialty).toBe('Psicología');
    expect(payload.heroTitle).toBe('Bienvenida');
    expect(payload.heroSubtitle).toBe('Un espacio seguro');
    expect(pageDocRef).toHaveBeenCalledWith(
      { name: 'hub-db' },
      'dra-ana',
      'pages',
    );
  });

  it('clears heroTitle/heroSubtitle when slide text flags are off', async () => {
    await savePageFromEditor('dra-ana', {
      name: 'Ana',
      useExternalFirebase: false,
      heroSlides: [
        {
          title: 'Hidden',
          text: 'Also hidden',
          showTitle: false,
          showText: false,
        },
      ],
    });

    const [, payload] = setDoc.mock.calls[0];
    expect(payload.heroTitle).toBe('');
    expect(payload.heroSubtitle).toBe('');
  });
});

describe('loadPageForEditor', () => {
  beforeEach(() => {
    getPageSnapshot.mockReset();
    getHubDb.mockClear();
    getDocs.mockReset();
    getDocs.mockResolvedValue({ empty: true, docs: [] });
  });

  it('hydrates the form from a hub Firestore document', async () => {
    getPageSnapshot.mockResolvedValue({
      snapshot: {
        exists: () => true,
        data: () => ({
          name: 'Ana',
          specialty: 'Clínica',
          aboutTagline: 'Hola',
        }),
      },
      collectionName: 'pages',
    });

    const form = await loadPageForEditor('dra-ana', {});

    expect(getPageSnapshot).toHaveBeenCalledWith({ name: 'hub-db' }, 'dra-ana');
    expect(form.id).toBe('dra-ana');
    expect(form.name).toBe('Ana');
    expect(form.specialty).toBe('Clínica');
    expect(form.aboutTagline).toBe('Hola');
    expect(form.enabledLanguages).toContain('es');
    expect(form.heroSlides).toHaveLength(1);
    expect(form.marketingRoutes).toEqual([]);
  });

  it('falls back to hub route data when the snapshot is missing', async () => {
    getPageSnapshot.mockResolvedValue({
      snapshot: null,
      collectionName: 'pages',
    });

    const form = await loadPageForEditor('dra-ana', {
      name: 'Route Name',
      specialty: 'From route',
    });

    expect(form.name).toBe('Route Name');
    expect(form.specialty).toBe('From route');
    expect(form.heroSlides).toHaveLength(1);
    expect(form.marketingRoutes).toEqual([]);
  });
});
