import PublicityAdsBanner from '@raulizqli/landing-ui/PublicityAdsBanner';
import { useLocale } from '../i18n/LocaleContext';

/**
 * Ads / publicity bar for free-tier CMS accounts (unpaid / incomplete / past_due).
 * Shown in the admin shell so free users see platform publicity while editing.
 */
export default function AdminFreeTierAdsBanner({ onUpgrade }) {
  const { t } = useLocale();

  return (
    <PublicityAdsBanner
      placement="static"
      label={t('billing.adminAds.label')}
      message={t('billing.adminAds.message')}
      ctaLabel={t('billing.adminAds.cta')}
      onCtaClick={onUpgrade}
      className="shrink-0 shadow-sm"
    />
  );
}
