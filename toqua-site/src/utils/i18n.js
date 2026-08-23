import { DEFAULT_LANG, isSupportedLang } from '../content/site';
import { nav as navEs } from '../content/es/nav';
import { nav as navEn } from '../content/en/nav';
import { home as homeEs } from '../content/es/home';
import { home as homeEn } from '../content/en/home';
import { pricing as pricingEs } from '../content/es/pricing';
import { pricing as pricingEn } from '../content/en/pricing';
import { professions as professionsEs, getProfession as getProfessionEs } from '../content/es/professions';
import { professions as professionsEn, getProfession as getProfessionEn } from '../content/en/professions';
import { faq as faqEs } from '../content/es/faq';
import { faq as faqEn } from '../content/en/faq';
import { blog as blogEs, getPost as getPostEs } from '../content/es/blog';
import { blog as blogEn, getPost as getPostEn } from '../content/en/blog';
import * as pagesEs from '../content/es/pages';
import * as pagesEn from '../content/en/pages';
import { legal as legalEs } from '../content/es/legal';
import { legal as legalEn } from '../content/en/legal';
import { about as aboutEs } from '../content/es/about';
import { about as aboutEn } from '../content/en/about';

const catalogs = {
  es: {
    nav: navEs,
    home: homeEs,
    pricing: pricingEs,
    professions: professionsEs,
    faq: faqEs,
    blog: blogEs,
    howItWorks: pagesEs.howItWorks,
    whatYouGet: pagesEs.whatYouGet,
    resources: pagesEs.resources,
    contact: pagesEs.contact,
    compare: pagesEs.compare,
    notFound: pagesEs.notFound,
    legal: legalEs,
    about: aboutEs,
    getProfession: getProfessionEs,
    getPost: getPostEs,
  },
  en: {
    nav: navEn,
    home: homeEn,
    pricing: pricingEn,
    professions: professionsEn,
    faq: faqEn,
    blog: blogEn,
    howItWorks: pagesEn.howItWorks,
    whatYouGet: pagesEn.whatYouGet,
    resources: pagesEn.resources,
    contact: pagesEn.contact,
    compare: pagesEn.compare,
    notFound: pagesEn.notFound,
    legal: legalEn,
    about: aboutEn,
    getProfession: getProfessionEn,
    getPost: getPostEn,
  },
};

export function normalizeLang(lang) {
  return isSupportedLang(lang) ? lang : DEFAULT_LANG;
}

export function getMessages(lang) {
  return catalogs[normalizeLang(lang)];
}

/** Swap /es ↔ /en while keeping the rest of the English path segments. */
export function swapLangPath(pathname, nextLang) {
  const target = normalizeLang(nextLang);
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return `/${target}`;
  if (isSupportedLang(parts[0])) {
    parts[0] = target;
    return `/${parts.join('/')}`;
  }
  return `/${target}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

export function langPath(lang, path = '') {
  const base = `/${normalizeLang(lang)}`;
  if (!path || path === '/') return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
