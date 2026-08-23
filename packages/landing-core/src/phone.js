import { getLabel, resolvePageLabels } from './labels.js';

export const DEFAULT_PHONE_COUNTRY = 'mx';

/** Supported dial regions for WhatsApp / phone helpers (extend as needed). */
export const PHONE_COUNTRIES = [
  {
    value: 'mx',
    label: 'México',
    dialCode: '52',
    dialLabel: '+52',
    nationalLength: 10,
    /** WhatsApp MX mobiles need an extra “1” after the country code. */
    whatsappMobilePrefix: '1',
    placeholder: '55 1234 5678',
  },
  {
    value: 'us',
    label: 'Estados Unidos',
    dialCode: '1',
    dialLabel: '+1',
    nationalLength: 10,
    whatsappMobilePrefix: '',
    placeholder: '555 123 4567',
  },
];

const PHONE_COUNTRY_SET = new Set(PHONE_COUNTRIES.map((item) => item.value));

export function normalizePhoneCountry(value) {
  const key = String(value ?? '').trim().toLowerCase();
  return PHONE_COUNTRY_SET.has(key) ? key : DEFAULT_PHONE_COUNTRY;
}

export function getPhoneCountryMeta(value = DEFAULT_PHONE_COUNTRY) {
  const key = normalizePhoneCountry(value);
  return PHONE_COUNTRIES.find((item) => item.value === key) ?? PHONE_COUNTRIES[0];
}

export function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function stripInternationalTrunk(digits) {
  let next = String(digits ?? '');
  if (next.startsWith('00')) next = next.slice(2);
  return next;
}

/**
 * Digits for https://wa.me/{digits}.
 * México: 52 + 1 + 10 national digits (WhatsApp quirk).
 * Estados Unidos: 1 + 10 national digits.
 * Already-prefixed values are normalized, not double-prefixed.
 */
export function toWhatsAppMeNumber(value, country = DEFAULT_PHONE_COUNTRY) {
  let digits = stripInternationalTrunk(digitsOnly(value));
  if (!digits) return '';

  const meta = getPhoneCountryMeta(country);
  const { dialCode, nationalLength, whatsappMobilePrefix } = meta;
  const fullPrefix = `${dialCode}${whatsappMobilePrefix}`;
  const fullLength = fullPrefix.length + nationalLength;

  if (digits.startsWith(fullPrefix) && digits.length >= fullLength) {
    return digits.slice(0, fullLength);
  }

  // MX: 52 + 10 digits without the mobile “1” → insert it.
  if (
    whatsappMobilePrefix
    && digits.startsWith(dialCode)
    && digits.length === dialCode.length + nationalLength
  ) {
    return `${fullPrefix}${digits.slice(dialCode.length)}`;
  }

  // Trunk “1” + national (common MX paste) → country + trunk + national.
  if (
    whatsappMobilePrefix
    && digits.length === whatsappMobilePrefix.length + nationalLength
    && digits.startsWith(whatsappMobilePrefix)
  ) {
    return `${dialCode}${digits}`;
  }

  if (digits.length === nationalLength) {
    return `${fullPrefix}${digits}`;
  }

  if (digits.length > nationalLength) {
    return `${fullPrefix}${digits.slice(-nationalLength)}`;
  }

  return digits;
}

export function buildWhatsAppUrl(value, country = DEFAULT_PHONE_COUNTRY) {
  const digits = toWhatsAppMeNumber(value, country);
  return digits ? `https://wa.me/${digits}` : '';
}

export function resolvePhoneContact(data) {
  const labels = resolvePageLabels(data);
  const display = String(data?.phone ?? '').trim();
  const isWhatsapp = data?.phoneIsWhatsapp === true;
  const country = normalizePhoneCountry(data?.phoneCountry);

  if (isWhatsapp) {
    const whatsappUrl = buildWhatsAppUrl(data?.whatsapp, country)
      || buildWhatsAppUrl(display, country);

    const visible = display || data?.whatsapp;
    if (!visible) return null;

    if (!whatsappUrl) {
      return { display: visible, href: null, isWhatsapp: true, external: true };
    }

    return {
      display: visible,
      href: `${whatsappUrl}?text=${encodeURIComponent(getLabel(labels, 'phone.whatsappMessage'))}`,
      isWhatsapp: true,
      external: true,
    };
  }

  if (!display) return null;

  return {
    display,
    href: `tel:${display.replace(/\s/g, '')}`,
    isWhatsapp: false,
    external: false,
  };
}
