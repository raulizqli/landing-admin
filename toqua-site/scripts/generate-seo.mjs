import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const siteUrl = 'https://toqua.site';
const langs = ['es', 'en'];

const professionSlugs = ['psychology', 'pediatrics', 'dental', 'legal'];
const blogSlugs = [
  'first-professional-page-checklist',
  'what-patients-look-for-online',
];

const staticPaths = [
  '',
  '/what-you-get',
  '/pricing',
  '/professions',
  '/how-it-works',
  '/faq',
  '/blog',
  '/resources',
  '/contact',
  '/compare',
];

const routes = [];
for (const lang of langs) {
  for (const path of staticPaths) {
    routes.push(`/${lang}${path}`);
  }
  for (const slug of professionSlugs) {
    routes.push(`/${lang}/professions/${slug}`);
  }
  for (const slug of blogSlugs) {
    routes.push(`/${lang}/blog/${slug}`);
  }
}

mkdirSync(publicDir, { recursive: true });

const today = new Date().toISOString().slice(0, 10);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${routes
  .map((path) => {
    const altLang = path.startsWith('/es') ? path.replace(/^\/es/, '/en') : path.replace(/^\/en/, '/es');
    return `  <url>
    <loc>${siteUrl}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${path.includes('/blog') ? 'weekly' : 'monthly'}</changefreq>
    <priority>${path === '/es' || path === '/en' ? '1.0' : path.split('/').length <= 3 ? '0.8' : '0.7'}</priority>
    <xhtml:link rel="alternate" hreflang="${path.startsWith('/es') ? 'es' : 'en'}" href="${siteUrl}${path}" />
    <xhtml:link rel="alternate" hreflang="${path.startsWith('/es') ? 'en' : 'es'}" href="${siteUrl}${altLang}" />
  </url>`;
  })
  .join('\n')}
</urlset>
`;

writeFileSync(join(publicDir, 'sitemap.xml'), sitemap);

const blogMeta = {
  'first-professional-page-checklist': {
    es: {
      title: 'Lista corta para tu primera página profesional',
      description:
        'Qué incluir en tu página antes de compartirla con clientes: datos de contacto, servicios y una foto clara.',
    },
    en: {
      title: 'A short checklist for your first professional page',
      description:
        'What to include before you share your page with clients: contact details, services, and a clear photo.',
    },
  },
  'what-patients-look-for-online': {
    es: {
      title: 'Qué buscan tus clientes cuando te buscan en internet',
      description:
        'Cómo se ve una página que genera confianza: claridad, ubicación y un siguiente paso fácil.',
    },
    en: {
      title: 'What clients look for when they search for you online',
      description:
        'How a trustworthy page looks: clarity, location, and an easy next step.',
    },
  },
};

const rssItems = blogSlugs
  .flatMap((slug) =>
    langs.map((lang) => {
      const meta = blogMeta[slug][lang];
      return `    <item>
      <title>${meta.title}</title>
      <link>${siteUrl}/${lang}/blog/${slug}</link>
      <guid>${siteUrl}/${lang}/blog/${slug}</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>${meta.description}</description>
    </item>`;
    }),
  )
  .join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Toqua Blog</title>
    <link>${siteUrl}/es/blog</link>
    <description>Tips claros para profesionales de la salud y servicios: tu página, confianza y primeros pasos.</description>
    <language>es</language>
${rssItems}
  </channel>
</rss>
`;

writeFileSync(join(publicDir, 'rss.xml'), rss);

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none">
  <rect width="1200" height="630" fill="#FCFBF9"/>
  <defs>
    <linearGradient id="q" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#B58FFF"/>
      <stop offset="35%" stop-color="#A074FF"/>
      <stop offset="70%" stop-color="#4D9CFF"/>
      <stop offset="100%" stop-color="#3FA9FF"/>
    </linearGradient>
  </defs>
  <circle cx="980" cy="140" r="240" fill="url(#q)" fill-opacity="0.28"/>
  <circle cx="180" cy="520" r="200" fill="url(#q)" fill-opacity="0.18"/>
  <text x="80" y="270" fill="#523677" font-family="Georgia, serif" font-size="88" font-weight="700">Toqua</text>
  <text x="80" y="350" fill="#6B6480" font-family="Arial, sans-serif" font-size="36" font-weight="600">CREATE. PUBLISH. READY.</text>
  <text x="80" y="430" fill="#6B6480" font-family="Arial, sans-serif" font-size="28">Tu página profesional, lista para que te contacten</text>
</svg>`;

writeFileSync(join(publicDir, 'og-default.svg'), ogSvg);

console.log(`SEO artifacts written (${routes.length} sitemap URLs)`);
