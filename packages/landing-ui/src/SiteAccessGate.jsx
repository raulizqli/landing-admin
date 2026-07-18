import {
  siteAccessAllowsPublicView,
  siteAccessShowsAds,
} from '@raulizqli/landing-core/siteAccess';
import PublicityAdsBanner from './PublicityAdsBanner.jsx';
import SiteOfflineNotice from './SiteOfflineNotice.jsx';

/**
 * Wraps public landings / marketing sites with unpaid access policy.
 * Preview / mirror should pass enforce=false.
 */
export default function SiteAccessGate({
  data,
  children,
  enforce = true,
  renewUrl = import.meta.env.VITE_ADMIN_PUBLIC_URL || '',
}) {
  if (!enforce) return children;

  const access = data?.siteAccess;
  if (!siteAccessAllowsPublicView(access)) {
    return (
      <SiteOfflineNotice
        siteName={data?.name}
        renewUrl={renewUrl ? `${String(renewUrl).replace(/\/$/, '')}/` : ''}
      />
    );
  }

  return (
    <>
      {children}
      {siteAccessShowsAds(access) ? <PublicityAdsBanner /> : null}
    </>
  );
}
