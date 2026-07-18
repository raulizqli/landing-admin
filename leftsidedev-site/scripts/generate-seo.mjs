import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const siteUrl = 'https://leftsidedev.site';

const serviceSlugs = [
  'ai-agents',
  'rag-development',
  'mcp-development',
  'web-development',
  'mobile-development',
  'firebase-development',
  'react-development',
  'angular-development',
  'node-development',
  'php-development',
  'custom-software',
  'startup-mvp',
  'automation',
];

const caseSlugs = ['support-ai-agents', 'rag-knowledge-assistant', 'firebase-multi-tenant-cms'];
const portfolioSlugs = ['landing-cms', 'ops-agent-console', 'knowledge-rag'];
const blogSlugs = [
  'how-to-build-ai-agents',
  'cursor-vs-claude-code',
  'react-best-practices-2026',
  'angular-performance',
  'firebase-authentication-patterns',
  'building-rag-systems',
  'openai-responses-api',
  'n8n-automation-at-work',
  'ai-for-businesses',
];

const staticRoutes = [
  '/',
  '/services',
  '/case-studies',
  '/portfolio',
  '/blog',
  '/about',
  '/contact',
  '/estimate',
  '/resources',
];

const routes = [
  ...staticRoutes,
  ...serviceSlugs.map((slug) => `/services/${slug}`),
  ...caseSlugs.map((slug) => `/case-studies/${slug}`),
  ...portfolioSlugs.map((slug) => `/portfolio/${slug}`),
  ...blogSlugs.map((slug) => `/blog/${slug}`),
];

mkdirSync(publicDir, { recursive: true });

const today = new Date().toISOString().slice(0, 10);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (path) => `  <url>
    <loc>${siteUrl}${path === '/' ? '/' : path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${path.startsWith('/blog') ? 'weekly' : 'monthly'}</changefreq>
    <priority>${path === '/' ? '1.0' : path.split('/').length <= 2 ? '0.8' : '0.7'}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

writeFileSync(join(publicDir, 'sitemap.xml'), sitemap);

const rssItems = blogSlugs
  .map((slug) => {
    const title = slug
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    return `    <item>
      <title>${title}</title>
      <link>${siteUrl}/blog/${slug}</link>
      <guid>${siteUrl}/blog/${slug}</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>LeftSideDev technical article: ${title}</description>
    </item>`;
  })
  .join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>LeftSideDev Blog</title>
    <link>${siteUrl}/blog</link>
    <description>AI engineering, software architecture, and automation insights from LeftSideDev.</description>
    <language>en</language>
${rssItems}
  </channel>
</rss>
`;

writeFileSync(join(publicDir, 'rss.xml'), rss);

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none">
  <rect width="1200" height="630" fill="#070B0A"/>
  <circle cx="980" cy="120" r="220" fill="#7CFFB2" fill-opacity="0.12"/>
  <circle cx="200" cy="520" r="180" fill="#3D8BFF" fill-opacity="0.10"/>
  <text x="80" y="250" fill="#F4F7F5" font-family="Arial, sans-serif" font-size="72" font-weight="700">LeftSideDev</text>
  <text x="80" y="330" fill="#7CFFB2" font-family="Arial, sans-serif" font-size="40" font-weight="600">AI Engineering Studio</text>
  <text x="80" y="410" fill="#A8B5AE" font-family="Arial, sans-serif" font-size="28">AI-powered software · Automations · Custom systems</text>
</svg>`;

writeFileSync(join(publicDir, 'og-default.svg'), ogSvg);

console.log(`SEO artifacts written (${routes.length} sitemap URLs)`);
