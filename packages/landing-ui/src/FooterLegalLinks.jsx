import { useState } from 'react';
import { getEnabledLegalDocuments } from '@raulizqli/landing-core/legalDocuments';
import LegalDocumentDialog from './LegalDocumentDialog.jsx';

export default function FooterLegalLinks({ data, interactive = true }) {
  const documents = getEnabledLegalDocuments(data);
  const [activeKind, setActiveKind] = useState(null);

  if (!documents.length) return null;

  const activeDoc = documents.find((doc) => doc.kind === activeKind) || null;

  return (
    <>
      <nav
        className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs"
        aria-label={data?.labelLanguage === 'en' ? 'Legal documents' : 'Documentos legales'}
      >
        {documents.map((doc, index) => {
          const linkClass = 'opacity-60 hover:opacity-100 underline-offset-2 hover:underline transition-opacity';
          return (
            <span key={doc.kind} className="inline-flex items-center gap-3">
              {index > 0 && <span className="opacity-30 select-none" aria-hidden>|</span>}
              {interactive ? (
                <button
                  type="button"
                  className={linkClass}
                  onClick={() => setActiveKind(doc.kind)}
                >
                  {doc.title}
                </button>
              ) : (
                <span className={linkClass}>{doc.title}</span>
              )}
            </span>
          );
        })}
      </nav>

      {interactive && (
        <LegalDocumentDialog
          open={Boolean(activeDoc)}
          title={activeDoc?.title}
          body={activeDoc?.body}
          data={data}
          onClose={() => setActiveKind(null)}
        />
      )}
    </>
  );
}
