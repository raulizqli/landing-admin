import { useEffect, useRef } from 'react';
import {
  normalizeSectionType,
  splitSectionParagraphs,
} from '@raulizqli/landing-core/customEmbeds';
import { trackCtaClick } from './trackInteraction.js';

function activateScripts(container) {
  const scripts = container.querySelectorAll('script');
  scripts.forEach((oldScript) => {
    const newScript = document.createElement('script');
    [...oldScript.attributes].forEach((attr) => {
      newScript.setAttribute(attr.name, attr.value);
    });
    if (oldScript.textContent) {
      newScript.textContent = oldScript.textContent;
    }
    oldScript.parentNode?.replaceChild(newScript, oldScript);
  });
}

function SectionShell({ embed, children, className = '' }) {
  const contentClass = embed.fullWidth
    ? 'w-full px-5 py-10 sm:py-14'
    : 'max-w-5xl mx-auto px-5 py-10 sm:py-14';

  return (
    <section
      className={`border-y border-[#2A342D]/10 custom-embed-section ${className}`.trim()}
      data-embed-id={embed.id}
      data-section-type={embed.type || 'embed'}
      aria-label={embed.label || embed.title || 'Sección personalizada'}
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

function EmbedHtml({ embed }) {
  const containerRef = useRef(null);
  const hasCode = Boolean(embed?.htmlCode);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasCode) return undefined;

    container.innerHTML = embed.htmlCode;
    activateScripts(container);

    return () => {
      container.innerHTML = '';
    };
  }, [embed?.id, embed?.htmlCode, hasCode]);

  if (!hasCode) return null;
  return <div ref={containerRef} className="custom-embed-content w-full min-h-[48px]" />;
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

function CtaSection({ embed, interactive }) {
  const href = String(embed.ctaButtonUrl || '').trim() || '#contact';
  const external = /^https?:\/\//i.test(href);

  return (
    <SectionShell embed={embed} className="bg-[#4A5D4E]/5">
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
            {embed.ctaButtonLabel || 'Reservar cita'}
          </a>
        ) : (
          <span className="inline-flex items-center justify-center bg-[#4A5D4E] text-white text-sm font-medium px-6 py-3 rounded-full">
            {embed.ctaButtonLabel || 'Reservar cita'}
          </span>
        )}
      </div>
    </SectionShell>
  );
}

function FaqSection({ embed }) {
  const items = (embed.faqItems || []).filter((item) => item.question && item.answer);

  return (
    <SectionShell embed={embed}>
      <SectionTitle title={embed.title || 'Preguntas frecuentes'} />
      <div className="max-w-3xl mx-auto space-y-3">
        {items.map((item, index) => (
          <details
            key={`${embed.id}-faq-${index}`}
            className="group rounded-xl border border-[#2A342D]/10 bg-white/60 px-4 py-3"
          >
            <summary className="cursor-pointer list-none font-medium text-sm sm:text-base text-current flex items-center justify-between gap-3">
              <span>{item.question}</span>
              <span className="text-current/40 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
            </summary>
            <p className="mt-3 text-sm text-current/70 leading-relaxed whitespace-pre-line">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </SectionShell>
  );
}

function StepsSection({ embed }) {
  const items = (embed.steps || []).filter((item) => item.title || item.description);

  return (
    <SectionShell embed={embed}>
      <SectionTitle title={embed.title || 'Cómo trabajamos'} />
      <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item, index) => (
          <li
            key={`${embed.id}-step-${index}`}
            className="rounded-2xl border border-[#2A342D]/10 bg-white/50 p-5"
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-current/45 mb-3">
              {String(index + 1).padStart(2, '0')}
            </p>
            {item.title && (
              <h3 className="font-serif text-lg sm:text-xl text-current mb-2 leading-snug">{item.title}</h3>
            )}
            {item.description && (
              <p className="text-sm text-current/70 leading-relaxed">{item.description}</p>
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

export default function CustomEmbedBlock({ embed, interactive = true }) {
  const type = normalizeSectionType(embed?.type);

  if (type === 'faq') return <FaqSection embed={embed} />;
  if (type === 'steps') return <StepsSection embed={embed} />;
  if (type === 'text') return <TextSection embed={embed} />;
  if (type === 'cta') return <CtaSection embed={embed} interactive={interactive} />;
  if (type === 'quote') return <QuoteSection embed={embed} />;
  return <HtmlEmbedSection embed={embed} />;
}
