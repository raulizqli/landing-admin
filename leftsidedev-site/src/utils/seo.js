import { SITE } from '../content/site';

export function absoluteUrl(path = '/') {
  if (!path) return SITE.url;
  if (path.startsWith('http')) return path;
  return `${SITE.url}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildPageMeta({
  title,
  description,
  path = '/',
  image = SITE.ogImage,
  type = 'website',
  noIndex = false,
}) {
  const fullTitle = title.includes(SITE.name) ? title : `${title} · ${SITE.name}`;
  return {
    title: fullTitle,
    description,
    canonical: absoluteUrl(path),
    image: absoluteUrl(image),
    type,
    robots: noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
  };
}
