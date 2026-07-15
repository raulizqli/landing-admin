import Navbar from './Navbar';
import LandingMainContent from './LandingMainContent';
import FooterLegalLinks from './FooterLegalLinks';
import { resolveBookingCta } from '@raulizqli/landing-core/bookingCta';
import { buildSectionBackgroundStyle, getSectionTheme } from '@raulizqli/landing-core/sectionBackground';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';
import { SECTION_IDS } from '@raulizqli/landing-core/sectionAnchors';
import { isFooterSectionEnabled } from '@raulizqli/landing-core/sectionVisibility';

export default function LandingPage({ data, interactive = true, className = '' }) {
  const labels = resolvePageLabels(data);
  const name = data.name || getLabel(labels, 'placeholders.psychologistName');
  const specialty = data.specialty || getLabel(labels, 'placeholders.specialty');
  const navSpecialty = String(data.navSpecialty ?? '').trim() || specialty;
  const bookingCta = resolveBookingCta(data);
  const pageStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'page'), { sectionKey: 'page' });
  const footerStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'footer'), { sectionKey: 'footer' });
  const rootClassName = ['text-[#2A342D] font-sans min-h-full', className].filter(Boolean).join(' ');

  return (
    <div id={SECTION_IDS.top} data-preview-section={SECTION_IDS.top} className={rootClassName} style={pageStyle}>
      <Navbar
        name={name}
        specialty={navSpecialty}
        navMode={data.navMode}
        navIconUrl={data.navIconUrl}
        navLogoUrl={data.navLogoUrl}
        navIconOnly={data.navIconOnly}
        ctaHref={bookingCta.href}
        ctaExternal={bookingCta.external}
        interactive={interactive}
        data={data}
      />

      <LandingMainContent data={data} specialty={specialty} interactive={interactive} />

      {isFooterSectionEnabled(data) && (
        <footer
          id={SECTION_IDS.footer}
          data-preview-section={SECTION_IDS.footer}
          className="border-t border-[#2A342D]/10 py-6 text-center"
          style={footerStyle}
        >
          <p className="text-xs opacity-50">
            © {new Date().getFullYear()} {name}. {getLabel(labels, 'footer.rightsReserved')}
          </p>
          <FooterLegalLinks data={data} interactive={interactive} />
          <p className="mt-3 text-[11px] opacity-40">
            {getLabel(labels, 'footer.poweredBy')}{' '}
            {interactive ? (
              <a
                href="https://leftsidedev.site"
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-2 hover:underline hover:opacity-100 transition-opacity"
              >
                LeftSideDev
              </a>
            ) : (
              <span>LeftSideDev</span>
            )}
          </p>
        </footer>
      )}
    </div>
  );
}
