import { useEffect, useId, useState } from 'react';
import Navbar from './Navbar';
import FooterLegalLinks from './FooterLegalLinks';
import { resolveBookingCta } from '@raulizqli/landing-core/bookingCta';
import { buildSectionBackgroundStyle, getSectionTheme } from '@raulizqli/landing-core/sectionBackground';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';
import { SECTION_IDS } from '@raulizqli/landing-core/sectionAnchors';
import { isFooterSectionEnabled } from '@raulizqli/landing-core/sectionVisibility';
import {
  buildExpeditionPath,
  findExpeditionDocument,
  formatExpeditionIssuedAt,
  getExpeditionDocumentLabel,
  getVisibleExpeditionDocuments,
  resolveExpeditionIssuer,
  slugifyExpeditionSegment,
} from '@raulizqli/landing-core/expeditionDocuments';

function downloadName(doc) {
  const path = String(doc.imageUrl || '').split('?')[0];
  const ext = (path.match(/\.([a-z0-9]+)$/i) || [])[1] || 'jpg';
  return `${slugifyExpeditionSegment(doc.slug || doc.documentType || doc.folio, 'documento')}.${ext}`;
}

function MetadataRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[minmax(8rem,11rem)_1fr] gap-x-4 gap-y-1 py-2 border-b border-current/10 last:border-b-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-current/50">{label}</dt>
      <dd className="text-sm text-current">{value}</dd>
    </div>
  );
}

function DocumentMetadata({ doc, issuer, licenseNumber, labels, language }) {
  return (
    <dl className="mt-6 rounded-2xl border border-current/10 bg-white/70 px-4 sm:px-5">
      <MetadataRow label={getLabel(labels, 'expedition.documentType')} value={doc.documentType} />
      <MetadataRow label={getLabel(labels, 'expedition.folio')} value={doc.folio} />
      <MetadataRow
        label={getLabel(labels, 'expedition.issuedAt')}
        value={formatExpeditionIssuedAt(doc.issuedAt, language)}
      />
      <MetadataRow label={getLabel(labels, 'expedition.issuer')} value={issuer} />
      <MetadataRow label={getLabel(labels, 'expedition.licenseNumber')} value={licenseNumber} />
    </dl>
  );
}

function DocumentViewer({
  doc,
  labels,
  showBackToList,
  issuer,
  licenseNumber,
  language,
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const heading = getExpeditionDocumentLabel(doc, getLabel(labels, 'expedition.pageTitle'));
  const alt = doc.alt || heading || getLabel(labels, 'expedition.imageAlt');

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <article className="max-w-3xl mx-auto">
      <h1 className="font-serif text-3xl sm:text-4xl text-current">
        {heading}
      </h1>
      <DocumentMetadata
        doc={doc}
        issuer={issuer}
        licenseNumber={licenseNumber}
        labels={labels}
        language={language}
      />
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          className="text-sm font-medium px-4 py-2 rounded-full border border-current/20 hover:bg-current/5"
          onClick={() => setOpen(true)}
        >
          {getLabel(labels, 'expedition.openFull')}
        </button>
        <a
          href={doc.imageUrl}
          download={downloadName(doc)}
          className="text-sm font-medium px-4 py-2 rounded-full text-current/70 hover:text-current"
        >
          {getLabel(labels, 'expedition.download')}
        </a>
        {showBackToList ? (
          <a
            href={buildExpeditionPath()}
            className="text-sm font-medium px-4 py-2 rounded-full text-current/70 hover:text-current"
          >
            {getLabel(labels, 'expedition.backToList')}
          </a>
        ) : null}
      </div>

      <figure className="mt-8 overflow-hidden rounded-2xl border border-current/10 bg-white">
        <button
          type="button"
          className="block w-full cursor-zoom-in p-2 sm:p-4"
          onClick={() => setOpen(true)}
          aria-label={getLabel(labels, 'expedition.openFull')}
        >
          <img src={doc.imageUrl} alt={alt} className="mx-auto h-auto w-full object-contain" />
        </button>
      </figure>

      {open ? (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={() => setOpen(false)}
        >
          <p id={titleId} className="sr-only">{alt}</p>
          <button
            type="button"
            className="absolute top-4 right-4 text-white/90 text-sm px-3 py-2 rounded-full border border-white/30 hover:bg-white/10"
            onClick={() => setOpen(false)}
          >
            {getLabel(labels, 'expedition.close')}
          </button>
          <img
            src={doc.imageUrl}
            alt={alt}
            className="max-h-full max-w-full object-contain rounded-xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </article>
  );
}

export default function ExpeditionDocumentsPage({
  data,
  pathInfo,
  interactive = true,
  onLanguageChange,
}) {
  const labels = resolvePageLabels(data);
  const name = data.name || getLabel(labels, 'placeholders.psychologistName');
  const specialty = data.specialty || getLabel(labels, 'placeholders.specialty');
  const showNavSpecialty = data.navShowSpecialty !== false;
  const navSpecialty = showNavSpecialty
    ? (String(data.navSpecialty ?? '').trim() || specialty)
    : '';
  const bookingCta = resolveBookingCta(data);
  const pageStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'page'), { sectionKey: 'page' });
  const footerStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'footer'), { sectionKey: 'footer' });
  const documents = getVisibleExpeditionDocuments(data);
  const issuer = resolveExpeditionIssuer(data);
  const licenseNumber = String(data.expeditionLicenseNumber ?? '').trim();
  const language = data.activeLanguage || data.labelLanguage || 'es';
  const selected = pathInfo?.slug ? findExpeditionDocument(documents, pathInfo.slug) : null;
  const showSingle = Boolean(selected) || (pathInfo?.list && documents.length === 1);
  const singleDoc = selected || (showSingle ? documents[0] : null);
  const notFound = Boolean(pathInfo?.slug) && !selected;

  return (
    <div className="font-sans min-h-full" style={pageStyle}>
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
        onLanguageChange={onLanguageChange}
        homeHref="/"
        hashPrefix="/"
      />

      <main className="max-w-5xl mx-auto px-5 py-12 sm:py-16">
        {singleDoc ? (
          <DocumentViewer
            doc={singleDoc}
            labels={labels}
            showBackToList={documents.length > 1}
            issuer={issuer}
            licenseNumber={licenseNumber}
            language={language}
          />
        ) : (
          <div className="max-w-3xl mx-auto">
            <h1 className="font-serif text-3xl sm:text-4xl text-current">
              {getLabel(labels, 'expedition.pageTitle')}
            </h1>
            {notFound ? (
              <p className="mt-4 text-sm text-current/60">{getLabel(labels, 'expedition.notFound')}</p>
            ) : null}
            {documents.length === 0 ? (
              <p className="mt-6 text-sm text-current/60">{getLabel(labels, 'expedition.empty')}</p>
            ) : (
              <ul className="mt-8 space-y-3">
                {documents.map((doc) => (
                  <li key={doc.id}>
                    <a
                      href={buildExpeditionPath(doc.slug)}
                      className="flex items-center gap-4 rounded-2xl border border-current/10 bg-white p-3 hover:border-current/25 transition-colors"
                    >
                      <img
                        src={doc.imageUrl}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-lg object-cover bg-current/10"
                      />
                      <span className="min-w-0">
                        <span className="block font-medium text-sm sm:text-base">
                          {getExpeditionDocumentLabel(doc, getLabel(labels, 'expedition.imageAlt'))}
                        </span>
                        <span className="mt-0.5 block text-xs text-current/55">
                          {[doc.folio, formatExpeditionIssuedAt(doc.issuedAt, language)].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-8">
              <a href="/" className="text-sm text-current/60 hover:text-current underline-offset-2 hover:underline">
                {getLabel(labels, 'expedition.backToSite')}
              </a>
            </p>
          </div>
        )}
      </main>

      {isFooterSectionEnabled(data) && (
        <footer
          id={SECTION_IDS.footer}
          className="border-t border-current/10 py-6 text-center"
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
                Toqua
              </a>
            ) : (
              <span>Toqua</span>
            )}
          </p>
        </footer>
      )}
    </div>
  );
}
