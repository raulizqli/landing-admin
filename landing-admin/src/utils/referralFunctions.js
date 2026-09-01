/**
 * Referral tracking utility functions for admin panel.
 */

import { httpsCallable } from 'firebase/functions';
import { ensureCallableSession } from './appCheck';
import { getHubAuth, getHubFunctions } from './firebaseClients';

async function withReferralSession(run) {
  await ensureCallableSession(getHubAuth());
  return run();
}

/**
 * Enable referral code for the current user's billing account.
 */
export async function enableReferralCodeRemote() {
  return withReferralSession(async () => {
    const enableReferralCode = httpsCallable(getHubFunctions(), 'enableReferralCode');
    const result = await enableReferralCode({});
    return result.data;
  });
}

/**
 * Update referral code to a custom value.
 */
export async function updateReferralCodeRemote(newCode) {
  return withReferralSession(async () => {
    const updateReferralCode = httpsCallable(getHubFunctions(), 'updateReferralCode');
    const result = await updateReferralCode({ newCode });
    return result.data;
  });
}

/**
 * Toggle referral system enabled/disabled.
 */
export async function toggleReferralEnabledRemote(enabled) {
  return withReferralSession(async () => {
    const toggleReferralEnabled = httpsCallable(getHubFunctions(), 'toggleReferralEnabled');
    const result = await toggleReferralEnabled({ enabled });
    return result.data;
  });
}

/**
 * Track a referral click.
 */
export async function trackReferralClickRemote(code, metadata = {}) {
  const trackReferralClick = httpsCallable(getHubFunctions(), 'trackReferralClick');
  const result = await trackReferralClick({ code, metadata });
  return result.data;
}

/**
 * Record a referral conversion.
 */
export async function recordReferralConversionRemote(data) {
  return withReferralSession(async () => {
    const recordReferralConversion = httpsCallable(getHubFunctions(), 'recordReferralConversion');
    const result = await recordReferralConversion(data);
    return result.data;
  });
}

/**
 * Get referral analytics for the current user.
 */
export async function getReferralAnalyticsRemote() {
  return withReferralSession(async () => {
    const getReferralAnalytics = httpsCallable(getHubFunctions(), 'getReferralAnalytics');
    const result = await getReferralAnalytics({});
    return result.data;
  });
}
