import { useEffect } from 'react';
import { LanguageSwitcher, useLocale } from '../i18n/LocaleContext';
import {
  PLATFORM_LEGAL_KINDS,
  PLATFORM_LEGAL_PATHS,
  PLATFORM_PRODUCT_NAME,
  getPlatformLegalDocument,
} from '../utils/platformLegal';

const LABEL_KEYS = {
  privacy: 'legal.privacy',
  terms: 'legal.terms',
  dataDeletion: 'legal.dataDeletion',
};

export function PlatformLegalLinks({ className = '', linkClassName = '' }) {
  const { t } = useLocale();

  return (
    <nav className={className} aria-label={t('legal.navAria')}>
      {PLATFORM_LEGAL_KINDS.map((kind, index) => (
        <span key={kind} className="inline-flex items-center gap-2">
          {index > 0 ? <span className="opacity-30 select-none" aria-hidden>·</span> : null}
          <a href={PLATFORM_LEGAL_PATHS[kind]} className={linkClassName}>
            {t(LABEL_KEYS[kind])}
          </a>
        </span>
      ))}
    </nav>
  );
}

export default function LegalPublicPage({ kind }) {
  const { locale, t } = useLocale();
  const doc = getPlatformLegalDocument(kind, locale);

  useEffect(() => {
    const previous = document.title;
    document.title = `${doc.title} · ${PLATFORM_PRODUCT_NAME}`;
    return () => {
      document.title = previous;
    };
  }, [doc.title]);

  return (
    <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden bg-[#081810] font-sans">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <a
            href="/login"
            className="text-[11px] font-semibold text-[#40B850] hover:underline underline-offset-2"
          >
            ← {t('legal.backToLogin')}
          </a>
          <LanguageSwitcher className="text-white/80" />
        </div>

        <article className="rounded-2xl border border-white/10 bg-white p-8 shadow-xl text-[#101820]">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#40B850] font-semibold mb-2">
            {PLATFORM_PRODUCT_NAME}
          </p>
          <h1 className="font-serif text-3xl text-[#101820]">{doc.title}</h1>
          <p className="mt-2 text-sm text-[#101820]/55">
            {t('legal.updated', { date: doc.updated })}
          </p>

          <PlatformLegalLinks
            className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
            linkClassName="font-semibold text-[#40B850] hover:underline underline-offset-2"
          />

          <div className="mt-8 space-y-8">
                {doc.sections.map((section) => (
              <section key={section.heading} className="space-y-3">
                <h2 className="font-serif text-xl text-[#101820]">{section.heading}</h2>
                {section.paragraphs.map((paragraph, index) => (
                  <p key={`${section.heading}-${index}`} className="text-sm leading-relaxed text-[#101820]/80">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <p className="mt-10 text-xs text-[#101820]/50">
            {t('legal.contactLabel')}{' '}
            <a className="font-semibold text-[#40B850] hover:underline" href={`mailto:${doc.email}`}>
              {doc.email}
            </a>
          </p>
        </article>
      </div>
    </div>
  );
}
