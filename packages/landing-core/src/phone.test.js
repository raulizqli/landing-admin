import { describe, expect, it } from 'vitest';
import {
  buildWhatsAppUrl,
  resolvePhoneContact,
  toWhatsAppMeNumber,
} from './phone.js';

describe('toWhatsAppMeNumber', () => {
  it('builds Mexico WhatsApp digits as 52 + 1 + 10 national digits', () => {
    expect(toWhatsAppMeNumber('5512345678', 'mx')).toBe('5215512345678');
    expect(toWhatsAppMeNumber('55 1234 5678', 'mx')).toBe('5215512345678');
    expect(toWhatsAppMeNumber('525512345678', 'mx')).toBe('5215512345678');
    expect(toWhatsAppMeNumber('5215512345678', 'mx')).toBe('5215512345678');
    expect(toWhatsAppMeNumber('15512345678', 'mx')).toBe('5215512345678');
  });

  it('builds US WhatsApp digits as 1 + 10 national digits', () => {
    expect(toWhatsAppMeNumber('5551234567', 'us')).toBe('15551234567');
    expect(toWhatsAppMeNumber('1 555 123 4567', 'us')).toBe('15551234567');
    expect(toWhatsAppMeNumber('15551234567', 'us')).toBe('15551234567');
  });

  it('defaults to Mexico when country is missing', () => {
    expect(toWhatsAppMeNumber('5512345678')).toBe('5215512345678');
  });
});

describe('buildWhatsAppUrl', () => {
  it('returns a wa.me URL', () => {
    expect(buildWhatsAppUrl('5512345678', 'mx')).toBe('https://wa.me/5215512345678');
    expect(buildWhatsAppUrl('', 'mx')).toBe('');
  });
});

describe('resolvePhoneContact', () => {
  it('returns a tel: href for regular phone numbers', () => {
    const contact = resolvePhoneContact({ phone: '+52 55 1234 5678' });
    expect(contact).toEqual({
      display: '+52 55 1234 5678',
      href: 'tel:+525512345678',
      isWhatsapp: false,
      external: false,
    });
  });

  it('returns a WhatsApp href when phoneIsWhatsapp is true', () => {
    const contact = resolvePhoneContact({
      phone: '5512345678',
      phoneIsWhatsapp: true,
      phoneCountry: 'mx',
      whatsapp: '5512345678',
      labelLanguage: 'es',
    });
    expect(contact.isWhatsapp).toBe(true);
    expect(contact.external).toBe(true);
    expect(contact.href).toMatch(/^https:\/\/wa\.me\/5215512345678\?text=/);
  });

  it('builds WhatsApp from local phone digits when social whatsapp is empty', () => {
    const contact = resolvePhoneContact({
      phone: '55 1234 5678',
      phoneIsWhatsapp: true,
      phoneCountry: 'mx',
      labelLanguage: 'es',
    });
    expect(contact.href).toMatch(/^https:\/\/wa\.me\/5215512345678\?text=/);
  });

  it('returns null when there is no displayable phone', () => {
    expect(resolvePhoneContact({})).toBeNull();
    expect(resolvePhoneContact({ phoneIsWhatsapp: true })).toBeNull();
  });
});
