import { setGlobalOptions } from "firebase-functions";

setGlobalOptions({ maxInstances: 10 });

export { createCmsUser, deleteCmsUser } from "./cmsUsers.js";
export { triggerHostingDeploy } from "./hostingDeploy.js";
export {
  ensureBillingAccount,
  createBillingCheckout,
  setBillingPlanManual,
  stripeBillingWebhook,
  mercadoPagoBillingWebhook,
} from "./billing.js";
export {
  marketingSitemap,
  marketingRss,
  marketingRobots,
} from "./marketingSeo.js";
export {
  assertMarketingSiteAccess,
  setBillingAccountAddons,
} from "./marketingEntitlement.js";
export {
  setBillingMonetization,
  syncSiteAccessDaily,
} from "./siteAccessSync.js";
