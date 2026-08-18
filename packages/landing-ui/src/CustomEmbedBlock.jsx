import {
  getVisibleServiceItems,
  normalizePreHeroMode,
  normalizeSectionType,
  splitSectionParagraphs,
} from '@raulizqli/landing-core/customEmbeds';
import { normalizePreHeroImageSide, splitPreHeroParagraphs } from '@raulizqli/landing-core/preHero';
import { ServicesItemsLayout } from './ServicesSection.jsx';
import { trackCtaClick } from './trackInteraction.js';

const COPY = {
  en: {
    customSection: 'Custom section',
    bookAppointment: 'Book appointment',
    faq: 'Frequently asked questions',
    steps: 'How we work',
    services: 'Services',
    portfolio: 'Portfolio',
    viewPortfolio: 'View full portfolio',
  },
  es: {
    customSection: 'Sección personalizada',
    bookAppointment: 'Reservar cita',
    faq: 'Preguntas frecuentes',
    steps: 'Cómo trabajamos',
    services: 'Servicios',
    portfolio: 'Portafolio',
    viewPortfolio: 'Ver portafolio completo',
  },
};

function EmbedHtml({ embed }) {
  const hasCode = Boolean(String(embed?.htmlCode ?? '').trim());
  if (!hasCode) return null;

  // Isolate third-party / raw HTML in a sandboxed iframe without allow-same-origin
  // so scripts cannot touch the parent origin (F08).
  return (
    <iframe
      title={embed.label || embed.title || 'Custom embed'}
      className="custom-embed-content w-full min-h-[240px] border-0 rounded-md bg-transparent"
      sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
      referrerPolicy="no-referrer"
      srcDoc={String(embed.htmlCode)}
    />
  );
}

function SectionShell({ embed, children, className = '', copy = COPY.es }) {
  const contentClass = embed.fullWidth
    ? 'w-full px-5 py-10 sm:py-14'
    : 'max-w-5xl mx-auto px-5 py-10 sm:py-14';

  return (
    <section
      className={`border-y border-[#2A342D]/10 custom-embed-section ${className}`.trim()}
      data-embed-id={embed.id}
      data-section-type={embed.type || 'embed'}
      aria-label={embed.label || embed.title || copy.customSection}
    >
      <div className={contentClass}>{children}</div>
    </section>
  );
}

function SectionTitle({ title }) {
  if (!String(title ?? '').trim()) return null;
  return (
    <h2 className="font-serif text-2xl sm:text-3xl text-current mb-6 text-center">
      {title}
    </h2>
  );
}

function TextSection({ embed }) {
  const paragraphs = splitSectionParagraphs(embed.body);
  return (
    <SectionShell embed={embed}>
      <SectionTitle title={embed.title} />
      {paragraphs.length > 0 && (
        <div className="max-w-3xl mx-auto space-y-4 text-sm sm:text-base text-current/75 leading-relaxed text-center sm:text-left">
          {paragraphs.map((paragraph, index) => (
            <p key={`${embed.id}-p-${index}`}>{paragraph}</p>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

function QuoteSection({ embed }) {
  return (
    <SectionShell embed={embed}>
      <figure className="max-w-3xl mx-auto text-center">
        <blockquote className="font-serif text-2xl sm:text-3xl text-current leading-snug">
          &ldquo;{embed.quoteText}&rdquo;
        </blockquote>
        {embed.quoteAttribution && (
          <figcaption className="mt-6 text-xs uppercase tracking-[0.18em] text-current/55">
            {embed.quoteAttribution}
          </figcaption>
        )}
      </figure>
    </SectionShell>
  );
}

function CtaSection({ embed, interactive, copy }) {
  const href = String(embed.ctaButtonUrl || '').trim() || '#contact';
  const external = /^https?:\/\//i.test(href);

  return (
    <SectionShell embed={embed} className="bg-[#4A5D4E]/5" copy={copy}>
      <div className="max-w-2xl mx-auto text-center space-y-5">
        <SectionTitle title={embed.title} />
        {embed.ctaText && (
          <p className="text-sm sm:text-base text-current/70 leading-relaxed">{embed.ctaText}</p>
        )}
        {interactive ? (
          <a
            href={href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            onClick={() => trackCtaClick('custom_section_cta')}
            className="inline-flex items-center justify-center bg-[#4A5D4E] text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-[#3d4d40] transition-colors"
          >
            {embed.ctaButtonLabel || copy.bookAppointment}
          </a>
        ) : (
          <span className="inline-flex items-center justify-center bg-[#4A5D4E] text-white text-sm font-medium px-6 py-3 rounded-full">
            {embed.ctaButtonLabel || copy.bookAppointment}
          </span>
        )}
      </div>
    </SectionShell>
  );
}

/** Light cards on dark page themes: solid mist surface + ink / strong-green type (not text-current). */
const LIGHT_CARD =
  'rounded-2xl border border-[#070B0A]/10 bg-[#F4F7F5] shadow-sm';
const CARD_TITLE = 'text-[#0A5C3A]';
const CARD_BODY = 'text-[#1A2420]/80';
const CARD_MUTED = 'text-[#0A5C3A]/55';

function FaqSection({ embed, copy }) {
  const items = (embed.faqItems || []).filter((item) => item.question && item.answer);

  return (
    <SectionShell embed={embed} copy={copy}>
      <SectionTitle title={embed.title || copy.faq} />
      <div className="max-w-3xl mx-auto space-y-3">
        {items.map((item, index) => (
          <details
            key={`${embed.id}-faq-${index}`}
            className={`group ${LIGHT_CARD} px-4 py-3`}
          >
            <summary
              className={`cursor-pointer list-none font-medium text-sm sm:text-base ${CARD_TITLE} flex items-center justify-between gap-3`}
            >
              <span>{item.question}</span>
              <span className={`${CARD_MUTED} group-open:rotate-45 transition-transform text-lg leading-none`}>+</span>
            </summary>
            <p className={`mt-3 text-sm ${CARD_BODY} leading-relaxed whitespace-pre-line`}>
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </SectionShell>
  );
}

function StepsSection({ embed, copy }) {
  const items = (embed.steps || []).filter((item) => item.title || item.description);

  return (
    <SectionShell embed={embed} copy={copy}>
      <SectionTitle title={embed.title || copy.steps} />
      <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item, index) => (
          <li
            key={`${embed.id}-step-${index}`}
            className={`${LIGHT_CARD} p-5`}
          >
            <p className={`text-[11px] uppercase tracking-[0.2em] ${CARD_MUTED} mb-3`}>
              {String(index + 1).padStart(2, '0')}
            </p>
            {item.title && (
              <h3 className={`font-serif text-lg sm:text-xl ${CARD_TITLE} mb-2 leading-snug`}>{item.title}</h3>
            )}
            {item.description && (
              <p className={`text-sm ${CARD_BODY} leading-relaxed`}>{item.description}</p>
            )}
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}

function HtmlEmbedSection({ embed }) {
  const hasTitle = Boolean(String(embed.title ?? '').trim());
  const hasCode = Boolean(embed.htmlCode);
  if (!hasTitle && !hasCode) return null;

  return (
    <SectionShell embed={embed}>
      <SectionTitle title={embed.title} />
      <EmbedHtml embed={embed} />
    </SectionShell>
  );
}

function PreHeroEmbedSection({ embed }) {
  const imageUrl = String(embed.imageUrl ?? '').trim();
  const splitMode = normalizePreHeroMode(embed.preHeroMode) === 'split';
  const imageOnRight = normalizePreHeroImageSide(embed.preHeroImageSide) === 'right';
  const title = String(embed.title ?? '').trim();
  const paragraphs = splitPreHeroParagraphs(embed.body);

  if (!imageUrl) return null;

  if (!splitMode) {
    return (
      <section
        className="border-y border-[#2A342D]/10 custom-embed-section"
        data-embed-id={embed.id}
        data-section-type="pre_hero"
        aria-label={embed.label || title || 'Sección principal'}
      >
        <img
          src={imageUrl}
          alt=""
          className="w-full h-auto max-h-[520px] object-cover object-center"
        />
      </section>
    );
  }

  const imageBlock = (
    <div className="relative h-full min-h-[280px] md:min-h-[360px]">
      <img
        src={imageUrl}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover object-top rounded-xl ${
          imageOnRight ? 'md:rounded-l-none' : 'md:rounded-r-none'
        }`}
      />
    </div>
  );

  const textBlock = (
    <div
      className={`relative z-10 bg-white rounded-xl shadow-sm border border-[#2A342D]/10 p-6 sm:p-8 flex flex-col justify-center md:my-6 ${
        imageOnRight
          ? 'md:rounded-r-none md:-mr-10'
          : 'md:rounded-l-none md:-ml-10'
      }`}
    >
      {title && (
        <h2 className="font-serif text-2xl sm:text-3xl text-[#5B7C8E] mb-5 leading-snug">
          {title}
        </h2>
      )}
      {paragraphs.length > 0 && (
        <div className="space-y-4 text-sm sm:text-base text-[#2A342D]/75 leading-relaxed">
          {paragraphs.map((paragraph, index) => (
            <p key={`${embed.id}-prehero-p-${index}`}>{paragraph}</p>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <section
      className="border-y border-[#2A342D]/10 custom-embed-section"
      data-embed-id={embed.id}
      data-section-type="pre_hero"
      aria-label={embed.label || title || 'Sección principal'}
    >
      <div className="max-w-5xl mx-auto px-5 py-10 sm:py-14">
        <div
          className={`grid gap-6 md:gap-0 items-stretch ${
            imageOnRight
              ? 'md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]'
              : 'md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]'
          }`}
        >
          {imageOnRight ? (
            <>
              <div className="min-w-0 flex flex-col justify-center">{textBlock}</div>
              <div className="min-w-0 h-full min-h-[280px] md:min-h-[360px]">{imageBlock}</div>
            </>
          ) : (
            <>
              <div className="min-w-0 h-full min-h-[280px] md:min-h-[360px]">{imageBlock}</div>
              <div className="min-w-0 flex flex-col justify-center">{textBlock}</div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function ServicesEmbedSection({ embed, interactive, copy }) {
  const items = getVisibleServiceItems(embed.serviceItems);
  if (items.length === 0) return null;

  return (
    <SectionShell embed={embed} copy={copy}>
      <SectionTitle title={embed.title || copy.services} />
      {embed.body && (
        <p className="text-sm text-current/60 text-center max-w-2xl mx-auto mb-8 leading-relaxed">
          {embed.body}
        </p>
      )}
      <ServicesItemsLayout
        items={items}
        displayMode={embed.servicesDisplayMode}
        carouselPerView={embed.servicesCarouselPerView}
        carouselAutoplay={embed.servicesCarouselAutoplay}
        carouselTransition={embed.servicesCarouselTransition}
        visualStyle={embed.servicesVisualStyle}
        customStyle={embed.servicesCustomStyle}
        interactive={interactive}
      />
    </SectionShell>
  );
}

function PortfolioSection({ embed, interactive, copy }) {
  const portfolioUrl = String(embed.portfolioUrl ?? '').trim();
  const hasCode = Boolean(String(embed.htmlCode ?? '').trim());
  if (!portfolioUrl && !hasCode) return null;

  const paragraphs = splitSectionParagraphs(embed.body);
  const buttonLabel = String(embed.ctaButtonLabel ?? '').trim() || copy.viewPortfolio;
  const external = /^https?:\/\//i.test(portfolioUrl);

  return (
    <SectionShell embed={embed} copy={copy}>
      <SectionTitle title={embed.title || copy.portfolio} />
      {paragraphs.length > 0 && (
        <div className="max-w-2xl mx-auto space-y-3 text-sm text-current/70 leading-relaxed text-center mb-8">
          {paragraphs.map((paragraph, index) => (
            <p key={`${embed.id}-portfolio-p-${index}`}>{paragraph}</p>
          ))}
        </div>
      )}
      {hasCode && (
        <div className="mb-8">
          <EmbedHtml embed={embed} />
        </div>
      )}
      {portfolioUrl && (
        <div className="text-center">
          {interactive ? (
            <a
              href={portfolioUrl}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              onClick={() => trackCtaClick('portfolio_external')}
              className="inline-flex items-center justify-center bg-[#4A5D4E] text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-[#3d4d40] transition-colors"
            >
              {buttonLabel}
            </a>
          ) : (
            <span className="inline-flex items-center justify-center bg-[#4A5D4E] text-white text-sm font-medium px-6 py-3 rounded-full">
              {buttonLabel}
            </span>
          )}
        </div>
      )}
    </SectionShell>
  );
}

export default function CustomEmbedBlock({ embed, interactive = true, language = 'es' }) {
  const type = normalizeSectionType(embed?.type);
  const copy = language === 'en' ? COPY.en : COPY.es;

  if (type === 'pre_hero') return <PreHeroEmbedSection embed={embed} />;
  if (type === 'services') return <ServicesEmbedSection embed={embed} interactive={interactive} copy={copy} />;
  if (type === 'portfolio') return <PortfolioSection embed={embed} interactive={interactive} copy={copy} />;
  if (type === 'faq') return <FaqSection embed={embed} copy={copy} />;
  if (type === 'steps') return <StepsSection embed={embed} copy={copy} />;
  if (type === 'text') return <TextSection embed={embed} />;
  if (type === 'cta') return <CtaSection embed={embed} interactive={interactive} copy={copy} />;
  if (type === 'quote') return <QuoteSection embed={embed} />;
  return <HtmlEmbedSection embed={embed} />;
}
