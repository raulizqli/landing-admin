import { describe, expect, it } from 'vitest';
import {
  buildInquiryWhatsAppMessage,
  resolveContactFormProjectTypes,
  validateInquiryPayload,
} from './contactInquiry.js';

describe('contactInquiry', () => {
  it('validates required fields and honeypot', () => {
    const ok = validateInquiryPayload({
      name: 'Ana',
      projectType: 'recording',
      contact: 'ana@example.com',
      message: 'Quiero grabar un EP',
    });
    expect(ok.ok).toBe(true);

    const spam = validateInquiryPayload({
      name: 'Bot',
      projectType: 'recording',
      contact: 'x',
      message: 'y',
      website: 'http://spam.test',
    });
    expect(spam.ok).toBe(false);
    expect(spam.errors).toContain('spam');
  });

  it('resolves default project types when empty', () => {
    const types = resolveContactFormProjectTypes({}, 'es');
    expect(types.length).toBeGreaterThanOrEqual(4);
    expect(types.some((item) => item.value === 'recording')).toBe(true);
  });

  it('builds WhatsApp message body', () => {
    const text = buildInquiryWhatsAppMessage({
      baseMessage: 'Hola',
      name: 'Luis',
      projectTypeLabel: 'Grabación',
      contact: '5512345678',
      message: 'Sesión el sábado',
    });
    expect(text).toMatch(/Luis/);
    expect(text).toMatch(/Grabación/);
    expect(text).toMatch(/Sesión el sábado/);
  });
});
