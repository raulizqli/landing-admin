import { useEffect } from 'react';
import { SITE } from '../../content/site';
import { swapLangPath } from '../../utils/i18n';

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}

function upsertCanonical(href) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function upsertAlternate(hreflang, href) {
  let element = document.head.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'alternate');
    element.setAttribute('hreflang', hreflang);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function upsertJsonLd(id, data) {
  const existing = document.getElementById(id);
  if (!data) {
    existing?.remove();
    return;
  }
  const script = existing || document.createElement('script');
  script.type = 'application/ld+json';
  script.id = id;
  script.textContent = JSON.stringify(data);
  if (!existing) document.head.appendChild(script);
}

export default function Seo({ meta, schemas = [] }) {
  useEffect(() => {
    document.title = meta.title;
    document.documentElement.lang = meta.lang || 'es';

    upsertMeta('meta[name="description"]', { name: 'description', content: meta.description });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: meta.robots });
    upsertCanonical(meta.canonical);

    const pathFromCanonical = meta.canonical.replace(SITE.url, '') || '/';
    upsertAlternate('es', `${SITE.url}${swapLangPath(pathFromCanonical, 'es')}`);
    upsertAlternate('en', `${SITE.url}${swapLangPath(pathFromCanonical, 'en')}`);
    upsertAlternate('x-default', `${SITE.url}${swapLangPath(pathFromCanonical, 'es')}`);

    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: meta.type });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE.name });
    upsertMeta('meta[property="og:locale"]', {
      property: 'og:locale',
      content: meta.locale || SITE.locales.es,
    });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: meta.title });
    upsertMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: meta.description,
    });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: meta.canonical });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: meta.image });

    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: meta.title });
    upsertMeta('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: meta.description,
    });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: meta.image });

    const list = schemas.filter(Boolean);
    list.forEach((schema, index) => {
      upsertJsonLd(`toqua-schema-${index}`, schema);
    });

    let index = list.length;
    while (document.getElementById(`toqua-schema-${index}`)) {
      document.getElementById(`toqua-schema-${index}`)?.remove();
      index += 1;
    }
  }, [meta, schemas]);

  return null;
}
