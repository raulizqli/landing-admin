export const INVITATION_CHANNELS = Object.freeze({
  NONE: 'none',
  EMAIL: 'email',
  WHATSAPP: 'whatsapp',
});

export function normalizeWhatsAppPhone(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function buildUserInvitationMessage({ displayName, email, invitationLink }) {
  const greetingName = String(displayName ?? '').trim() || String(email ?? '').trim();
  return `Hola, ${greetingName}. Se creó tu acceso al administrador de tu landing. Usa este enlace para establecer tu contraseña e iniciar sesión: ${invitationLink}. Por seguridad, el enlace es temporal.`;
}

export function buildUserInvitationUrl({
  channel,
  phone,
  email,
  displayName,
  invitationLink,
}) {
  const message = buildUserInvitationMessage({ displayName, email, invitationLink });

  if (channel === INVITATION_CHANNELS.EMAIL) {
    const subject = 'Tu acceso al administrador de tu landing';
    return `mailto:${encodeURIComponent(String(email ?? '').trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  }

  if (channel === INVITATION_CHANNELS.WHATSAPP) {
    const normalizedPhone = normalizeWhatsAppPhone(phone);
    if (!normalizedPhone) {
      throw new Error('Ingresa un teléfono de WhatsApp con código de país.');
    }
    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
  }

  return '';
}
