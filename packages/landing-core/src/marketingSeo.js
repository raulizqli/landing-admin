/**
 * Build sitemap.xml / rss.xml / robots.txt for Marketing Site pages.
 */

import {
  isMarketingSite,
  normalizeMarketingRoutes,
} from './marketingSite.js';

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function resolveBaseUrl(pageData = {}) {
  const fromSeo = String(pageData?.seo?.canonicalBaseUrl ?? '').trim().replace(/\/$/, '');
  if (fromSeo) return fromSeo;
  const domain = String(pageData?.customDomain ?? '').trim().replace(/^www\./, '');
  if (domain) return `https://${domain}`;
  return '';
}

export function listMarketingSitemapPaths(pageData = {}) {
  if (!isMarketingSite(pageData)) return ['/'];
  const routes = normalizeMarketingRoutes(pageData.marketingRoutes).filter((route) => route.enabled);
  const paths = routes.map((route) => route.path || '/');
  if (!paths.includes('/')) paths.unshift('/');
  return [...new Set(paths)];
}

export function buildMarketingSitemapXml(pageData = {}, { lastmod = new Date() } = {}) {
  const base = resolveBaseUrl(pageData);
  if (!base) return '';
  const mod = (lastmod instanceof Date ? lastmod : new Date(lastmod)).toISOString().slice(0, 10);
  const urls = listMarketingSitemapPaths(pageData).map((path) => {
    const loc = path === '/' ? `${base}/` : `${base}${path}`;
    const priority = path === '/' ? '1.0' : path.split('/').length <= 2 ? '0.8' : '0.7';
    const changefreq = path.startsWith('/blog') ? 'weekly' : 'monthly';
    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${mod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

export function buildMarketingRssXml(pageData = {}, { pubDate = new Date() } = {}) {
  const base = resolveBaseUrl(pageData);
  if (!base) return '';
  const name = String(pageData?.name ?? 'Blog').trim() || 'Blog';
  const description = String(
    pageData?.seo?.defaultDescription
      || pageData?.marketing?.primaryCta?.label
      || `${name} updates`,
  ).trim();
  const posts = normalizeMarketingRoutes(pageData.marketingRoutes)
    .filter((route) => route.enabled && route.type === 'blog_post')
    .sort((a, b) => String(b.content?.date || '').localeCompare(String(a.content?.date || '')));

  const dateStr = (pubDate instanceof Date ? pubDate : new Date(pubDate)).toUTCString();
  const items = posts.map((post) => {
    const link = `${base}${post.path}`;
    const title = post.seo?.title || post.title || post.slug;
    const desc = post.seo?.description || post.content?.excerpt || title;
    const itemDate = post.content?.date
      ? new Date(`${post.content.date}T12:00:00.000Z`).toUTCString()
      : dateStr;
    return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid>${escapeXml(link)}</guid>
      <pubDate>${escapeXml(itemDate)}</pubDate>
      <description>${escapeXml(desc)}</description>
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(`${name} Blog`)}</title>
    <link>${escapeXml(`${base}/blog`)}</link>
    <description>${escapeXml(description)}</description>
    <language>en</language>
    <lastBuildDate>${escapeXml(dateStr)}</lastBuildDate>
${items.join('\n')}
  </channel>
</rss>
`;
}

export function buildMarketingRobotsTxt(pageData = {}) {
  const base = resolveBaseUrl(pageData);
  const lines = ['User-agent: *', 'Allow: /', ''];
  if (base) lines.push(`Sitemap: ${base}/sitemap.xml`);
  return `${lines.join('\n')}\n`;
}

export function buildMarketingSeoArtifacts(pageData = {}, options = {}) {
  const now = options.now || new Date();
  return {
    sitemapXml: buildMarketingSitemapXml(pageData, { lastmod: now }),
    rssXml: buildMarketingRssXml(pageData, { pubDate: now }),
    robotsTxt: buildMarketingRobotsTxt(pageData),
    generatedAt: (now instanceof Date ? now : new Date(now)).toISOString(),
    baseUrl: resolveBaseUrl(pageData),
  };
}
