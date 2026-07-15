import { useEffect, useState } from 'react';
import {
  createBillingCheckout,
  ensureBillingAccountRemote,
  setBillingPlanManual,
} from '../utils/billingFunctions';
import {
  getBillingPlan,
  listBillingPlansForDisplay,
} from '../utils/billingPlans';
import { useAuth } from '../contexts/AuthContext';
import { useLocale, LanguageSwitcher } from '../i18n/LocaleContext';
import { isBillingBypass, canManageUsers } from '../utils/permissions';

function PlanPrice({ plan, currency, t }) {
  if (plan.id === 'enterprise' || plan.monthlyPriceUsd == null) {
    return (
      <p className="text-2xl font-serif text-[#2A342D]">
        {t('billing.custom')}
      </p>
    );
  }
  const amount = currency === 'mxn' ? plan.monthlyPriceMxn : plan.monthlyPriceUsd;
  const symbol = currency === 'mxn' ? 'MX$' : 'US$';
  return (
    <p className="text-2xl font-serif text-[#2A342D]">
      {symbol}{amount}
      <span className="text-sm font-sans text-[#2A342D]/50">{t('billing.perMonth')}</span>
    </p>
  );
}

export default function BillingPlansPanel({ open, onClose }) {
  const { t, locale } = useLocale();
  const { profile, billingAccount, refreshBillingAccount, user } = useAuth();
  const [currency, setCurrency] = useState('usd');
  const [busyKey, setBusyKey] = useState('');
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');
  const bypass = isBillingBypass(profile);
  const plans = listBillingPlansForDisplay();
  const currentPlan = getBillingPlan(billingAccount?.plan);

  useEffect(() => {
    if (!open) return;
    const params = new URLSearchParams(window.location.search);
    const billing = params.get('billing');
    if (billing === 'success') {
      setBanner(t('billing.successBanner'));
      refreshBillingAccount?.();
    } else if (billing === 'cancel') {
      setBanner(t('billing.cancelBanner'));
    }
    if (billing) {
      params.delete('billing');
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', next);
    }
  }, [open, t, refreshBillingAccount]);

  useEffect(() => {
    if (!open || bypass || billingAccount) return;
    ensureBillingAccountRemote()
      .then(() => refreshBillingAccount?.())
      .catch(() => {});
  }, [open, bypass, billingAccount, refreshBillingAccount]);

  if (!open) return null;

  const startCheckout = async (planId, provider) => {
    setError('');
    setBusyKey(`${planId}:${provider}`);
    try {
      const data = await createBillingCheckout({
        planId,
        provider,
        locale,
        currency,
      });
      if (data?.url) {
        window.location.assign(data.url);
        return;
      }
      setError(t('billing.checkoutError'));
    } catch (err) {
      setError(err?.message || t('billing.checkoutError'));
    } finally {
      setBusyKey('');
    }
  };

  const activateEnterpriseManual = async () => {
    if (!canManageUsers(profile) || !billingAccount?.id) return;
    setBusyKey('enterprise:manual');
    setError('');
    try {
      await setBillingPlanManual({
        accountId: billingAccount.id,
        planId: 'enterprise',
        status: 'active',
      });
      await refreshBillingAccount?.();
    } catch (err) {
      setError(err?.message || t('billing.checkoutError'));
    } finally {
      setBusyKey('');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div className="w-full max-w-5xl bg-[#F4F1EA] rounded-2xl shadow-2xl border border-[#2A342D]/10 my-4">
        <div className="flex flex-wrap items-start justify-between gap-3 px-6 py-5 border-b border-[#2A342D]/10">
          <div>
            <h2 className="font-serif text-2xl text-[#2A342D]">{t('billing.title')}</h2>
            <p className="text-sm text-[#2A342D]/60 mt-1 max-w-xl">{t('billing.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher className="text-[#2A342D]" />
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-3 py-1.5 rounded-lg border border-[#2A342D]/20 text-[#2A342D] hover:bg-white"
            >
              ×
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {banner && (
            <p className="text-sm rounded-lg bg-[#4A5D4E]/10 text-[#2A342D] px-3 py-2">{banner}</p>
          )}
          {error && (
            <p className="text-sm rounded-lg bg-red-50 text-red-700 border border-red-100 px-3 py-2">{error}</p>
          )}

          {bypass ? (
            <p className="text-sm text-[#4A5D4E] font-medium">{t('billing.rootBypass')}</p>
          ) : (
            <div className="grid sm:grid-cols-4 gap-3 text-sm bg-white/70 rounded-xl border border-[#2A342D]/10 p-4">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[#2A342D]/45">{t('billing.currentPlan')}</p>
                <p className="font-semibold text-[#2A342D]">{t(`billing.plans.${currentPlan.id}.name`)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[#2A342D]/45">{t('billing.status')}</p>
                <p className="font-semibold text-[#2A342D]">
                  {t(`billing.statuses.${billingAccount?.status || 'incomplete'}`)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[#2A342D]/45">{t('billing.pages')}</p>
                <p className="font-semibold text-[#2A342D]">
                  {currentPlan.features.unlimitedPages
                    ? t('billing.unlimited')
                    : `${billingAccount?.pageIds?.length ?? 0} / ${currentPlan.pageLimit}`}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[#2A342D]/45">{t('billing.provider')}</p>
                <p className="font-semibold text-[#2A342D] capitalize">
                  {billingAccount?.provider || '—'}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] uppercase tracking-wide text-[#2A342D]/45">{t('common.plan')}</span>
            <div className="inline-flex rounded-lg border border-[#2A342D]/15 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setCurrency('usd')}
                className={`px-3 py-1.5 ${currency === 'usd' ? 'bg-[#4A5D4E] text-white' : 'bg-white text-[#2A342D]'}`}
              >
                USD
              </button>
              <button
                type="button"
                onClick={() => setCurrency('mxn')}
                className={`px-3 py-1.5 ${currency === 'mxn' ? 'bg-[#4A5D4E] text-white' : 'bg-white text-[#2A342D]'}`}
              >
                MXN
              </button>
            </div>
            {!bypass && billingAccount?.status !== 'active' && billingAccount?.status !== 'trialing' && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                {t('billing.inactiveHint')}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const isCurrent = !bypass && currentPlan.id === plan.id && (billingAccount?.status === 'active' || billingAccount?.status === 'trialing');
              const isRecommended = plan.id === 'pro';
              return (
                <article
                  key={plan.id}
                  className={`rounded-2xl border bg-white p-5 flex flex-col gap-3 ${
                    isRecommended ? 'border-[#4A5D4E] shadow-md ring-1 ring-[#4A5D4E]/20' : 'border-[#2A342D]/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-xl text-[#2A342D]">{t(`billing.plans.${plan.id}.name`)}</h3>
                      <p className="text-xs text-[#2A342D]/55 mt-1">{t(`billing.plans.${plan.id}.tagline`)}</p>
                    </div>
                    {isRecommended && (
                      <span className="text-[9px] uppercase tracking-wide font-bold text-[#4A5D4E] bg-[#4A5D4E]/10 px-2 py-1 rounded">
                        {t('billing.recommended')}
                      </span>
                    )}
                  </div>
                  <PlanPrice plan={plan} currency={currency} t={t} />
                  <ul className="text-xs text-[#2A342D]/75 space-y-1.5 flex-1">
                    <li>· {t(`billing.plans.${plan.id}.f1`)}</li>
                    <li>· {t(`billing.plans.${plan.id}.f2`)}</li>
                    <li>· {t(`billing.plans.${plan.id}.f3`)}</li>
                    <li>· {t(`billing.plans.${plan.id}.f4`)}</li>
                  </ul>

                  {plan.id === 'enterprise' ? (
                    <div className="space-y-2">
                      <p className="text-[11px] text-[#2A342D]/60">{t('billing.enterpriseCta')}</p>
                      <a
                        href={`mailto:${import.meta.env.VITE_BILLING_SALES_EMAIL || 'sales@example.com'}?subject=Enterprise%20plan&body=${encodeURIComponent(user?.email || '')}`}
                        className="block text-center text-sm font-semibold rounded-lg bg-[#2A342D] text-white py-2 hover:bg-[#1f2822]"
                      >
                        {t('common.contactSales')}
                      </a>
                      {canManageUsers(profile) && (
                        <button
                          type="button"
                          disabled={Boolean(busyKey)}
                          onClick={activateEnterpriseManual}
                          className="w-full text-xs font-semibold rounded-lg border border-[#2A342D]/20 py-2 text-[#2A342D] hover:bg-[#F4F1EA] disabled:opacity-50"
                        >
                          {busyKey === 'enterprise:manual' ? t('common.loading') : t('billing.manualNote')}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {isCurrent ? (
                        <p className="text-center text-xs font-semibold text-[#4A5D4E] py-2">
                          {t('billing.currentPlan')}
                        </p>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={Boolean(busyKey) || bypass}
                            onClick={() => startCheckout(plan.id, 'stripe')}
                            className="w-full text-sm font-semibold rounded-lg bg-[#4A5D4E] text-white py-2 hover:bg-[#3d4d41] disabled:opacity-50"
                          >
                            {busyKey === `${plan.id}:stripe` ? t('common.loading') : t('billing.payWithStripe')}
                          </button>
                          <button
                            type="button"
                            disabled={Boolean(busyKey) || bypass}
                            onClick={() => startCheckout(plan.id, 'mercadopago')}
                            className="w-full text-sm font-semibold rounded-lg border border-[#2A342D]/20 text-[#2A342D] py-2 hover:bg-[#F4F1EA] disabled:opacity-50"
                          >
                            {busyKey === `${plan.id}:mercadopago` ? t('common.loading') : t('billing.payWithMercadoPago')}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
