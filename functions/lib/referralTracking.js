const { onCall } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const { callableOptions } = require('./callableOptions');

const {
  generateReferralCode,
  isValidReferralCode,
  normalizeReferralCode,
  normalizeReferralConfig,
  createEmptyReferralStats,
} = require('@raulizqli/landing-core/referralTracking');

/**
 * Enable referrals for a billing account.
 * Generates a unique referral code.
 */
exports.enableReferralCode = onCall(callableOptions, async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new Error('Unauthorized');
  }

  const uid = auth.uid;
  const db = admin.firestore();

  try {
    // Find the user's billing account
    const accountsSnapshot = await db
      .collection('billingAccounts')
      .where('ownerUid', '==', uid)
      .limit(1)
      .get();

    if (accountsSnapshot.empty) {
      throw new Error('No billing account found');
    }

    const accountDoc = accountsSnapshot.docs[0];
    const accountId = accountDoc.id;
    const accountData = accountDoc.data();

    // Check if already has a code
    if (accountData.referralConfig?.code) {
      return {
        success: true,
        referralConfig: normalizeReferralConfig(accountData.referralConfig),
      };
    }

    // Generate a unique code
    let code = '';
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      code = generateReferralCode();
      
      // Check if code is already in use
      const existingCode = await db
        .collection('referralCodes')
        .doc(code)
        .get();

      if (!existingCode.exists) {
        break;
      }
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Could not generate unique referral code. Please try again.');
    }

    // Create referral config
    const referralConfig = {
      enabled: true,
      code,
      customSlug: '',
      stats: createEmptyReferralStats(),
    };

    // Update billing account
    await accountDoc.ref.update({
      referralConfig,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create referral code document for lookups
    await db.collection('referralCodes').doc(code).set({
      accountId,
      ownerUid: uid,
      ownerEmail: auth.token.email || '',
      code,
      enabled: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('Referral code enabled', { uid, accountId, code });

    return {
      success: true,
      referralConfig: normalizeReferralConfig(referralConfig),
    };
  } catch (error) {
    logger.error('Error enabling referral code', { uid, error: error.message });
    throw new Error(`Failed to enable referral code: ${error.message}`);
  }
});

/**
 * Update referral code for a billing account.
 */
exports.updateReferralCode = onCall(callableOptions, async (request) => {
  const { auth, data } = request;
  if (!auth) {
    throw new Error('Unauthorized');
  }

  const { newCode } = data || {};
  const uid = auth.uid;
  const db = admin.firestore();

  if (!newCode) {
    throw new Error('New code is required');
  }

  const normalized = normalizeReferralCode(newCode);
  if (!isValidReferralCode(normalized)) {
    throw new Error('Invalid referral code format');
  }

  try {
    // Find the user's billing account
    const accountsSnapshot = await db
      .collection('billingAccounts')
      .where('ownerUid', '==', uid)
      .limit(1)
      .get();

    if (accountsSnapshot.empty) {
      throw new Error('No billing account found');
    }

    const accountDoc = accountsSnapshot.docs[0];
    const accountId = accountDoc.id;
    const accountData = accountDoc.data();
    const oldCode = accountData.referralConfig?.code;

    // Check if new code is available
    const existingCode = await db.collection('referralCodes').doc(normalized).get();

    if (existingCode.exists && existingCode.data().accountId !== accountId) {
      throw new Error('Referral code is already in use');
    }

    // Update billing account
    const updatedConfig = {
      ...normalizeReferralConfig(accountData.referralConfig),
      code: normalized,
    };

    await accountDoc.ref.update({
      referralConfig: updatedConfig,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Delete old code document if exists
    if (oldCode && oldCode !== normalized) {
      await db.collection('referralCodes').doc(oldCode).delete();
    }

    // Create/update new code document
    await db.collection('referralCodes').doc(normalized).set({
      accountId,
      ownerUid: uid,
      ownerEmail: auth.token.email || '',
      code: normalized,
      enabled: updatedConfig.enabled,
      createdAt: existingCode.exists
        ? existingCode.data().createdAt
        : admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('Referral code updated', { uid, accountId, oldCode, newCode: normalized });

    return {
      success: true,
      referralConfig: normalizeReferralConfig(updatedConfig),
    };
  } catch (error) {
    logger.error('Error updating referral code', { uid, error: error.message });
    throw new Error(`Failed to update referral code: ${error.message}`);
  }
});

/**
 * Toggle referral system enabled/disabled.
 */
exports.toggleReferralEnabled = onCall(callableOptions, async (request) => {
  const { auth, data } = request;
  if (!auth) {
    throw new Error('Unauthorized');
  }

  const { enabled } = data || {};
  const uid = auth.uid;
  const db = admin.firestore();

  try {
    const accountsSnapshot = await db
      .collection('billingAccounts')
      .where('ownerUid', '==', uid)
      .limit(1)
      .get();

    if (accountsSnapshot.empty) {
      throw new Error('No billing account found');
    }

    const accountDoc = accountsSnapshot.docs[0];
    const accountData = accountDoc.data();

    if (!accountData.referralConfig?.code) {
      throw new Error('No referral code configured');
    }

    const updatedConfig = {
      ...normalizeReferralConfig(accountData.referralConfig),
      enabled: enabled === true,
    };

    await accountDoc.ref.update({
      referralConfig: updatedConfig,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update referral code document
    await db.collection('referralCodes').doc(updatedConfig.code).update({
      enabled: enabled === true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('Referral enabled toggled', { uid, enabled });

    return {
      success: true,
      referralConfig: normalizeReferralConfig(updatedConfig),
    };
  } catch (error) {
    logger.error('Error toggling referral', { uid, error: error.message });
    throw new Error(`Failed to toggle referral: ${error.message}`);
  }
});

/**
 * Track a referral click (when someone uses a referral link).
 */
exports.trackReferralClick = onCall(callableOptions, async (request) => {
  const { data } = request;
  const { code, metadata } = data || {};
  const db = admin.firestore();

  if (!code) {
    throw new Error('Referral code is required');
  }

  const normalized = normalizeReferralCode(code);

  try {
    // Look up referral code
    const codeDoc = await db.collection('referralCodes').doc(normalized).get();

    if (!codeDoc.exists || !codeDoc.data().enabled) {
      return { success: false, message: 'Invalid or inactive referral code' };
    }

    const codeData = codeDoc.data();
    const accountId = codeData.accountId;

    // Create click tracking record
    const clickId = db.collection('referralClicks').doc().id;
    await db.collection('referralClicks').doc(clickId).set({
      id: clickId,
      referralCode: normalized,
      referrerId: codeData.ownerUid,
      accountId,
      metadata: metadata || {},
      clickedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update stats
    const accountDoc = await db.collection('billingAccounts').doc(accountId).get();
    if (accountDoc.exists) {
      const accountData = accountDoc.data();
      const stats = accountData.referralConfig?.stats || createEmptyReferralStats();

      await accountDoc.ref.update({
        'referralConfig.stats.totalClicks': (stats.totalClicks || 0) + 1,
        'referralConfig.stats.lastUsedAt': admin.firestore.FieldValue.serverTimestamp(),
        'referralConfig.stats.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    logger.info('Referral click tracked', { code: normalized, accountId, clickId });

    return { success: true, clickId };
  } catch (error) {
    logger.error('Error tracking referral click', { code, error: error.message });
    throw new Error(`Failed to track click: ${error.message}`);
  }
});

/**
 * Record a referral conversion when a referred user subscribes.
 * Called during billing account creation/subscription.
 */
exports.recordReferralConversion = onCall(callableOptions, async (request) => {
  const { auth, data } = request;
  
  const { referredByCode, newAccountId, planId, revenue, currency } = data || {};
  const db = admin.firestore();

  if (!referredByCode || !newAccountId) {
    return { success: false, message: 'Missing required fields' };
  }

  const normalized = normalizeReferralCode(referredByCode);

  try {
    // Look up referral code
    const codeDoc = await db.collection('referralCodes').doc(normalized).get();

    if (!codeDoc.exists) {
      return { success: false, message: 'Invalid referral code' };
    }

    const codeData = codeDoc.data();
    const referrerAccountId = codeData.accountId;

    // Create conversion record
    const conversionId = db.collection('referralConversions').doc().id;
    await db.collection('referralConversions').doc(conversionId).set({
      id: conversionId,
      referrerCode: normalized,
      referrerId: codeData.ownerUid,
      referrerAccountId,
      referredAccountId: newAccountId,
      referredUserId: auth?.uid || '',
      referredEmail: auth?.token?.email || '',
      status: 'converted',
      planId: planId || '',
      revenue: Number(revenue) || 0,
      currency: String(currency || 'usd').toLowerCase(),
      signedUpAt: admin.firestore.FieldValue.serverTimestamp(),
      convertedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update referrer account stats
    const referrerAccountDoc = await db.collection('billingAccounts').doc(referrerAccountId).get();
    if (referrerAccountDoc.exists) {
      const accountData = referrerAccountDoc.data();
      const stats = accountData.referralConfig?.stats || createEmptyReferralStats();

      await referrerAccountDoc.ref.update({
        'referralConfig.stats.totalSignups': (stats.totalSignups || 0) + 1,
        'referralConfig.stats.totalPaidConversions': (stats.totalPaidConversions || 0) + 1,
        'referralConfig.stats.totalRevenue': (stats.totalRevenue || 0) + (Number(revenue) || 0),
        'referralConfig.stats.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Update referred account with referral info
    await db.collection('billingAccounts').doc(newAccountId).update({
      referredByCode: normalized,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('Referral conversion recorded', {
      referralCode: normalized,
      referrerAccountId,
      newAccountId,
      conversionId,
    });

    return { success: true, conversionId };
  } catch (error) {
    logger.error('Error recording referral conversion', { code: referredByCode, error: error.message });
    throw new Error(`Failed to record conversion: ${error.message}`);
  }
});

/**
 * Get referral analytics for the current user.
 */
exports.getReferralAnalytics = onCall(callableOptions, async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new Error('Unauthorized');
  }

  const uid = auth.uid;
  const db = admin.firestore();

  try {
    // Find the user's billing account
    const accountsSnapshot = await db
      .collection('billingAccounts')
      .where('ownerUid', '==', uid)
      .limit(1)
      .get();

    if (accountsSnapshot.empty) {
      throw new Error('No billing account found');
    }

    const accountDoc = accountsSnapshot.docs[0];
    const accountId = accountDoc.id;
    const accountData = accountDoc.data();
    const referralConfig = normalizeReferralConfig(accountData.referralConfig);

    if (!referralConfig.code) {
      return {
        success: true,
        hasReferralCode: false,
        referralConfig: null,
        conversions: [],
      };
    }

    // Get recent conversions
    const conversionsSnapshot = await db
      .collection('referralConversions')
      .where('referrerAccountId', '==', accountId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const conversions = conversionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      hasReferralCode: true,
      referralConfig,
      conversions,
    };
  } catch (error) {
    logger.error('Error fetching referral analytics', { uid, error: error.message });
    throw new Error(`Failed to fetch analytics: ${error.message}`);
  }
});
