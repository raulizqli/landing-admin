
import { trackCtaClick } from './trackInteraction.js';
import { buildSectionBackgroundStyle, getSectionTheme } from '@raulizqli/landing-core/sectionBackground';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';

export default function Navbar({
  name,
  specialty,
  navMode,
  navIconUrl,
  navLogoUrl,
  navIconOnly,
  ctaHref,
  ctaExternal = false,
  interactive = true,
  data,
}) {
  const labels = resolvePageLabels(data);
  const logoMode = navMode === 'logo';
  const iconUrl = String(navIconUrl || '').trim();
  const logoUrl = String(navLogoUrl || '').trim();
  const iconOnly = navIconOnly === true;
  const displayName = name || getLabel(labels, 'placeholders.psychologistName');
  const displaySpecialty = specialty || getLabel(labels, 'placeholders.specialty');
  const ctaLabel = getLabel(labels, 'nav.bookAppointment');

  const iconElement = iconUrl ? (
    <img
      src={iconUrl}
      alt={iconOnly ? displayName : ''}
      className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 object-cover rounded-full"
    />
  ) : (
    <div
      className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-full bg-[#4A5D4E]/15 flex items-center justify-center font-serif text-sm text-[#4A5D4E]"
      aria-hidden={!iconOnly}
    >
      {displayName.charAt(0).toUpperCase()}
    </div>
  );

  const ctaClassName = 'shrink-0 bg-[#4A5D4E] text-white text-xs sm:text-sm font-medium px-4 py-2 rounded-full hover:bg-[#3d4d40] transition-colors focus:outline-none focus:ring-2 focus:ring-[#4A5D4E] focus:ring-offset-2 focus:ring-offset-[#F4F1EA]';

  const ctaLinkProps = ctaExternal
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  const renderBrand = () => {
    if (logoMode) {
      if (logoUrl) {
        return (
          <img
            src={logoUrl}
            alt={displayName}
            className="h-10 sm:h-12 max-w-[min(100%,240px)] w-auto object-contain"
          />
        );
      }

      return (
        <div className="min-w-0">
          <p className="font-serif font-semibold text-[#2A342D] text-base sm:text-lg truncate">
            {displayName}
          </p>
          <p className="text-[10px] sm:text-xs uppercase tracking-widest text-[#4A5D4E]/80 mt-0.5 truncate">
            {displaySpecialty}
          </p>
        </div>
      );
    }

    if (iconOnly) {
      return <div className="min-w-0 flex items-center">{iconElement}</div>;
    }

    return (
      <div className="min-w-0 flex items-center gap-3">
        {iconElement}
        <div className="min-w-0">
          <p className="font-serif font-semibold text-[#2A342D] text-base sm:text-lg truncate">
            {displayName}
          </p>
          <p className="text-[10px] sm:text-xs uppercase tracking-widest text-[#4A5D4E]/80 mt-0.5 truncate">
            {displaySpecialty}
          </p>
        </div>
      </div>
    );
  };

  const navStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'nav'), { sectionKey: 'nav' });

  return (
    <header
      className="sticky top-0 z-20 border-b border-[#2A342D]/10"
      style={navStyle}
    >
      <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
        {renderBrand()}

        {interactive ? (
          <a
            href={ctaHref}
            {...ctaLinkProps}
            onClick={() => trackCtaClick('book_appointment')}
            className={ctaClassName}
          >
            {ctaLabel}
          </a>
        ) : (
          <span className={ctaClassName.replace('hover:bg-[#3d4d40] transition-colors ', '')}>
            {ctaLabel}
          </span>
        )}
      </div>
    </header>
  );
}
