import { CTA, SITE, SPECIALIZATIONS, STATS } from '../../content/site';
import Button from '../ui/Button';

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--color-line)]">
      <div className="pointer-events-none absolute inset-0 grid-noise" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,255,178,0.16),transparent_55%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-12 lg:pb-24 lg:pt-20">
        <div>
          <p className="rise-in text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
            {SITE.brand}
          </p>
          <h1 className="rise-in rise-in-delay-1 mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            <span className="block text-[var(--color-mist)]">{SITE.name}</span>
            <span className="mt-3 block text-gradient text-3xl sm:text-4xl lg:text-5xl">
              AI-powered software that scales with your business
            </span>
          </h1>
          <p className="rise-in rise-in-delay-2 mt-6 max-w-xl text-base leading-relaxed text-[var(--color-mute)] sm:text-lg">
            {SITE.tagline} We partner with operators and product teams who need agents, RAG,
            automations, and custom applications—not generic agency slides.
          </p>
          <div className="rise-in rise-in-delay-3 mt-8 flex flex-col gap-3 sm:flex-row">
            <Button to={CTA.primary.href}>{CTA.primary.label}</Button>
            <Button to={CTA.secondary.href} variant="secondary">
              {CTA.secondary.label}
            </Button>
          </div>
          <ul className="mt-10 flex flex-wrap gap-2" aria-label="Specializations">
            {SPECIALIZATIONS.map((item) => (
              <li
                key={item}
                className="rounded-full border border-[var(--color-line)] bg-[rgba(18,26,23,0.55)] px-3 py-1 text-xs text-[var(--color-mute)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <aside className="rise-in rise-in-delay-2 self-end">
          <div className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--color-accent)]/15 blur-2xl" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Why teams hire us
            </p>
            <p className="mt-4 font-display text-2xl font-semibold leading-snug">
              From discovery to production systems with measurable ROI.
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-ink)]/70 p-4">
                  <dt className="text-xs text-[var(--color-mute)]">{stat.label}</dt>
                  <dd className="mt-2 font-display text-2xl font-bold text-[var(--color-mist)]">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
}
