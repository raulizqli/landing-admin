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

const MISSING_RESEND_HINT =
  'Configura RESEND_API_KEY + APPROVAL_EMAIL_FROM en Functions, o la extensión Trigger Email.';

const DOMAIN_HINT =
  ' En Resend, verifica el dominio del remitente y usa una API key con permiso para enviar desde ese dominio.';

export function describeTransactionalEmailFailure(result, missingConfigHint = MISSING_RESEND_HINT) {
  const reason = String(result?.emailReason || result?.invitationEmailReason || '').trim();
  const detail = String(result?.emailError || result?.invitationEmailError || '').trim();

  if (reason === 'missing_resend_config' || (!reason && !detail)) {
    return missingConfigHint;
  }
  if (detail) {
    return `${detail}${DOMAIN_HINT}`;
  }
  if (reason === 'resend_error') {
    return `Resend rechazó el envío.${DOMAIN_HINT}`;
  }
  return `No se pudo entregar el correo (${reason || 'error'}).${DOMAIN_HINT}`;
}
