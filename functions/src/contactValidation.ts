/**
 * Mirror of packages/landing-core/src/contactValidation.js for Cloud Functions.
 * Keep in sync.
 */

const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

const MX_NSN_LEN = 10;
const US_NSN_LEN = 10;

export function normalizeEmail(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function isValidEmail(value: unknown): boolean {
  const email = normalizeEmail(value);
  if (!email || email.length > 254) return false;
  if (!EMAIL_RE.test(email)) return false;
  const [local, domain] = email.split("@");
  if (!local || !domain || local.length > 64) return false;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  return true;
}

export function digitsOnly(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

export type PhoneCountry = "mx" | "us";

export function normalizeMxUsPhone(
  value: unknown,
  defaultCountry: "" | PhoneCountry = "",
): { ok: true; e164: string; country: PhoneCountry } | { ok: false; e164: ""; country: "" } {
  let digits = digitsOnly(value);
  if (!digits) {
    return { ok: false, e164: "", country: "" };
  }

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  let country: "" | PhoneCountry = "";
  let nsn = "";

  if (digits.startsWith("52") && digits.length === 12) {
    country = "mx";
    nsn = digits.slice(2);
  } else if (digits.startsWith("1") && digits.length === 11) {
    country = "us";
    nsn = digits.slice(1);
  } else if (digits.length === 10) {
    const fallback = String(defaultCountry ?? "").trim().toLowerCase();
    if (fallback === "mx" || fallback === "us") {
      country = fallback;
      nsn = digits;
    } else {
      return { ok: false, e164: "", country: "" };
    }
  } else if (digits.startsWith("521") && digits.length === 13) {
    country = "mx";
    nsn = digits.slice(3);
  } else {
    return { ok: false, e164: "", country: "" };
  }

  if (country === "mx" && nsn.length !== MX_NSN_LEN) {
    return { ok: false, e164: "", country: "" };
  }
  if (country === "us" && nsn.length !== US_NSN_LEN) {
    return { ok: false, e164: "", country: "" };
  }
  if (country === "us") {
    if (/^[01]/.test(nsn) || /^[01]/.test(nsn.slice(3))) {
      return { ok: false, e164: "", country: "" };
    }
  }
  if (country === "mx" && !/^\d{10}$/.test(nsn)) {
    return { ok: false, e164: "", country: "" };
  }

  const cc = country === "mx" ? "52" : "1";
  return { ok: true, e164: `+${cc}${nsn}`, country };
}

export function isValidMxUsPhone(value: unknown, defaultCountry: "" | PhoneCountry = ""): boolean {
  return normalizeMxUsPhone(value, defaultCountry).ok;
}

export const APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export function normalizeApprovalStatus(
  value: unknown,
  { hasRole = false }: { hasRole?: boolean } = {},
): ApprovalStatus {
  const status = String(value ?? "").trim().toLowerCase();
  if ((APPROVAL_STATUSES as readonly string[]).includes(status)) {
    return status as ApprovalStatus;
  }
  return hasRole ? "approved" : "pending";
}
