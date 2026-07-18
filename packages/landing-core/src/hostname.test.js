import { describe, expect, it } from 'vitest';
import { isLocalHostname, normalizeHostname } from './hostname.js';

describe('normalizeHostname', () => {
  it('trims, lowercases, and strips leading www.', () => {
    expect(normalizeHostname('  WWW.Example.COM ')).toBe('example.com');
  });

  it('returns empty string for nullish values', () => {
    expect(normalizeHostname(null)).toBe('');
    expect(normalizeHostname(undefined)).toBe('');
  });
});

describe('isLocalHostname', () => {
  it('treats empty, localhost, and 127.0.0.1 as local', () => {
    expect(isLocalHostname('')).toBe(true);
    expect(isLocalHostname('localhost')).toBe(true);
    expect(isLocalHostname('127.0.0.1')).toBe(true);
    expect(isLocalHostname('WWW.LOCALHOST')).toBe(true);
  });

  it('treats public hosts as non-local', () => {
    expect(isLocalHostname('example.com')).toBe(false);
    expect(isLocalHostname('landing-template-9452e.web.app')).toBe(false);
  });
});
