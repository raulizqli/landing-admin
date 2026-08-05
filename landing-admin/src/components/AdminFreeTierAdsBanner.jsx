import PublicityAdsBanner from '@raulizqli/landing-ui/PublicityAdsBanner';
import { useLocale } from '../i18n/LocaleContext';

/**
 * Ads / publicity bar for free-tier CMS accounts (unpaid / incomplete / past_due).
 * Full-width ad strip; upgrade message is a collapsible tab over the ad.
 */
export default function AdminFreeTierAdsBanner({ onUpgrade }) {
  const { t } = useLocale();

  return (
    <PublicityAdsBanner
      placement="static"
      layout="fullBleed"
      label={t('billing.adminAds.label')}
      message={t('billing.adminAds.message')}
      ctaLabel={t('billing.adminAds.cta')}
      tabLabel={t('billing.adminAds.tab')}
      onCtaClick={onUpgrade}
      defaultChromeOpen={false}
      className="shrink-0 shadow-sm"
    />
  );
}
