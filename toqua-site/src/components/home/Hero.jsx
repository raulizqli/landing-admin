import { getAdminSignupUrl } from '../../content/site';
import { useLang } from '../../hooks/useLang';
import ToquaLogo from '../brand/ToquaLogo';
import Button from '../ui/Button';

export default function Hero() {
  const { lang, path, t } = useLang();
  const signupUrl = getAdminSignupUrl();
  const hero = t.home.hero;

  return (
    <section
      className="relative overflow-hidden border-b border-[var(--line)]"
      aria-labelledby="hero-heading"
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full opacity-70 glow-pulse"
        style={{ background: 'var(--q-gradient)', filter: 'blur(48px)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-16 h-[360px] w-[360px] rounded-full opacity-50 fade-in"
        style={{ background: 'var(--q-gradient)', filter: 'blur(56px)' }}
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1fr_auto] lg:px-12 lg:pb-28 lg:pt-24">
        <div>
          <div className="rise-in lg:hidden">
            <ToquaLogo variant="lockupTagline" lang={lang} size="md" priority />
          </div>
          <h1
            id="hero-heading"
            className="rise-in rise-in-delay-1 mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.12] tracking-tight text-[var(--text)] sm:text-5xl lg:mt-0 lg:text-6xl"
          >
            {hero.headline}
          </h1>
          <p className="rise-in rise-in-delay-2 mt-6 max-w-xl text-lg leading-relaxed text-[var(--mute)] sm:text-xl">
            {hero.support}
          </p>
          <div className="rise-in rise-in-delay-3 mt-10 flex flex-col gap-3 sm:flex-row">
            <Button href={signupUrl} external>
              {hero.primaryCta}
            </Button>
            <Button to={path('/pricing')} variant="secondary">
              {hero.secondaryCta}
            </Button>
          </div>
        </div>

        <div className="rise-in rise-in-delay-1 hidden justify-end lg:flex" aria-hidden="true">
          <ToquaLogo variant="stackedTaglineLong" lang={lang} size="xl" priority />
        </div>
      </div>
    </section>
  );
}
