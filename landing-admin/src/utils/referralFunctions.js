/**
 * Referral tracking utility functions for admin panel.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

/**
 * Enable referral code for the current user's billing account.
 */
export async function enableReferralCodeRemote() {
  const enableReferralCode = httpsCallable(functions, 'enableReferralCode');
  const result = await enableReferralCode({});
  return result.data;
}

/**
 * Update referral code to a custom value.
 */
export async function updateReferralCodeRemote(newCode) {
  const updateReferralCode = httpsCallable(functions, 'updateReferralCode');
  const result = await updateReferralCode({ newCode });
  return result.data;
}

/**
 * Toggle referral system enabled/disabled.
 */
export async function toggleReferralEnabledRemote(enabled) {
  const toggleReferralEnabled = httpsCallable(functions, 'toggleReferralEnabled');
  const result = await toggleReferralEnabled({ enabled });
  return result.data;
}

/**
 * Track a referral click.
 */
export async function trackReferralClickRemote(code, metadata = {}) {
  const trackReferralClick = httpsCallable(functions, 'trackReferralClick');
  const result = await trackReferralClick({ code, metadata });
  return result.data;
}

/**
 * Record a referral conversion.
 */
export async function recordReferralConversionRemote(data) {
  const recordReferralConversion = httpsCallable(functions, 'recordReferralConversion');
  const result = await recordReferralConversion(data);
  return result.data;
}

/**
 * Get referral analytics for the current user.
 */
export async function getReferralAnalyticsRemote() {
  const getReferralAnalytics = httpsCallable(functions, 'getReferralAnalytics');
  const result = await getReferralAnalytics({});
  return result.data;
}
