import { describe, expect, it } from 'vitest';
import { isFacebookLoginConfigured } from './facebookLogin.js';

describe('facebookLogin', () => {
  it('is disabled when VITE_FACEBOOK_APP_ID is empty', () => {
    expect(isFacebookLoginConfigured()).toBe(Boolean(String(import.meta.env.VITE_FACEBOOK_APP_ID ?? '').trim()));
  });
});
