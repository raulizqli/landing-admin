
import Navbar from './Navbar';
import LandingMainContent from './LandingMainContent';
import { resolveBookingCta } from '@raulizqli/landing-core/bookingCta';
import { buildSectionBackgroundStyle, getSectionTheme } from '@raulizqli/landing-core/sectionBackground';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';

export default function LandingPage({ data, interactive = true, className = '' }) {
  const labels = resolvePageLabels(data);
  const name = data.name || getLabel(labels, 'placeholders.psychologistName');
  const specialty = data.specialty || getLabel(labels, 'placeholders.specialty');
  const bookingCta = resolveBookingCta(data);
  const pageStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'page'), { sectionKey: 'page' });
  const footerStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'footer'), { sectionKey: 'footer' });
  const rootClassName = ['text-[#2A342D] font-sans min-h-full', className].filter(Boolean).join(' ');

  return (
    <div className={rootClassName} style={pageStyle}>
      <Navbar
        name={name}
        specialty={specialty}
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

      <footer className="border-t border-[#2A342D]/10 py-6 text-center" style={footerStyle}>
        <p className="text-xs text-[#2A342D]/50">
          © {new Date().getFullYear()} {name}. {getLabel(labels, 'footer.rightsReserved')}
        </p>
      </footer>
    </div>
  );
}
