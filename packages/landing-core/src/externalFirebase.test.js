import { describe, expect, it } from 'vitest';
import {
  shouldUseExternalFirebase,
  splitPageSavePayload,
} from './externalFirebase.js';

const validExternal = {
  apiKey: 'key',
  authDomain: 'client.firebaseapp.com',
  projectId: 'client-project',
  storageBucket: 'client.appspot.com',
  messagingSenderId: '123',
  appId: '1:123:web:abc',
};

describe('shouldUseExternalFirebase', () => {
  it('requires the flag and a valid config', () => {
    expect(shouldUseExternalFirebase({
      useExternalFirebase: true,
      externalFirebase: validExternal,
    })).toBe(true);

    expect(shouldUseExternalFirebase({
      useExternalFirebase: false,
      externalFirebase: validExternal,
    })).toBe(false);

    expect(shouldUseExternalFirebase({
      useExternalFirebase: true,
      externalFirebase: { projectId: 'only-id' },
    })).toBe(false);
  });
});

describe('splitPageSavePayload', () => {
  it('keeps hub and content together for hub-only pages', () => {
    const formData = {
      name: 'Ana',
      aboutTagline: 'Hola',
      customDomain: 'ana.example.com',
      useExternalFirebase: false,
      externalFirebase: validExternal,
    };

    const payload = splitPageSavePayload(formData);
    expect(payload.useExternal).toBe(false);
    expect(payload.hubData.name).toBe('Ana');
    expect(payload.contentData.aboutTagline).toBe('Hola');
    expect(payload.hubData).toEqual(payload.contentData);
  });

  it('separates hub routing from full content for external Firebase pages', () => {
    const formData = {
      name: 'Ana',
      aboutTagline: 'Hola',
      customDomain: 'ana.example.com',
      useExternalFirebase: true,
      externalFirebase: validExternal,
      hostingProvider: 'hub',
    };

    const payload = splitPageSavePayload(formData);
    expect(payload.useExternal).toBe(true);
    expect(payload.hubData).toMatchObject({
      name: 'Ana',
      customDomain: 'ana.example.com',
      useExternalFirebase: true,
    });
    expect(payload.hubData).not.toHaveProperty('aboutTagline');
    expect(payload.contentData.aboutTagline).toBe('Hola');
    expect(payload.contentData.customDomain).toBe('ana.example.com');
  });
});
