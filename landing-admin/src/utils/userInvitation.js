import {
  buildWhatsAppUrl,
  normalizePhoneCountry,
  toWhatsAppMeNumber,
} from '@raulizqli/landing-core/phone';

export const INVITATION_CHANNELS = Object.freeze({
  NONE: 'none',
  EMAIL: 'email',
  WHATSAPP: 'whatsapp',
});

export function normalizeWhatsAppPhone(value, country = 'mx') {
  return toWhatsAppMeNumber(value, normalizePhoneCountry(country));
}

export function buildUserInvitationMessage({ displayName, email, invitationLink }) {
  const greetingName = String(displayName ?? '').trim() || String(email ?? '').trim();
  return [
    `Hola, ${greetingName}.`,
    'Te compartimos el acceso al administrador de tu landing.',
    `Usa este enlace para establecer tu contraseña e iniciar sesión: ${invitationLink}.`,
    'Por seguridad, el enlace es temporal.',
  ].join(' ');
}

export function buildUserInvitationUrl({
  channel,
  phone,
  phoneCountry = 'mx',
  email,
  displayName,
  invitationLink,
}) {
  const message = buildUserInvitationMessage({ displayName, email, invitationLink });

  if (channel === INVITATION_CHANNELS.EMAIL) {
    const subject = 'Tu acceso al administrador LeftSideDev';
    return `mailto:${encodeURIComponent(String(email ?? '').trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  }

  if (channel === INVITATION_CHANNELS.WHATSAPP) {
    const href = buildWhatsAppUrl(phone, phoneCountry);
    if (!href) {
      throw new Error('Ingresa un teléfono de WhatsApp válido.');
    }
    return `${href}?text=${encodeURIComponent(message)}`;
  }

  return '';
}
