import { SITE } from '../content/site';
import { normalizeLang } from './i18n';

export function absoluteUrl(path = '/') {
  if (!path) return SITE.url;
  if (path.startsWith('http')) return path;
  return `${SITE.url}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildPageMeta({
  title,
  description,
  path = '/',
  lang = 'es',
  image = SITE.ogImage,
  type = 'website',
  noIndex = false,
}) {
  const resolvedLang = normalizeLang(lang);
  const fullTitle = title.includes(SITE.name) ? title : `${title} · ${SITE.name}`;
  return {
    title: fullTitle,
    description,
    canonical: absoluteUrl(path),
    image: absoluteUrl(image),
    type,
    lang: resolvedLang,
    locale: SITE.locales[resolvedLang],
    robots: noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
  };
}
