import { describe, expect, it } from 'vitest';
import { resolvePhoneContact } from './phone.js';

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
      whatsapp: '5215512345678',
      labelLanguage: 'es',
    });
    expect(contact.isWhatsapp).toBe(true);
    expect(contact.external).toBe(true);
    expect(contact.href).toMatch(/^https:\/\/wa\.me\/5215512345678\?text=/);
  });

  it('returns null when there is no displayable phone', () => {
    expect(resolvePhoneContact({})).toBeNull();
    expect(resolvePhoneContact({ phoneIsWhatsapp: true })).toBeNull();
  });
});
