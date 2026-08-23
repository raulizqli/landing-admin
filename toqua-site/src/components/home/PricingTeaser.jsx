import { useLang } from '../../hooks/useLang';
import Section from '../ui/Section';
import Button from '../ui/Button';
import { formatPlanPrice, planHasDisplayPrice } from '../../utils/pricing';

export default function PricingTeaser() {
  const { lang, path, t } = useLang();
  const block = t.home.pricingTeaser;
  const plans = t.pricing.plans.filter((p) => planHasDisplayPrice(p)).slice(0, 3);

  return (
    <Section eyebrow={block.eyebrow} title={block.title} description={block.description}>
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const price = formatPlanPrice(plan, lang);
          return (
          <div
            key={plan.id}
            className={[
              'rounded-2xl p-6',
              plan.featured
                ? 'bg-[var(--text-purple)] text-white shadow-lg shadow-[var(--text-purple)]/15'
                : 'surface',
            ].join(' ')}
          >
            <p className={`text-sm font-semibold ${plan.featured ? 'text-white/80' : 'text-[var(--text-purple)]'}`}>
              {plan.name}
            </p>
            <p className="mt-3 font-display text-3xl font-semibold">
              {price.main}
              {price.period ? (
                <span className={`text-base font-sans font-medium ${plan.featured ? 'text-white/70' : 'text-[var(--mute)]'}`}>
                  {' '}
                  {price.period}
                </span>
              ) : null}
            </p>
            <p className={`mt-4 text-sm leading-relaxed ${plan.featured ? 'text-white/90' : 'text-[var(--mute)]'}`}>
              {plan.blurb}
            </p>
          </div>
          );
        })}
      </div>
      <div className="mt-10">
        <Button to={path('/pricing')}>{block.cta}</Button>
      </div>
    </Section>
  );
}
