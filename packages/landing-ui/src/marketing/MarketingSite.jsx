import { useMemo, useState } from 'react';
import {
  findMarketingRouteByPath,
  isMarketingSite,
  listEnabledMarketingNav,
  normalizeMarketingRoutes,
} from '@raulizqli/landing-core/marketingSite';

function CtaLink({ cta, className = '', interactive = true }) {
  if (!cta?.label) return null;
  const href = cta.href || '/contact';
  const classes = [
    'inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition',
    className,
  ].join(' ');

  if (!interactive) {
    return <span className={classes}>{cta.label}</span>;
  }

  if (cta.external || /^https?:\/\//.test(href) || href.startsWith('mailto:')) {
    return (
      <a
        href={href}
        className={classes}
        target={cta.external ? '_blank' : undefined}
        rel={cta.external ? 'noopener noreferrer' : undefined}
      >
        {cta.label}
      </a>
    );
  }

  return <a href={href} className={classes}>{cta.label}</a>;
}

function StickyCta({ marketing, interactive }) {
  if (marketing.stickyCtaEnabled === false) return null;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:px-6"
      role="region"
      aria-label="Sticky call to action"
    >
      <div className="pointer-events-auto mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#121A17]/92 px-4 py-3 backdrop-blur-xl sm:flex-row sm:px-5">
        <p className="text-center text-sm text-[#F4F7F5] sm:text-left">
          Ready to scope your next AI-powered product?
        </p>
        <div className="flex w-full gap-2 sm:w-auto">
          <CtaLink
            cta={marketing.primaryCta}
            interactive={interactive}
            className="flex-1 bg-[#7CFFB2] text-[#070B0A] sm:flex-none"
          />
          <CtaLink
            cta={{ label: 'Estimate', href: '/estimate' }}
            interactive={interactive}
            className="flex-1 border border-white/15 text-white sm:flex-none"
          />
        </div>
      </div>
    </div>
  );
}

function FloatingContact({ site, marketing, interactive }) {
  if (marketing.floatingContactEnabled === false) return null;
  const email = site.email;
  return (
    <div
      className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2 sm:right-6"
      role="complementary"
      aria-label="Quick contact"
    >
      {email && (
        interactive ? (
          <a
            href={`mailto:${email}`}
            className="rounded-full border border-white/10 bg-[#121A17]/9 px-4 py-2 text-xs font-semibold text-[#F4F7F5] backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7CFFB2]"
          >
            Email us
          </a>
        ) : (
          <span className="rounded-full border border-white/10 bg-[#121A17]/9 px-4 py-2 text-xs font-semibold text-[#F4F7F5]">
            Email us
          </span>
        )
      )}
      <CtaLink
        cta={{ label: 'Talk', href: '/contact' }}
        interactive={interactive}
        className="h-14 w-14 rounded-full bg-[#7CFFB2] p-0 text-sm font-bold text-[#070B0A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      />
    </div>
  );
}

function MarketingChrome({ site, children, interactive = true, activePath = '/' }) {
  const marketing = site.marketing || {};
  const nav = listEnabledMarketingNav(site.marketingRoutes);
  const name = site.name || 'Marketing Site';
  const linkFocus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7CFFB2]';

  return (
    <div className="marketing-site min-h-full bg-[#070B0A] pb-28 text-[#F4F7F5] font-sans">
      <style>{`
        .marketing-site a:focus-visible,
        .marketing-site button:focus-visible,
        .marketing-site summary:focus-visible,
        .marketing-site input:focus-visible {
          outline: 2px solid #7CFFB2;
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .marketing-site *,
          .marketing-site *::before,
          .marketing-site *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
      {interactive && (
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#7CFFB2] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#070B0A]"
        >
          Skip to content
        </a>
      )}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070B0A]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <a
            href={interactive ? '/' : undefined}
            className={`min-w-0 ${linkFocus}`}
            onClick={interactive ? undefined : (e) => e.preventDefault()}
            aria-label={`${name} home`}
          >
            <p className="truncate text-lg font-bold tracking-tight">{name}</p>
            <p className="truncate text-[10px] uppercase tracking-[0.18em] text-[#7CFFB2]">
              {site.specialty || 'Marketing Site'}
            </p>
          </a>
          <nav className="hidden items-center gap-4 lg:flex" aria-label="Primary">
            {nav.map((item) => (
              <a
                key={item.to}
                href={interactive ? item.to : undefined}
                className={`text-sm ${linkFocus} ${item.to === activePath ? 'text-[#7CFFB2]' : 'text-[#A8B5AE] hover:text-white'}`}
                aria-current={item.to === activePath ? 'page' : undefined}
                onClick={interactive ? undefined : (event) => event.preventDefault()}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <details className="relative lg:hidden">
            <summary className={`cursor-pointer list-none rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-[#F4F7F5] ${linkFocus}`}>
              Menu
            </summary>
            <nav
              className="absolute right-0 z-30 mt-2 min-w-[12rem] rounded-xl border border-white/10 bg-[#121A17] p-2 shadow-xl"
              aria-label="Mobile primary"
            >
              {nav.map((item) => (
                <a
                  key={item.to}
                  href={interactive ? item.to : undefined}
                  className={`block rounded-lg px-3 py-2 text-sm ${item.to === activePath ? 'text-[#7CFFB2]' : 'text-[#A8B5AE]'}`}
                  aria-current={item.to === activePath ? 'page' : undefined}
                  onClick={interactive ? undefined : (event) => event.preventDefault()}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </details>
          <CtaLink
            cta={marketing.primaryCta}
            interactive={interactive}
            className="hidden bg-[#7CFFB2] text-[#070B0A] hover:bg-[#3ECF8E] hover:text-white sm:inline-flex"
          />
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <footer className="border-t border-white/10 px-5 py-10">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
          <div>
            <p className="font-bold">{name}</p>
            <p className="mt-2 text-sm text-[#A8B5AE]">{site.specialty}</p>
          </div>
          {marketing.newsletterEnabled && (
            <div>
              <p className="text-sm font-semibold">Newsletter</p>
              <p className="mt-2 text-xs text-[#A8B5AE]">
                Get the free AI implementation checklist. Connect your provider later.
              </p>
            </div>
          )}
        </div>
        <p className="mx-auto mt-8 max-w-6xl text-center text-xs text-[#A8B5AE]">
          © {new Date().getFullYear()} {name}. All rights reserved.
        </p>
      </footer>
      <StickyCta marketing={marketing} interactive={interactive} />
      <FloatingContact site={site} marketing={marketing} interactive={interactive} />
    </div>
  );
}

function HomeView({ site, interactive = true }) {
  const home = normalizeMarketingRoutes(site.marketingRoutes).find((route) => route.type === 'home');
  const content = home?.content || {};
  const marketing = site.marketing || {};
  const services = normalizeMarketingRoutes(site.marketingRoutes).filter((route) => route.type === 'service' && route.enabled);
  const cases = normalizeMarketingRoutes(site.marketingRoutes).filter((route) => route.type === 'case_study' && route.enabled);

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 px-5 pb-16 pt-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,255,178,0.14),transparent_55%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7CFFB2]">
              {content.subheadline || site.specialty || 'AI Engineering Studio'}
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              {content.headline || site.name || 'Marketing Site'}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#A8B5AE] sm:text-lg">
              {content.supportingText
                || 'We build AI-powered software, custom applications and intelligent automations that help businesses scale.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CtaLink cta={marketing.primaryCta} className="bg-[#7CFFB2] text-[#070B0A]" interactive={interactive} />
              <CtaLink cta={marketing.secondaryCta} className="border border-white/15 text-white" interactive={interactive} />
            </div>
            <ul className="mt-8 flex flex-wrap gap-2">
              {(marketing.specializations || []).map((item) => (
                <li key={item} className="rounded-full border border-white/10 px-3 py-1 text-xs text-[#A8B5AE]">{item}</li>
              ))}
            </ul>
          </div>
          <dl className="grid grid-cols-2 gap-3 self-end">
            {(marketing.stats || []).map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <dt className="text-xs text-[#A8B5AE]">{stat.label}</dt>
                <dd className="mt-2 text-2xl font-bold">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-3xl font-semibold tracking-tight">Services</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <article key={service.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-xl font-semibold">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#A8B5AE]">{service.content?.summary}</p>
            </article>
          ))}
        </div>
      </section>

      {cases.length > 0 && (
        <section className="border-t border-white/10 bg-[#0E1613] px-5 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-semibold">Case studies</h2>
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {cases.slice(0, 2).map((item) => (
                <article key={item.id} className="rounded-2xl border border-white/10 p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#7CFFB2]">{item.content?.industry}</p>
                  <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-[#A8B5AE]">{item.content?.summary}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-3xl font-semibold">How we work</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(marketing.processSteps || []).map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-white/10 p-5">
              <p className="text-xs font-semibold text-[#7CFFB2]">0{index + 1}</p>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-[#A8B5AE]">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="px-5 py-16">
        <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(124,255,178,0.12),rgba(61,139,255,0.10))] px-6 py-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Let’s build your next AI-powered product.</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            <CtaLink cta={marketing.primaryCta} className="bg-[#7CFFB2] text-[#070B0A]" interactive={interactive} />
            <CtaLink cta={{ label: 'Estimate My Project', href: '/estimate' }} className="border border-white/20" interactive={interactive} />
          </div>
        </div>
      </section>
    </>
  );
}

function IndexView({ route, items, emptyLabel }) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="text-4xl font-bold tracking-tight">{route?.content?.headline || route?.title}</h1>
      <p className="mt-4 max-w-2xl text-[#A8B5AE]">{route?.content?.body}</p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {items.length === 0 && <p className="text-sm text-[#A8B5AE]">{emptyLabel}</p>}
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold">{item.title}</h2>
            <p className="mt-3 text-sm text-[#A8B5AE]">
              {item.content?.summary || item.content?.excerpt || item.content?.body}
            </p>
            <p className="mt-4 text-xs text-[#7CFFB2]">{item.path}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ServiceDetailView({ route }) {
  const content = route.content || {};
  return (
    <article className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-[#7CFFB2]">Service</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">{route.title}</h1>
      <p className="mt-5 max-w-3xl text-lg text-[#A8B5AE]">{content.summary}</p>
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Who it is for</h2>
        <p className="mt-3 text-[#A8B5AE]">{content.whoFor}</p>
      </section>
      {[
        ['Problems we solve', content.problems],
        ['Benefits', content.benefits],
        ['Architecture', content.architecture],
        ['Process', content.process],
      ].map(([title, items]) => (
        <section key={title} className="mt-10">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <ul className="mt-4 space-y-2">
            {(items || []).filter(Boolean).map((item) => (
              <li key={item} className="flex gap-2 text-[#A8B5AE]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7CFFB2]" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Technologies</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {(content.technologies || []).map((tech) => (
            <span key={tech} className="rounded-xl border border-white/10 px-3 py-2 text-sm">{tech}</span>
          ))}
        </div>
      </section>
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 p-5">
          <h2 className="text-xl font-semibold">Expected ROI</h2>
          <p className="mt-3 text-sm text-[#A8B5AE]">{content.roi}</p>
        </div>
        <div className="rounded-2xl border border-white/10 p-5">
          <h2 className="text-xl font-semibold">Compared with alternatives</h2>
          <p className="mt-3 text-sm text-[#A8B5AE]">{content.comparison}</p>
        </div>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">FAQ</h2>
        <div className="mt-4 space-y-3">
          {(content.faqs || []).filter((item) => item.question || item.answer).map((item) => (
            <details key={item.question} className="rounded-2xl border border-white/10 p-4">
              <summary className="cursor-pointer font-semibold">{item.question}</summary>
              <p className="mt-2 text-sm text-[#A8B5AE]">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </article>
  );
}

function CaseStudyView({ route }) {
  const content = route.content || {};
  const flow = [
    { label: 'Problem', body: content.problem },
    { label: 'Solution', body: content.solution },
    { label: 'Architecture', body: (content.architecture || []).filter(Boolean).join(' → ') },
    {
      label: 'Results',
      body: (content.results || []).filter((item) => item.label || item.value)
        .map((item) => `${item.label}: ${item.value}`).join(' · '),
    },
  ];
  return (
    <article className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-xs uppercase tracking-[0.16em] text-[#7CFFB2]">
        {content.industry} · {content.client}
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{route.title}</h1>
      <p className="mt-5 max-w-3xl text-lg text-[#A8B5AE]">{content.summary}</p>
      <p className="mt-4 text-sm text-[#A8B5AE]">Timeline: {content.timeline}</p>
      <ol className="mt-12 space-y-4">
        {flow.map((step, index) => (
          <li key={step.label} className="rounded-2xl border border-white/10 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7CFFB2]">
              {index + 1}. {step.label}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#A8B5AE] sm:text-base">{step.body}</p>
            {index < flow.length - 1 && (
              <p className="mt-4 text-center text-[#7CFFB2]" aria-hidden="true">↓</p>
            )}
          </li>
        ))}
      </ol>
      <div className="mt-8 flex flex-wrap gap-2">
        {(content.technologies || []).map((tech) => (
          <span key={tech} className="rounded-xl border border-white/10 px-3 py-2 text-sm">{tech}</span>
        ))}
      </div>
      {content.testimonialQuote && (
        <blockquote className="mt-10 rounded-2xl border border-white/10 p-6">
          <p className="text-xl leading-relaxed">“{content.testimonialQuote}”</p>
          <footer className="mt-4 text-sm text-[#A8B5AE]">
            {content.testimonialAuthor} · {content.testimonialRole}
          </footer>
        </blockquote>
      )}
    </article>
  );
}

function BlogPostView({ route }) {
  const content = route.content || {};
  return (
    <article className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-xs uppercase tracking-[0.16em] text-[#7CFFB2]">
        {content.category} · {content.readingMinutes} min
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">{route.title}</h1>
      <p className="mt-5 text-lg text-[#A8B5AE]">{content.excerpt}</p>
      <p className="mt-3 text-sm text-[#A8B5AE]">{content.date}</p>
      <div className="mt-10 space-y-5 text-base leading-relaxed text-[#A8B5AE]">
        {(content.body || []).filter(Boolean).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        {(content.tags || []).map((tag) => (
          <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-xs">{tag}</span>
        ))}
      </div>
    </article>
  );
}

function EstimateView({ route, interactive }) {
  const content = route.content || {};
  const [scope, setScope] = useState('product');
  const estimate = useMemo(() => {
    const base = scope === 'mvp'
      ? content.baseMvp
      : scope === 'platform'
        ? content.basePlatform
        : content.baseProduct;
    const value = Number(base) || 28000;
    return {
      low: Math.round(value * 0.85),
      high: Math.round(value * 1.2),
    };
  }, [scope, content.baseMvp, content.baseProduct, content.basePlatform]);

  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="text-4xl font-bold tracking-tight">{content.headline || route.title}</h1>
      <p className="mt-4 max-w-2xl text-[#A8B5AE]">{content.body}</p>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <fieldset className="space-y-2 rounded-2xl border border-white/10 p-5">
          <legend className="px-1 text-sm font-semibold">Project scope</legend>
          {[
            ['mvp', 'Startup MVP'],
            ['product', 'Custom product'],
            ['platform', 'Platform / multi-tenant'],
          ].map(([value, label]) => (
            <label key={value} className="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-sm">
              <input
                type="radio"
                name="scope"
                checked={scope === value}
                disabled={!interactive}
                onChange={() => setScope(value)}
              />
              {label}
            </label>
          ))}
        </fieldset>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[#7CFFB2]">Ballpark</p>
          <p className="mt-3 text-4xl font-bold">
            ${estimate.low.toLocaleString()} – ${estimate.high.toLocaleString()}
          </p>
          <p className="mt-3 text-sm text-[#A8B5AE]">Indicative USD range for planning.</p>
          <div className="mt-6">
            <CtaLink
              cta={{ label: 'Book a Discovery Call', href: '/contact' }}
              interactive={interactive}
              className="bg-[#7CFFB2] text-[#070B0A]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ResourcesView({ route }) {
  const content = route.content || {};
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="text-4xl font-bold tracking-tight">{content.headline || route.title}</h1>
      <p className="mt-4 max-w-2xl text-[#A8B5AE]">{content.body}</p>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <ol className="space-y-3">
          {(content.checklist || []).filter(Boolean).map((item, index) => (
            <li key={item} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-[#A8B5AE]">
              <span className="mr-2 font-semibold text-[#7CFFB2]">{index + 1}.</span>
              {item}
            </li>
          ))}
        </ol>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold">{content.guideTitle}</h2>
          <p className="mt-3 text-sm text-[#A8B5AE]">{content.guideBody}</p>
        </div>
      </div>
    </section>
  );
}

function ContactView({ site, route }) {
  const content = route?.content || {};
  const marketing = site.marketing || {};
  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-5 py-16 lg:grid-cols-2">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">{content.headline || 'Contact'}</h1>
        <p className="mt-4 text-[#A8B5AE]">{content.body}</p>
        {site.email && (
          <p className="mt-6 text-sm">
            Email:{' '}
            <a className="text-[#7CFFB2] underline-offset-2 hover:underline" href={`mailto:${site.email}`}>
              {site.email}
            </a>
          </p>
        )}
        {marketing.calendlyUrl && (
          <a
            href={marketing.calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex rounded-xl bg-[#7CFFB2] px-5 py-3 text-sm font-semibold text-[#070B0A]"
          >
            Open Calendly
          </a>
        )}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-[#A8B5AE]">
        <p className="font-semibold text-white">What to prepare</p>
        <ul className="mt-3 space-y-2">
          <li>• The workflow or product outcome you care about</li>
          <li>• Systems of record to integrate</li>
          <li>• Timeline and constraints</li>
        </ul>
      </div>
    </section>
  );
}

export default function MarketingSite({
  data,
  interactive = true,
  className = '',
  path = '/',
}) {
  if (!isMarketingSite(data)) return null;

  const routes = normalizeMarketingRoutes(data.marketingRoutes);
  const route = findMarketingRouteByPath(routes, path)
    || routes.find((item) => item.type === 'home');

  let body = <HomeView site={data} interactive={interactive} />;
  if (route?.type === 'services_index') {
    body = (
      <IndexView
        route={route}
        items={routes.filter((item) => item.type === 'service' && item.enabled)}
        emptyLabel="No services yet."
      />
    );
  } else if (route?.type === 'service') body = <ServiceDetailView route={route} />;
  else if (route?.type === 'case_studies_index') {
    body = (
      <IndexView
        route={route}
        items={routes.filter((item) => item.type === 'case_study' && item.enabled)}
        emptyLabel="No case studies yet."
      />
    );
  } else if (route?.type === 'case_study') body = <CaseStudyView route={route} />;
  else if (route?.type === 'blog_index') {
    body = (
      <IndexView
        route={route}
        items={routes.filter((item) => item.type === 'blog_post' && item.enabled)}
        emptyLabel="No posts yet."
      />
    );
  } else if (route?.type === 'blog_post') body = <BlogPostView route={route} />;
  else if (route?.type === 'estimate') body = <EstimateView route={route} interactive={interactive} />;
  else if (route?.type === 'resources') body = <ResourcesView route={route} />;
  else if (route?.type === 'contact') body = <ContactView site={data} route={route} />;
  else if (route?.type === 'home' || !route) body = <HomeView site={data} interactive={interactive} />;

  return (
    <div className={className}>
      <MarketingChrome site={data} interactive={interactive} activePath={route?.path || path}>
        {body}
      </MarketingChrome>
    </div>
  );
}
