import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from './messages/en';
import es from './messages/es';
import {
  DEFAULT_ADMIN_LOCALE,
  normalizeAdminLocale,
  readStoredAdminLocale,
  translate,
  writeStoredAdminLocale,
} from './locale';

const CATALOG = { es, en };

const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_ADMIN_LOCALE;
    return readStoredAdminLocale();
  });

  useEffect(() => {
    writeStoredAdminLocale(locale);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = (next) => {
    setLocaleState(normalizeAdminLocale(next));
  };

  const value = useMemo(() => {
    const messages = CATALOG[locale] || CATALOG[DEFAULT_ADMIN_LOCALE];
    return {
      locale,
      setLocale,
      messages,
      t: (key, params) => translate(messages, key, params),
    };
  }, [locale]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
}

export function LanguageSwitcher({ className = '' }) {
  const { locale, setLocale, t } = useLocale();
  return (
    <label className={`inline-flex items-center gap-2 text-[10px] ${className}`}>
      <span className="uppercase tracking-wide opacity-60">{t('common.language')}</span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value)}
        className="rounded border border-current/20 bg-transparent px-1.5 py-1 text-[11px] outline-none"
        aria-label={t('common.language')}
      >
        <option value="es">{t('common.spanish')}</option>
        <option value="en">{t('common.english')}</option>
      </select>
    </label>
  );
}
