import { describe, expect, it } from 'vitest';
import { resolveBookingCta } from './bookingCta.js';

describe('resolveBookingCta', () => {
  it('resolves WhatsApp CTA when configured', () => {
    const cta = resolveBookingCta({
      navCtaTarget: 'whatsapp',
      whatsapp: '5215512345678',
      labelLanguage: 'es',
    });
    expect(cta.external).toBe(true);
    expect(cta.href).toMatch(/^https:\/\/wa\.me\/5215512345678\?text=/);
  });

  it('resolves external link CTA and prefixes https when missing', () => {
    const cta = resolveBookingCta({
      navCtaTarget: 'link',
      navCtaLink: 'calendly.com/demo',
    });
    expect(cta.href).toBe('https://calendly.com/demo');
    expect(cta.external).toBe(true);
  });

  it('falls back to mailto when email is present', () => {
    const cta = resolveBookingCta({
      navCtaTarget: 'email',
      email: 'hola@ejemplo.com',
      labelLanguage: 'es',
    });
    expect(cta.external).toBe(false);
    expect(cta.href).toMatch(/^mailto:hola@ejemplo\.com\?subject=/);
  });

  it('falls back to #contact when nothing else is available', () => {
    const cta = resolveBookingCta({ navCtaTarget: 'email' });
    expect(cta).toEqual({ href: '#contact', external: false });
  });
});
