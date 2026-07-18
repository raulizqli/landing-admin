import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  accountHasFeature,
  canAccountCreatePage,
  getAccountPageLimit,
  getBillingPlan,
  getSubscriptionHealth,
  isBillingAccountActive,
} from '../utils/billingPlans';
import { isBillingBypass } from '../utils/permissions';

/**
 * Plan entitlements for the signed-in user.
 * Root always bypasses (unlimited ops access).
 */
export function useEntitlements() {
  const { profile, billingAccount } = useAuth();

  return useMemo(() => {
    const bypass = isBillingBypass(profile);
    const plan = getBillingPlan(billingAccount?.plan);
    const active = bypass || isBillingAccountActive(billingAccount);
    const pageLimit = getAccountPageLimit(billingAccount, { bypass });
    const pageCount = Array.isArray(billingAccount?.pageIds)
      ? billingAccount.pageIds.length
      : 0;
    const health = getSubscriptionHealth(billingAccount, { bypass });

    const has = (featureKey) => accountHasFeature(billingAccount, featureKey, { bypass });

    return {
      bypass,
      account: billingAccount,
      plan,
      planId: plan.id,
      active,
      pageLimit,
      pageCount,
      health,
      paid: health.paid,
      freeTier: health.freeTier,
      has,
      canCreateMorePages: canAccountCreatePage(billingAccount, pageCount, { bypass }),
      canUseBlog: has('blog'),
      canUseCustomEmbeds: has('customEmbeds'),
      canUseGalleryPortfolio: has('galleryPortfolio'),
      canUseExternalFirebase: has('externalFirebase'),
      canUseHostingDeploy: has('hostingDeploy'),
      canUseServicesCarouselAutoplay: has('servicesCarouselAutoplay'),
      canUseContactMapBeside: has('contactMapBeside'),
      canUseMarketingSite: has('marketingSite'),
      hasSupport247: has('support247'),
    };
  }, [profile, billingAccount]);
}
