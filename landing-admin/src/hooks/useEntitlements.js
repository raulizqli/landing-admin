import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  accountHasFeature,
  canAccountCreatePage,
  canOwnerSelfServeCreatePage,
  getAccountPageCount,
  getAccountPageLimit,
  getAccountLocationLimit,
  getAccountQrCodeLimit,
  getAiMonthlyQuota,
  getBillingPlan,
  getSubscriptionHealth,
  isBillingAccountActive,
  pageIdsFromUserProfile,
  resolveAccountPageIds,
} from '../utils/billingPlans';
import { resolveAiAssistLane } from '../utils/aiAssist';
import { isBillingAccountOwner, isBillingBypass } from '../utils/permissions';

/**
 * Plan entitlements for the signed-in user.
 * Root always bypasses (unlimited ops access).
 */
export function useEntitlements() {
  const { profile, billingAccount, user } = useAuth();

  return useMemo(() => {
    const bypass = isBillingBypass(profile);
    const plan = getBillingPlan(billingAccount?.plan);
    const active = bypass || isBillingAccountActive(billingAccount);
    const pageLimit = getAccountPageLimit(billingAccount, { bypass });
    const profilePageIds = pageIdsFromUserProfile(profile);
    const pageIds = resolveAccountPageIds(billingAccount, profilePageIds);
    const pageCount = getAccountPageCount(billingAccount, { extraPageIds: profilePageIds, bypass });
    const health = getSubscriptionHealth(billingAccount, { bypass, extraPageIds: profilePageIds });
    const isOwner = isBillingAccountOwner(profile, user?.uid);

    const has = (featureKey) => accountHasFeature(billingAccount, featureKey, { bypass });
    const aiLane = resolveAiAssistLane(billingAccount, { bypass });

    return {
      bypass,
      account: billingAccount,
      plan,
      planId: plan.id,
      active,
      pageLimit,
      pageCount,
      pageIds,
      locationLimit: getAccountLocationLimit(billingAccount, { bypass }),
      qrCodeLimit: getAccountQrCodeLimit(billingAccount, { bypass }),
      health,
      paid: health.paid,
      freeTier: health.freeTier,
      isOwner,
      has,
      canCreateMorePages: canAccountCreatePage(billingAccount, pageCount, { bypass }),
      canOwnerCreatePages: canOwnerSelfServeCreatePage(billingAccount, pageCount, {
        isOwner,
        bypass,
      }),
      canUseBlog: has('blog'),
      canUseCustomEmbeds: has('customEmbeds'),
      canUseGalleryPortfolio: has('galleryPortfolio'),
      canUseExternalFirebase: has('externalFirebase'),
      canUseHostingDeploy: has('hostingDeploy'),
      canUseServicesCarouselAutoplay: has('servicesCarouselAutoplay'),
      canUseCustomSectionVisualStyle: has('customSectionVisualStyle'),
      canUseContactMapBeside: has('contactMapBeside'),
      canUseMarketingSite: has('marketingSite'),
      canUseQrCodes: has('qrCodes'),
      canUseMetaImport: has('metaImport'),
      hasSupport247: has('support247'),
      aiLane,
      canUseAiAssistLite: aiLane === 'lite' || aiLane === 'full',
      canUseAiAssist: aiLane === 'full',
      canUseAiByok: has('aiByok'),
      aiMonthlyQuota: getAiMonthlyQuota(billingAccount, aiLane === 'full' ? 'full' : 'lite', { bypass }),
    };
  }, [profile, billingAccount, user?.uid]);
}
