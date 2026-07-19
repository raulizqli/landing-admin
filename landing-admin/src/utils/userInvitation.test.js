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

  it('normalizes an international WhatsApp phone', () => {
    expect(normalizeWhatsAppPhone('+52 (55) 1234-5678')).toBe('525512345678');
  });

  it('builds the invitation message without exposing a password', () => {
    const message = buildUserInvitationMessage(invitation);
    expect(message).toContain('Hola, Ana.');
    expect(message).toContain(invitation.invitationLink);
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

  it('builds a WhatsApp URL using digits only', () => {
    const url = buildUserInvitationUrl({
      ...invitation,
      channel: INVITATION_CHANNELS.WHATSAPP,
      phone: '+52 55 1234 5678',
    });
    expect(url).toMatch(/^https:\/\/wa\.me\/525512345678\?text=/);
  });
});
