import { useState } from 'react';
import { getAdminSignupUrl } from '../content/site';
import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import Button from '../components/ui/Button';
import { useLang } from '../hooks/useLang';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema, offerCatalogSchema } from '../utils/schema';
import { formatPlanPrice, planHasDisplayPrice } from '../utils/pricing';

export default function PricingPage() {
  const { lang, path, t } = useLang();
  const content = t.pricing;
  const signupUrl = getAdminSignupUrl();
  const [billingInterval, setBillingInterval] = useState('month');
  const meta = buildPageMeta({
    title: content.metaTitle,
    description: content.metaDescription,
    path: path('/pricing'),
    lang,
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Toqua', path: path() },
            { name: content.metaTitle, path: path('/pricing') },
          ]),
          offerCatalogSchema(content.plans, lang),
        ]}
      />
      <Section eyebrow={content.eyebrow} title={content.title} description={content.description}>
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div className="inline-flex overflow-hidden rounded-full border border-[var(--text)]/15 text-sm">
            <button
              type="button"
              onClick={() => setBillingInterval('month')}
              className={`px-4 py-1.5 ${billingInterval === 'month' ? 'bg-[var(--text-purple)] text-white' : 'bg-[var(--surface)] text-[var(--text)]'}`}
            >
              {content.intervalMonth}
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval('year')}
              className={`px-4 py-1.5 ${billingInterval === 'year' ? 'bg-[var(--text-purple)] text-white' : 'bg-[var(--surface)] text-[var(--text)]'}`}
            >
              {content.intervalYear}
            </button>
          </div>
          {billingInterval === 'year' && (
            <p className="text-sm font-semibold text-[var(--text-purple)]">{content.annualSave}</p>
          )}
        </div>
        <p className="mb-8 text-sm text-[var(--mute)]">
          {billingInterval === 'year' ? content.currencyNoteYear : content.currencyNote}
        </p>
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {content.plans.map((plan) => (
            <article
              key={plan.id}
              className={[
                'flex flex-col rounded-2xl p-6',
                plan.featured
                  ? 'bg-[var(--text-purple)] text-white shadow-lg shadow-[var(--text-purple)]/20'
                  : 'surface',
              ].join(' ')}
            >
              <p className={`text-sm font-semibold ${plan.featured ? 'text-white/80' : 'text-[var(--text-purple)]'}`}>
                {plan.name}
              </p>
              {planHasDisplayPrice(plan) ? (
                (() => {
                  const price = formatPlanPrice(plan, lang, billingInterval);
                  return (
                    <>
                      <p className="mt-3 font-display text-3xl font-semibold">
                        {price.main}
                        {price.period ? (
                          <span
                            className={`text-lg font-sans font-medium ${plan.featured ? 'text-white/70' : 'text-[var(--mute)]'}`}
                          >
                            {' '}
                            {price.period}
                          </span>
                        ) : null}
                      </p>
                      {billingInterval === 'year' ? (
                        <p className={`mt-1 text-xs font-semibold ${plan.featured ? 'text-white/80' : 'text-[var(--text-purple)]'}`}>
                          {content.annualSave}
                        </p>
                      ) : null}
                    </>
                  );
                })()
              ) : (
                <p className="mt-3 font-display text-3xl font-semibold">{plan.priceLabel}</p>
              )}
              <p className={`mt-4 text-sm leading-relaxed ${plan.featured ? 'text-white/90' : 'text-[var(--mute)]'}`}>
                {plan.blurb}
              </p>
              <ul className={`mt-5 space-y-2 text-sm ${plan.featured ? 'text-white/90' : 'text-[var(--mute)]'}`}>
                {plan.highlights.map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                {plan.id === 'enterprise' ? (
                  <Button
                    to={path('/contact')}
                    className="w-full"
                    variant={plan.featured ? 'primary' : 'secondary'}
                  >
                    {plan.cta}
                  </Button>
                ) : (
                  <Button
                    href={signupUrl}
                    external
                    className="w-full"
                    variant={plan.featured ? 'inverse' : 'secondary'}
                  >
                    {plan.cta}
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
        <div className="mt-14 max-w-2xl">
          <h3 className="font-display text-2xl font-semibold text-[var(--text)]">{content.compareTitle}</h3>
          <p className="mt-3 text-[var(--mute)]">{content.compareText}</p>
          <Button to={path('/compare')} variant="secondary" className="mt-6">
            {content.compareCta}
          </Button>
        </div>
      </Section>
    </>
  );
}
