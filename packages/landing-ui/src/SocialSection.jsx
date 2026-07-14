
import { getSocialLinks } from '@raulizqli/landing-core/socialLinks';
import { trackSocialClick } from './trackInteraction.js';
import { buildSectionBackgroundStyle, getSectionTheme } from '@raulizqli/landing-core/sectionBackground';
import { SECTION_IDS } from '@raulizqli/landing-core/sectionAnchors';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';

function SocialIcon({ network }) {
  const className = 'w-5 h-5';

  switch (network) {
    case 'instagram':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 3.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5zM18 6.2a1 1 0 1 1-1 1 1 1 0 0 1 1-1z" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.3-1.2A10 10 0 1 0 12 2zm0 2a8 8 0 0 1 6.8 12.1l.3.3-.2 2.1-2.1-.2-.3-.3A8 8 0 1 1 12 4zm-1.1 3.5c.2 0 .5 0 .7.2.3.3.8 1 .9 1.2 0 .2 0 .4-.1.6l-.4.5c-.1.2-.2.3-.1.5.2.5.9 1.7 2.2 2.2.2.1.4 0 .5-.1l.6-.5c.2-.1.4-.1.6 0 .3.2 1 .6 1.2.9.2.2.2.5.1.7-.2.4-1 1.2-1.7 1.2-.5 0-1.2-.3-2.6-1.4-1.8-1.5-3-3.3-3.1-4.3 0-.6.5-1.3 1.1-1.7z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M13 3h4a1 1 0 0 1 1 1v4h-3.5a1 1 0 0 0-1 1v3H18v4h-4.5v7h-5v-7H6v-4h2.5V8a5 5 0 0 1 5-5z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16.5 3c.5 2.2 1.8 4 4 4.5v4.1a8.4 8.4 0 0 1-4-.8v7.2a6.5 6.5 0 1 1-6.5-6.5c.3 0 .7 0 1 .1v4.3a2.5 2.5 0 1 0 1.8 2.4V3h3.7z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C17.7 5 12 5 12 5s-5.7 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12c0 1.7.1 3.4.4 4.8a2.5 2.5 0 0 0 1.8 1.8C6.3 19 12 19 12 19s5.7 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.3-1.4.4-3.1.4-4.8s-.1-3.4-.4-4.8zM10 15.5v-7l6 3.5-6 3.5z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V24h-4V8.5zM8.5 8.5h3.8v2.1h.05c.53-1 1.83-2.1 3.77-2.1 4.03 0 4.77 2.65 4.77 6.1V24h-4v-7.1c0-1.7-.03-3.88-2.37-3.88-2.37 0-2.73 1.85-2.73 3.76V24h-4V8.5z" />
        </svg>
      );
    case 'doctoralia':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2a6 6 0 0 0-6 6v1.1A4.9 4.9 0 0 0 3 13.5V16a2 2 0 0 0 2 2h1.1a6 6 0 0 0 11.8 0H19a2 2 0 0 0 2-2v-2.5a4.9 4.9 0 0 0-3-4.4V8a6 6 0 0 0-6-6zm0 2a4 4 0 0 1 4 4v1.1a2.9 2.9 0 0 1 1.8 2.7V16h-1.1a6 6 0 0 0-11.8 0H6v-2.2a2.9 2.9 0 0 1 1.8-2.7V8a4 4 0 0 1 4-4zm-1 5h2v2h-2V9zm-3 0h2v2H8V9zm6 0h2v2h-2V9z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function SocialSection({ data, interactive = true }) {
  const labels = resolvePageLabels(data);
  const links = getSocialLinks(data);
  if (!links.length) return null;

  const iconOnly = data?.socialIconOnly === true;
  const itemClass = iconOnly
    ? 'inline-flex items-center justify-center w-11 h-11 rounded-full border border-[#4A5D4E]/25 bg-white text-[#4A5D4E] transition-colors'
    : 'inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#4A5D4E]/25 bg-white text-[#4A5D4E] text-sm font-medium transition-colors';

  const renderButtonContent = (link) => (
    <>
      <SocialIcon network={link.key} />
      {!iconOnly && link.label}
    </>
  );
  const sectionStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'social'), { sectionKey: 'social' });

  return (
    <section id={SECTION_IDS.social} className="border-t border-[#2A342D]/10" style={sectionStyle}>
      <div className="max-w-5xl mx-auto px-5 py-14 sm:py-16 text-center">
        <h2 className="font-serif text-2xl sm:text-3xl text-current mb-3">
          {getLabel(labels, 'social.title')}
        </h2>
        <p className="text-sm text-current/60 max-w-md mx-auto mb-8">
          {getLabel(labels, 'social.subtitle')}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {links.map((link) => (
            interactive ? (
              <a
                key={link.key}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackSocialClick(link.key)}
                aria-label={iconOnly ? link.label : undefined}
                title={iconOnly ? link.label : undefined}
                className={`${itemClass} hover:bg-[#4A5D4E]/5 hover:border-[#4A5D4E]/40 focus:outline-none focus:ring-2 focus:ring-[#4A5D4E] focus:ring-offset-2`}
              >
                {renderButtonContent(link)}
              </a>
            ) : (
              <span
                key={link.key}
                className={itemClass}
                aria-label={iconOnly ? link.label : undefined}
                title={iconOnly ? link.label : undefined}
              >
                {renderButtonContent(link)}
              </span>
            )
          ))}
        </div>
      </div>
    </section>
  );
}
