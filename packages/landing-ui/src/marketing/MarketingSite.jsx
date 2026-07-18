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
      <a href={href} className={classes} target={cta.external ? '_blank' : undefined} rel={cta.external ? 'noopener noreferrer' : undefined}>
        {cta.label}
      </a>
    );
  }

  return <a href={href} className={classes}>{cta.label}</a>;
}

function MarketingChrome({ site, children, interactive = true, activePath = '/' }) {
  const marketing = site.marketing || {};
  const nav = listEnabledMarketingNav(site.marketingRoutes);
  const name = site.name || 'Marketing Site';

  return (
    <div className="min-h-full bg-[#070B0A] text-[#F4F7F5] font-sans">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070B0A]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-lg font-bold tracking-tight">{name}</p>
            <p className="truncate text-[10px] uppercase tracking-[0.18em] text-[#7CFFB2]">
              {site.specialty || 'Marketing Site'}
            </p>
          </div>
          <nav className="hidden items-center gap-4 md:flex" aria-label="Marketing">
            {nav.map((item) => (
              <a
                key={item.to}
                href={interactive ? item.to : undefined}
                className={`text-sm ${item.to === activePath ? 'text-[#7CFFB2]' : 'text-[#A8B5AE] hover:text-white'}`}
                onClick={interactive ? undefined : (event) => event.preventDefault()}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <CtaLink
            cta={marketing.primaryCta}
            interactive={interactive}
            className="bg-[#7CFFB2] text-[#070B0A] hover:bg-[#3ECF8E] hover:text-white"
          />
        </div>
      </header>
      {children}
      <footer className="border-t border-white/10 px-5 py-8 text-center text-xs text-[#A8B5AE]">
        © {new Date().getFullYear()} {name}. All rights reserved.
      </footer>
    </div>
  );
}

function HomeView({ site }) {
  const home = normalizeMarketingRoutes(site.marketingRoutes).find((route) => route.type === 'home');
  const content = home?.content || {};
  const marketing = site.marketing || {};
  const services = normalizeMarketingRoutes(site.marketingRoutes).filter((route) => route.type === 'service' && route.enabled);

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
              <CtaLink cta={marketing.primaryCta} className="bg-[#7CFFB2] text-[#070B0A]" interactive={false} />
              <CtaLink cta={marketing.secondaryCta} className="border border-white/15 text-white" interactive={false} />
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

      <section className="border-t border-white/10 bg-[#0E1613] px-5 py-16">
        <div className="mx-auto max-w-6xl">
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
          <div className="mt-8 flex flex-wrap gap-2">
            {(marketing.techStack || []).map((tech) => (
              <span key={tech} className="rounded-xl border border-white/10 px-3 py-2 text-sm">{tech}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16">
        <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(124,255,178,0.12),rgba(61,139,255,0.10))] px-6 py-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Let’s build your next AI-powered product.</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            <CtaLink cta={marketing.primaryCta} className="bg-[#7CFFB2] text-[#070B0A]" interactive={false} />
            <CtaLink cta={{ label: 'Contact', href: '/contact' }} className="border border-white/20" interactive={false} />
          </div>
        </div>
      </section>
    </>
  );
}

function ServicesIndexView({ site }) {
  const index = normalizeMarketingRoutes(site.marketingRoutes).find((route) => route.type === 'services_index');
  const services = normalizeMarketingRoutes(site.marketingRoutes).filter((route) => route.type === 'service' && route.enabled);
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="text-4xl font-bold tracking-tight">{index?.content?.headline || index?.title || 'Services'}</h1>
      <p className="mt-4 max-w-2xl text-[#A8B5AE]">{index?.content?.body}</p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <article key={service.id} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold">{service.title}</h2>
            <p className="mt-3 text-sm text-[#A8B5AE]">{service.content?.summary}</p>
            <p className="mt-4 text-xs text-[#7CFFB2]">{service.path}</p>
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

  const route = findMarketingRouteByPath(data.marketingRoutes, path)
    || normalizeMarketingRoutes(data.marketingRoutes).find((item) => item.type === 'home');

  let body = <HomeView site={data} />;
  if (route?.type === 'services_index') body = <ServicesIndexView site={data} />;
  else if (route?.type === 'service') body = <ServiceDetailView route={route} />;
  else if (route?.type === 'contact') body = <ContactView site={data} route={route} />;
  else if (route?.type === 'home' || !route) body = <HomeView site={data} />;

  return (
    <div className={className}>
      <MarketingChrome site={data} interactive={interactive} activePath={route?.path || path}>
        {body}
      </MarketingChrome>
    </div>
  );
}
