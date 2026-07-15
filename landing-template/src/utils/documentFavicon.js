/**
 * Updates the document favicon to the page profile icon (navIconUrl).
 * Falls back to the static /favicon.svg when empty.
 */

const DEFAULT_FAVICON = '/favicon.svg';

function ensureIconLink() {
  let link = document.querySelector("link[rel='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  return link;
}

export function setDocumentFavicon(url) {
  const href = String(url ?? '').trim() || DEFAULT_FAVICON;
  const link = ensureIconLink();

  if (href.endsWith('.svg')) {
    link.type = 'image/svg+xml';
  } else if (href.startsWith('data:')) {
    link.removeAttribute('type');
  } else {
    link.type = 'image/png';
  }

  link.href = href;
}

export function resolvePageFaviconUrl(pageData) {
  const iconUrl = String(pageData?.navIconUrl ?? '').trim();
  return iconUrl || DEFAULT_FAVICON;
}
