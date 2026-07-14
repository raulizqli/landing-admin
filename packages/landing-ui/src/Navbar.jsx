import { useEffect, useState } from 'react';
import { trackCtaClick } from './trackInteraction.js';
import { buildSectionBackgroundStyle, getSectionTheme, parseColorToHex } from '@raulizqli/landing-core/sectionBackground';
import {
  DEFAULT_NAV_CTA_BG_COLOR,
  DEFAULT_NAV_CTA_TEXT_COLOR,
} from '@raulizqli/landing-core/pageModel';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';
import { SECTION_IDS } from '@raulizqli/landing-core/sectionAnchors';
import {
  getNavMenuItems,
  normalizeNavAlign,
} from '@raulizqli/landing-core/sectionVisibility';
import { formatNavSpecialty } from '@raulizqli/landing-core/navDisplay';

function BrandBlock({
  logoMode,
  logoUrl,
  iconOnly,
  iconElement,
  displayName,
  displaySpecialty,
  specialtyCase,
}) {
  const specialtyClass = specialtyCase === 'capitalize'
    ? 'text-[10px] sm:text-xs tracking-wide text-[#4A5D4E]/80 mt-0.5 truncate'
    : 'text-[10px] sm:text-xs uppercase tracking-widest text-[#4A5D4E]/80 mt-0.5 truncate';
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
      <div className="min-w-0 text-left">
        <p className="font-serif font-semibold text-[#2A342D] text-base sm:text-lg truncate">
          {displayName}
        </p>
        <p className={specialtyClass}>
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
      <div className="min-w-0 text-left">
        <p className="font-serif font-semibold text-[#2A342D] text-base sm:text-lg truncate">
          {displayName}
        </p>
        <p className={specialtyClass}>
          {displaySpecialty}
        </p>
      </div>
    </div>
  );
}

function MenuLinks({ items, interactive, onNavigate, className = '' }) {
  if (!items.length) return null;

  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${className}`.trim()}>
      {items.map((item) => (
        <li key={item.id}>
          {interactive ? (
            <a
              href={`#${item.id}`}
              onClick={() => onNavigate?.()}
              className="text-xs sm:text-sm text-[#2A342D]/75 hover:text-[#4A5D4E] transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-xs sm:text-sm text-[#2A342D]/75">{item.label}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

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
  const showCta = data?.navShowCta !== false;
  const showMenu = data?.navShowMenu === true;
  const align = normalizeNavAlign(data?.navAlign);
  const menuItems = showMenu ? getNavMenuItems(data) : [];
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = name || getLabel(labels, 'placeholders.psychologistName');
  const specialtyCase = data?.navSpecialtyCase === 'capitalize' ? 'capitalize' : 'uppercase';
  const rawSpecialty = specialty || getLabel(labels, 'placeholders.specialty');
  const displaySpecialty = formatNavSpecialty(rawSpecialty, specialtyCase);
  const ctaLabel = getLabel(labels, 'nav.bookAppointment');
  const ctaBgColor = parseColorToHex(data?.navCtaBgColor, DEFAULT_NAV_CTA_BG_COLOR);
  const ctaTextColor = parseColorToHex(data?.navCtaTextColor, DEFAULT_NAV_CTA_TEXT_COLOR);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [menuOpen]);

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

  const ctaClassName = 'shrink-0 text-xs sm:text-sm font-medium px-4 py-2 rounded-full transition-[filter,opacity] hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#F4F1EA]';
  const ctaStyle = {
    backgroundColor: ctaBgColor,
    color: ctaTextColor,
    '--tw-ring-color': ctaBgColor,
  };

  const ctaLinkProps = ctaExternal
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  const brand = (
    <BrandBlock
      logoMode={logoMode}
      logoUrl={logoUrl}
      iconOnly={iconOnly}
      iconElement={iconElement}
      displayName={displayName}
      displaySpecialty={displaySpecialty}
      specialtyCase={specialtyCase}
    />
  );

  const cta = showCta ? (
    interactive ? (
      <a
        href={ctaHref}
        {...ctaLinkProps}
        onClick={() => trackCtaClick('book_appointment')}
        className={ctaClassName}
        style={ctaStyle}
      >
        {ctaLabel}
      </a>
    ) : (
      <span className={ctaClassName} style={ctaStyle}>
        {ctaLabel}
      </span>
    )
  ) : null;

  const desktopMenu = showMenu && menuItems.length > 0 ? (
    <MenuLinks
      items={menuItems}
      interactive={interactive}
      className="hidden md:flex"
    />
  ) : null;

  const mobileToggle = showMenu && menuItems.length > 0 ? (
    <button
      type="button"
      className="md:hidden shrink-0 text-xs font-medium text-[#2A342D] border border-[#2A342D]/15 rounded-full px-3 py-1.5"
      aria-expanded={menuOpen}
      aria-controls="nav-mobile-menu"
      onClick={() => setMenuOpen((open) => !open)}
    >
      {menuOpen ? getLabel(labels, 'nav.menuClose') : getLabel(labels, 'nav.menuOpen')}
    </button>
  ) : null;

  const brandCluster = (
    <div className="min-w-0 flex items-center gap-3 sm:gap-4">
      {brand}
      {desktopMenu}
      {mobileToggle}
    </div>
  );

  const useSplitLayout = align === 'spread' || (align === 'right' && showCta);
  const rowClass = useSplitLayout
    ? 'justify-between'
    : {
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end',
      }[align] || 'justify-between';

  const navStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'nav'), { sectionKey: 'nav' });

  let rowContent;
  if (align === 'spread') {
    rowContent = (
      <>
        <div className="min-w-0 flex items-center gap-4 lg:gap-6">
          {brand}
          {desktopMenu}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {mobileToggle}
          {cta}
        </div>
      </>
    );
  } else if (align === 'right' && showCta) {
    rowContent = (
      <>
        <div className="flex items-center gap-2 shrink-0">{cta}</div>
        {brandCluster}
      </>
    );
  } else {
    rowContent = (
      <div className={`min-w-0 flex flex-wrap items-center gap-3 sm:gap-4 ${align === 'center' ? 'justify-center' : ''}`}>
        {brand}
        {desktopMenu}
        {mobileToggle}
        {cta}
      </div>
    );
  }

  return (
    <header
      id={SECTION_IDS.nav}
      data-preview-section={SECTION_IDS.nav}
      className="sticky top-0 z-20 border-b border-[#2A342D]/10"
      style={navStyle}
    >
      <div className={`max-w-5xl mx-auto px-5 py-4 flex items-center gap-4 ${rowClass}`}>
        {rowContent}
      </div>

      {menuOpen && showMenu && menuItems.length > 0 && (
        <div
          id="nav-mobile-menu"
          className="md:hidden border-t border-[#2A342D]/10 px-5 py-4"
        >
          <MenuLinks
            items={menuItems}
            interactive={interactive}
            onNavigate={() => setMenuOpen(false)}
            className="flex-col items-start"
          />
        </div>
      )}
    </header>
  );
}
