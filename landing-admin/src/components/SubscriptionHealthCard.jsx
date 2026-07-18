import { useLocale } from '../i18n/LocaleContext';

function formatPeriodEnd(value, locale) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

const STATE_STYLES = {
  ok: 'border-emerald-600/40 bg-emerald-950/50 text-emerald-200',
  trialing: 'border-sky-600/40 bg-sky-950/40 text-sky-100',
  past_due: 'border-amber-600/50 bg-amber-950/40 text-amber-100',
  canceled: 'border-rose-700/40 bg-rose-950/40 text-rose-100',
  incomplete: 'border-rose-700/40 bg-rose-950/40 text-rose-100',
  bypass: 'border-indigo-600/40 bg-indigo-950/40 text-indigo-100',
};

/**
 * Always-visible confirmation of whether the subscription is paid
 * and what free-tier means after a missed renewal.
 */
export default function SubscriptionHealthCard({
  health,
  planName,
  onOpenBilling,
  compact = false,
}) {
  const { t, locale } = useLocale();
  if (!health) return null;

  const style = STATE_STYLES[health.state] || STATE_STYLES.incomplete;
  const periodLabel = formatPeriodEnd(health.currentPeriodEnd, locale);
  const title = t(`billing.health.${health.state}.title`);
  const body = t(`billing.health.${health.state}.body`);

  return (
    <div className={`rounded-lg border px-2.5 py-2 ${style}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide">
            {health.paid || health.state === 'bypass'
              ? t('billing.health.paidBadge')
              : t('billing.health.freeTierBadge')}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold leading-snug">{title}</p>
        </div>
        {!compact && onOpenBilling && (
          <button
            type="button"
            onClick={onOpenBilling}
            className="shrink-0 rounded border border-current/30 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide opacity-90 hover:opacity-100"
          >
            {t('common.billing')}
          </button>
        )}
      </div>

      <p className="mt-1.5 text-[10px] leading-relaxed opacity-90">{body}</p>

      <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] opacity-90">
        <div>
          <dt className="uppercase tracking-wide opacity-70">{t('billing.currentPlan')}</dt>
          <dd className="font-semibold">{planName}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide opacity-70">{t('billing.pages')}</dt>
          <dd className="font-semibold">
            {health.freeTier
              ? `${health.pageCount} · ${t('billing.health.pagesKept')}`
              : health.pageLimit == null
                ? `${health.pageCount} · ${t('billing.unlimited')}`
                : `${health.pageCount} / ${health.pageLimit}`}
          </dd>
        </div>
        {periodLabel && (health.state === 'ok' || health.state === 'trialing') && (
          <div className="col-span-2">
            <dt className="uppercase tracking-wide opacity-70">{t('billing.health.nextRenewal')}</dt>
            <dd className="font-semibold">{periodLabel}</dd>
          </div>
        )}
      </dl>

      {health.freeTier && (
        <ul className="mt-2 space-y-0.5 border-t border-current/20 pt-2 text-[10px] leading-snug opacity-90">
          <li>· {t('billing.health.freeKeepPages')}</li>
          <li>· {t('billing.health.freeEditBasics')}</li>
          <li>· {t('billing.health.freeNoCreate')}</li>
          <li>· {t('billing.health.freeSitesStayUp')}</li>
        </ul>
      )}
    </div>
  );
}
