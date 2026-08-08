import { describe, expect, it } from 'vitest';
import {
  isValidEmail,
  normalizeEmail,
  normalizeMxUsPhone,
  isValidMxUsPhone,
  normalizeApprovalStatus,
} from './contactValidation.js';

describe('isValidEmail', () => {
  it('accepts normal emails', () => {
    expect(isValidEmail('ana@ejemplo.com')).toBe(true);
    expect(isValidEmail('  User.Name+tag@Mail.CO.uk ')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('no-at')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('a..b@c.com')).toBe(false);
  });

  it('normalizes to lowercase', () => {
    expect(normalizeEmail('Ana@Ejemplo.COM')).toBe('ana@ejemplo.com');
  });
});

describe('normalizeMxUsPhone', () => {
  it('accepts MX with country code', () => {
    expect(normalizeMxUsPhone('+52 55 1234 5678')).toEqual({
      ok: true,
      e164: '+525512345678',
      country: 'mx',
    });
    expect(normalizeMxUsPhone('5215512345678')).toEqual({
      ok: true,
      e164: '+525512345678',
      country: 'mx',
    });
  });

  it('accepts US with country code', () => {
    expect(normalizeMxUsPhone('+1 (415) 555-2671')).toEqual({
      ok: true,
      e164: '+14155552671',
      country: 'us',
    });
  });

  it('uses defaultCountry for 10-digit local numbers', () => {
    expect(normalizeMxUsPhone('5512345678', 'mx').e164).toBe('+525512345678');
    expect(normalizeMxUsPhone('4155552671', 'us').e164).toBe('+14155552671');
    expect(normalizeMxUsPhone('5512345678').ok).toBe(false);
  });

  it('rejects invalid NANP', () => {
    expect(isValidMxUsPhone('+1 015 555 2671')).toBe(false);
    expect(isValidMxUsPhone('123')).toBe(false);
  });
});

describe('normalizeApprovalStatus', () => {
  it('defaults legacy role profiles to approved', () => {
    expect(normalizeApprovalStatus('', { hasRole: true })).toBe('approved');
    expect(normalizeApprovalStatus(undefined, { hasRole: false })).toBe('pending');
    expect(normalizeApprovalStatus('pending')).toBe('pending');
  });
});
