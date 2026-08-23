import { SITE } from '../content/site';
import { absoluteUrl } from './seo';
import { normalizeLang } from './i18n';
import { getPlanSchemaPrice, planHasDisplayPrice } from './pricing';

export function organizationSchema(lang = 'es') {
  const resolved = normalizeLang(lang);
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'SoftwareApplication'],
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    logo: absoluteUrl('/brand/toqua-mark-square-dark.png'),
    email: SITE.email,
    description: SITE.tagline[resolved],
    foundingDate: String(SITE.foundingYear),
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: resolved,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'MX',
    },
  };
}

export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqSchema(faqs = []) {
  if (!faqs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function articleSchema(post, lang = 'es') {
  const resolved = normalizeLang(lang);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.date,
    dateModified: post.date,
    description: post.excerpt,
    inLanguage: resolved,
    author: {
      '@type': 'Organization',
      name: SITE.name,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/brand/toqua-mark-square-dark.png'),
      },
    },
    mainEntityOfPage: absoluteUrl(`/${resolved}/blog/${post.slug}`),
  };
}

export function websiteSchema(lang = 'es') {
  const resolved = normalizeLang(lang);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    description: SITE.tagline[resolved],
    inLanguage: resolved,
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
    },
  };
}

export function offerCatalogSchema(plans, lang = 'es') {
  const resolved = normalizeLang(lang);
  return {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'Toqua plans',
    url: absoluteUrl(`/${resolved}/pricing`),
    itemListElement: plans
      .filter((plan) => planHasDisplayPrice(plan))
      .map((plan, index) => {
        const { price, priceCurrency } = getPlanSchemaPrice(plan, resolved);
        return {
        '@type': 'Offer',
        position: index + 1,
        name: plan.name,
        description: plan.blurb,
        price,
        priceCurrency,
        url: absoluteUrl(`/${resolved}/pricing`),
      };
      }),
  };
}
