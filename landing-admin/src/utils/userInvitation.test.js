import { describe, expect, it } from 'vitest';
import {
  buildUserInvitationMessage,
  buildUserInvitationUrl,
  INVITATION_CHANNELS,
  normalizeWhatsAppPhone,
} from './userInvitation';

describe('userInvitation', () => {
  const invitation = {
    email: 'ana@example.com',
    displayName: 'Ana',
    invitationLink: 'https://example.com/reset?mode=resetPassword&oobCode=abc',
  };

  it('normalizes a Mexico WhatsApp phone for wa.me', () => {
    expect(normalizeWhatsAppPhone('+52 (55) 1234-5678')).toBe('5215512345678');
    expect(normalizeWhatsAppPhone('5512345678', 'mx')).toBe('5215512345678');
  });

  it('builds the invitation message without exposing a password', () => {
    const message = buildUserInvitationMessage(invitation);
    expect(message).toContain('Hola, Ana.');
    expect(message).toContain(invitation.invitationLink);
    expect(message).toContain('establecer tu contraseña');
    expect(message).not.toContain('contraseña:');
  });

  it('builds an encoded email invitation URL', () => {
    const url = buildUserInvitationUrl({
      ...invitation,
      channel: INVITATION_CHANNELS.EMAIL,
    });
    expect(url).toMatch(/^mailto:ana%40example\.com\?/);
    expect(decodeURIComponent(url)).toContain(invitation.invitationLink);
  });

  it('builds a WhatsApp URL with Mexico mobile prefix', () => {
    const url = buildUserInvitationUrl({
      ...invitation,
      channel: INVITATION_CHANNELS.WHATSAPP,
      phone: '55 1234 5678',
      phoneCountry: 'mx',
    });
    expect(url).toMatch(/^https:\/\/wa\.me\/5215512345678\?text=/);
  });
});
