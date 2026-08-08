/**
 * Shared email / phone validation for CMS registration (MX + US).
 * Keep in sync with functions/src/contactValidation.ts
 */

const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

/** National subscriber number length after country code (NANP / MX mobile). */
const MX_NSN_LEN = 10;
const US_NSN_LEN = 10;

export function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function isValidEmail(value) {
  const email = normalizeEmail(value);
  if (!email || email.length > 254) return false;
  if (!EMAIL_RE.test(email)) return false;
  const [local, domain] = email.split('@');
  if (!local || !domain || local.length > 64) return false;
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  return true;
}

export function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '');
}

/**
 * Normalize MX (+52) or US/CA NANP (+1) phone to E.164 (+digits).
 * Accepts: +52…, 52…, +1…, 1…, or 10-digit local (assumes MX if starts with 55/33/81 etc. is ambiguous —
 * prefer explicit country: use defaultCountry when 10 digits).
 *
 * @param {string} value
 * @param {'mx'|'us'|''} [defaultCountry=''] when input is 10 digits without country code
 * @returns {{ ok: true, e164: string, country: 'mx'|'us' } | { ok: false, e164: '', country: '' }}
 */
export function normalizeMxUsPhone(value, defaultCountry = '') {
  let digits = digitsOnly(value);
  if (!digits) {
    return { ok: false, e164: '', country: '' };
  }

  // Strip leading 00 international prefix
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  let country = '';
  let nsn = '';

  if (digits.startsWith('52') && digits.length === 12) {
    country = 'mx';
    nsn = digits.slice(2);
  } else if (digits.startsWith('1') && digits.length === 11) {
    country = 'us';
    nsn = digits.slice(1);
  } else if (digits.length === 10) {
    const fallback = String(defaultCountry ?? '').trim().toLowerCase();
    if (fallback === 'mx' || fallback === 'us') {
      country = fallback;
      nsn = digits;
    } else {
      return { ok: false, e164: '', country: '' };
    }
  } else if (digits.startsWith('521') && digits.length === 13) {
    // MX mobile often stored with extra 1 after 52 (WhatsApp style)
    country = 'mx';
    nsn = digits.slice(3);
  } else {
    return { ok: false, e164: '', country: '' };
  }

  if (country === 'mx' && nsn.length !== MX_NSN_LEN) {
    return { ok: false, e164: '', country: '' };
  }
  if (country === 'us' && nsn.length !== US_NSN_LEN) {
    return { ok: false, e164: '', country: '' };
  }
  // NANP: area code and exchange cannot start with 0 or 1
  if (country === 'us') {
    if (/^[01]/.test(nsn) || /^[01]/.test(nsn.slice(3))) {
      return { ok: false, e164: '', country: '' };
    }
  }
  // MX: 10-digit national number
  if (country === 'mx' && !/^\d{10}$/.test(nsn)) {
    return { ok: false, e164: '', country: '' };
  }

  const cc = country === 'mx' ? '52' : '1';
  return { ok: true, e164: `+${cc}${nsn}`, country };
}

export function isValidMxUsPhone(value, defaultCountry = '') {
  return normalizeMxUsPhone(value, defaultCountry).ok;
}

export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'];

export function normalizeApprovalStatus(value, { hasRole = false } = {}) {
  const status = String(value ?? '').trim().toLowerCase();
  if (APPROVAL_STATUSES.includes(status)) return status;
  // Legacy profiles created by root: treat as approved when they already have a role.
  return hasRole ? 'approved' : 'pending';
}
