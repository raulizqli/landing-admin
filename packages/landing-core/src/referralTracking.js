/**
 * Referral code generation and subscription tracking system.
 * Tracks who referred whom and measures subscription conversions.
 */

/**
 * Generate a unique referral code for a user/page.
 * Format: 6 uppercase alphanumeric characters (e.g. "PSY4A2")
 */
export function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars (0,O,1,I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Validate referral code format.
 */
export function isValidReferralCode(code) {
  if (typeof code !== 'string') return false;
  const normalized = code.trim().toUpperCase();
  return /^[A-Z2-9]{6}$/.test(normalized);
}

/**
 * Normalize referral code (uppercase, trim).
 */
export function normalizeReferralCode(code) {
  if (!code) return '';
  return String(code).trim().toUpperCase();
}

/**
 * Empty referral stats object.
 */
export function createEmptyReferralStats(overrides = {}) {
  return {
    totalClicks: Number(overrides.totalClicks) || 0,
    totalSignups: Number(overrides.totalSignups) || 0,
    totalPaidConversions: Number(overrides.totalPaidConversions) || 0,
    totalRevenue: Number(overrides.totalRevenue) || 0,
    lastUsedAt: overrides.lastUsedAt ? String(overrides.lastUsedAt) : null,
    createdAt: overrides.createdAt ? String(overrides.createdAt) : new Date().toISOString(),
    updatedAt: overrides.updatedAt ? String(overrides.updatedAt) : new Date().toISOString(),
  };
}

/**
 * Normalize referral stats from Firestore.
 */
export function normalizeReferralStats(value = {}) {
  if (!value || typeof value !== 'object') {
    return createEmptyReferralStats();
  }
  return createEmptyReferralStats(value);
}

/**
 * Empty referral configuration for a page/user.
 */
export function createEmptyReferralConfig(overrides = {}) {
  return {
    enabled: overrides.enabled === true,
    code: normalizeReferralCode(overrides.code || ''),
    customSlug: String(overrides.customSlug ?? '').trim().toLowerCase(),
    stats: normalizeReferralStats(overrides.stats),
  };
}

/**
 * Normalize referral configuration.
 */
export function normalizeReferralConfig(value = {}) {
  if (!value || typeof value !== 'object') {
    return createEmptyReferralConfig();
  }
  return createEmptyReferralConfig(value);
}

/**
 * Empty referral conversion record (who was referred).
 */
export function createEmptyReferralConversion(overrides = {}) {
  return {
    id: String(overrides.id ?? '').trim(),
    referrerCode: normalizeReferralCode(overrides.referrerCode || ''),
    referrerId: String(overrides.referrerId ?? '').trim(),
    referredUserId: String(overrides.referredUserId ?? '').trim(),
    referredEmail: String(overrides.referredEmail ?? '').trim(),
    status: normalizeConversionStatus(overrides.status),
    accountId: String(overrides.accountId ?? '').trim(),
    planId: String(overrides.planId ?? '').trim(),
    revenue: Number(overrides.revenue) || 0,
    currency: String(overrides.currency ?? 'usd').toLowerCase(),
    clickedAt: overrides.clickedAt ? String(overrides.clickedAt) : null,
    signedUpAt: overrides.signedUpAt ? String(overrides.signedUpAt) : null,
    convertedAt: overrides.convertedAt ? String(overrides.convertedAt) : null,
    createdAt: overrides.createdAt ? String(overrides.createdAt) : new Date().toISOString(),
    updatedAt: overrides.updatedAt ? String(overrides.updatedAt) : new Date().toISOString(),
  };
}

/**
 * Conversion status: clicked, signed_up, converted, expired.
 */
const CONVERSION_STATUSES = ['clicked', 'signed_up', 'converted', 'expired'];

export function normalizeConversionStatus(value) {
  const status = String(value ?? '').trim().toLowerCase();
  return CONVERSION_STATUSES.includes(status) ? status : 'clicked';
}

/**
 * Normalize referral conversion record.
 */
export function normalizeReferralConversion(value = {}) {
  if (!value || typeof value !== 'object') {
    return createEmptyReferralConversion();
  }
  return createEmptyReferralConversion(value);
}

/**
 * Generate a shareable referral link.
 */
export function generateReferralLink(code, baseUrl = 'https://app.toqua.co') {
  if (!code) return '';
  const normalized = normalizeReferralCode(code);
  if (!isValidReferralCode(normalized)) return '';
  return `${baseUrl.replace(/\/$/, '')}/signup?ref=${normalized}`;
}

/**
 * Parse referral code from URL query params.
 */
export function parseReferralCodeFromUrl(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url, 'https://dummy.com');
    const ref = urlObj.searchParams.get('ref') || urlObj.searchParams.get('referral');
    if (ref) {
      const normalized = normalizeReferralCode(ref);
      return isValidReferralCode(normalized) ? normalized : null;
    }
  } catch {
    // Invalid URL
  }
  return null;
}

/**
 * Calculate referral conversion rate.
 */
export function calculateConversionRate(stats) {
  const normalized = normalizeReferralStats(stats);
  if (normalized.totalClicks === 0) return 0;
  return (normalized.totalPaidConversions / normalized.totalClicks) * 100;
}

/**
 * Format revenue for display.
 */
export function formatReferralRevenue(amount, currency = 'usd') {
  const normalized = Number(amount) || 0;
  const curr = String(currency).toUpperCase();
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: curr === 'MXN' ? 'MXN' : 'USD',
  }).format(normalized);
}

/**
 * Check if a referral code is available (not already taken).
 * This is a client-side format check; server must verify uniqueness.
 */
export function canUseReferralCode(code) {
  return isValidReferralCode(code);
}

/**
 * Referral tier/reward configuration (for future use).
 */
export const REFERRAL_TIERS = [
  {
    id: 'bronze',
    name: 'Bronze',
    minConversions: 0,
    rewardPercent: 10,
    color: '#CD7F32',
  },
  {
    id: 'silver',
    name: 'Silver',
    minConversions: 5,
    rewardPercent: 15,
    color: '#C0C0C0',
  },
  {
    id: 'gold',
    name: 'Gold',
    minConversions: 20,
    rewardPercent: 20,
    color: '#FFD700',
  },
  {
    id: 'platinum',
    name: 'Platinum',
    minConversions: 50,
    rewardPercent: 25,
    color: '#E5E4E2',
  },
];

/**
 * Get the current tier based on conversion count.
 */
export function getReferralTier(totalConversions) {
  const conversions = Number(totalConversions) || 0;
  for (let i = REFERRAL_TIERS.length - 1; i >= 0; i--) {
    if (conversions >= REFERRAL_TIERS[i].minConversions) {
      return REFERRAL_TIERS[i];
    }
  }
  return REFERRAL_TIERS[0];
}

/**
 * Get the next tier to reach.
 */
export function getNextReferralTier(totalConversions) {
  const conversions = Number(totalConversions) || 0;
  for (let i = 0; i < REFERRAL_TIERS.length; i++) {
    if (conversions < REFERRAL_TIERS[i].minConversions) {
      return REFERRAL_TIERS[i];
    }
  }
  return null; // Already at max tier
}
