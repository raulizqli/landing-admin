"use strict";
/**
 * Mirror of packages/landing-core/src/contactValidation.js for Cloud Functions.
 * Keep in sync.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.APPROVAL_STATUSES = void 0;
exports.normalizeEmail = normalizeEmail;
exports.isValidEmail = isValidEmail;
exports.digitsOnly = digitsOnly;
exports.normalizeMxUsPhone = normalizeMxUsPhone;
exports.isValidMxUsPhone = isValidMxUsPhone;
exports.normalizeApprovalStatus = normalizeApprovalStatus;
const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const MX_NSN_LEN = 10;
const US_NSN_LEN = 10;
function normalizeEmail(value) {
    return String(value !== null && value !== void 0 ? value : "").trim().toLowerCase();
}
function isValidEmail(value) {
    const email = normalizeEmail(value);
    if (!email || email.length > 254)
        return false;
    if (!EMAIL_RE.test(email))
        return false;
    const [local, domain] = email.split("@");
    if (!local || !domain || local.length > 64)
        return false;
    if (local.startsWith(".") || local.endsWith(".") || local.includes(".."))
        return false;
    return true;
}
function digitsOnly(value) {
    return String(value !== null && value !== void 0 ? value : "").replace(/\D/g, "");
}
function normalizeMxUsPhone(value, defaultCountry = "") {
    let digits = digitsOnly(value);
    if (!digits) {
        return { ok: false, e164: "", country: "" };
    }
    if (digits.startsWith("00")) {
        digits = digits.slice(2);
    }
    let country = "";
    let nsn = "";
    if (digits.startsWith("52") && digits.length === 12) {
        country = "mx";
        nsn = digits.slice(2);
    }
    else if (digits.startsWith("1") && digits.length === 11) {
        country = "us";
        nsn = digits.slice(1);
    }
    else if (digits.length === 10) {
        const fallback = String(defaultCountry !== null && defaultCountry !== void 0 ? defaultCountry : "").trim().toLowerCase();
        if (fallback === "mx" || fallback === "us") {
            country = fallback;
            nsn = digits;
        }
        else {
            return { ok: false, e164: "", country: "" };
        }
    }
    else if (digits.startsWith("521") && digits.length === 13) {
        country = "mx";
        nsn = digits.slice(3);
    }
    else {
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
function isValidMxUsPhone(value, defaultCountry = "") {
    return normalizeMxUsPhone(value, defaultCountry).ok;
}
exports.APPROVAL_STATUSES = ["pending", "approved", "rejected"];
function normalizeApprovalStatus(value, { hasRole = false } = {}) {
    const status = String(value !== null && value !== void 0 ? value : "").trim().toLowerCase();
    if (exports.APPROVAL_STATUSES.includes(status)) {
        return status;
    }
    return hasRole ? "approved" : "pending";
}
//# sourceMappingURL=contactValidation.js.map