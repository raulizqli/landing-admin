/**
 * Best-effort public URL for opening a landing in a new tab.
 * Prefers the configured hosting URL, then custom domain, then template preview.
 */
export function resolvePageOpenUrl({
  pageId,
  hostingPublicUrl = '',
  customDomain = '',
  language = '',
} = {}) {
  const id = String(pageId ?? '').trim();
  if (!id) return '';

  const hosted = String(hostingPublicUrl ?? '').trim().replace(/\/+$/, '');
  if (hosted) {
    try {
      const url = new URL(hosted.includes('://') ? hosted : `https://${hosted}`);
      if (language) url.searchParams.set('lang', language);
      return url.toString();
    } catch {
      return hosted;
    }
  }

  const domain = String(customDomain ?? '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  if (domain) {
    try {
      const url = new URL(`https://${domain}`);
      if (language) url.searchParams.set('lang', language);
      return url.toString();
    } catch {
      return `https://${domain}`;
    }
  }

  const templatePreview = (
    String(import.meta.env.VITE_TEMPLATE_PREVIEW_URL ?? '').trim()
    || (import.meta.env.DEV ? 'http://localhost:5174' : '')
  ).replace(/\/+$/, '');
  if (!templatePreview) return '';

  try {
    const url = new URL(templatePreview.includes('://') ? templatePreview : `https://${templatePreview}`);
    url.searchParams.set('pageId', id);
    if (language) url.searchParams.set('lang', language);
    return url.toString();
  } catch {
    const langQuery = language ? `&lang=${encodeURIComponent(language)}` : '';
    return `${templatePreview}?pageId=${encodeURIComponent(id)}${langQuery}`;
  }
}
