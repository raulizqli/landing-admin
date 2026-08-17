/**
 * Map Meta Graph API page + Instagram payloads into English page-model fields.
 * Keep in sync with functions/src/metaImport.ts (callable uses the same shape).
 */

import { normalizeVertical } from './verticals.js';

const CATEGORY_VERTICAL = [
  [/nail|spa|beauty|salon|cosmetic|hair|barber|est[eé]tic|maquill/i, 'beauty'],
  [/dentist|dental|odont/i, 'dental'],
  [/psycholog|therap|mental health|counsel/i, 'psychology'],
  [/lawyer|attorney|\blaw\b|legal|abogad/i, 'legal'],
  [/veterinar|\bvet\b|pet care/i, 'veterinary'],
  [/gym|fitness|yoga|personal train|coach/i, 'fitness'],
  [/school|educat|tutor|academ/i, 'education'],
  [/shop|store|boutique|e-?comm/i, 'ecommerce'],
  [/doctor|clinic|medical|physio|nutri/i, 'medical'],
];

export function inferVerticalFromCategory(category) {
  const text = String(category ?? '').trim();
  if (!text) return 'generic';
  const match = CATEGORY_VERTICAL.find(([pattern]) => pattern.test(text));
  return normalizeVertical(match ? match[1] : 'generic');
}

export function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function formatSingleLineAddress(location) {
  if (!location || typeof location !== 'object') return '';
  const parts = [
    location.street,
    location.city,
    location.state,
    location.zip,
    location.country,
  ]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean);
  return parts.join(', ');
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
}

function instagramHandleFromUrl(url) {
  const raw = String(url ?? '').trim();
  if (!raw) return '';
  try {
    const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    if (!/instagram\.com$/i.test(parsed.hostname)) return '';
    return parsed.pathname.replace(/^\/+/, '').split('/')[0].replace(/^@+/, '');
  } catch {
    return '';
  }
}

function facebookHandleFromPage(page = {}) {
  const username = String(page.username ?? '').trim();
  if (username) return username;
  const link = String(page.link ?? '').trim();
  if (!link) return '';
  try {
    const parsed = new URL(link);
    const slug = parsed.pathname.replace(/^\/+/, '').split('/')[0];
    if (!slug || slug === 'profile.php' || slug === 'pages') return '';
    return slug;
  } catch {
    return '';
  }
}

function pictureUrl(node) {
  if (typeof node === 'string') return node.trim();
  const fromData = node?.data?.url;
  if (fromData) return String(fromData).trim();
  if (node?.source) return String(node.source).trim();
  if (node?.url) return String(node.url).trim();
  return '';
}

function mapsSearchUrl(address) {
  const q = String(address ?? '').trim();
  if (!q) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function galleryFromMedia(media) {
  const data = Array.isArray(media?.data) ? media.data : Array.isArray(media) ? media : [];
  return data
    .filter((item) => {
      const type = String(item?.media_type ?? '').toUpperCase();
      return type === 'IMAGE' || type === 'CAROUSEL_ALBUM' || (!type && item?.media_url);
    })
    .slice(0, 8)
    .map((item) => ({
      imageUrl: String(item.media_url ?? '').trim(),
      caption: String(item.caption ?? '').trim().slice(0, 180),
      alt: String(item.caption ?? '').trim().slice(0, 120),
    }))
    .filter((item) => item.imageUrl);
}

/**
 * @param {{ page?: object, instagram?: object, fallbackVertical?: string }} input
 */
export function mapMetaGraphToDraft(input = {}) {
  const page = input.page && typeof input.page === 'object' ? input.page : {};
  const instagram = input.instagram && typeof input.instagram === 'object' ? input.instagram : {};
  const name = firstNonEmpty(page.name, instagram.name);
  const about = firstNonEmpty(page.about, page.description, instagram.biography);
  const specialty = firstNonEmpty(page.category, instagram.name && 'Instagram');
  const location = firstNonEmpty(
    page.single_line_address,
    formatSingleLineAddress(page.location),
  );
  const phone = digitsOnly(firstNonEmpty(page.whatsapp_number, page.phone));
  const email = Array.isArray(page.emails) ? String(page.emails[0] ?? '').trim() : '';
  const website = String(page.website ?? instagram.website ?? '').trim();
  const instagramHandle = firstNonEmpty(
    instagram.username,
    instagramHandleFromUrl(website),
  );
  const facebookHandle = facebookHandleFromPage(page);
  const coverUrl = pictureUrl(page.cover) || pictureUrl(instagram.profile_picture_url);
  const profileUrl = pictureUrl(page.picture) || pictureUrl(instagram.profile_picture_url);
  const galleryItems = galleryFromMedia(instagram.media);
  const vertical = inferVerticalFromCategory(
    firstNonEmpty(page.category, input.fallbackVertical),
  );
  const tagline = about ? about.split('. ')[0].slice(0, 160) : '';
  const hasWhatsapp = Boolean(digitsOnly(page.whatsapp_number)) || Boolean(phone);

  return {
    name,
    specialty: specialty && specialty.length < 80 ? specialty : '',
    vertical,
    navMode: profileUrl ? 'profile' : 'logo',
    navIconUrl: profileUrl,
    navLogoUrl: profileUrl,
    navCtaTarget: hasWhatsapp ? 'whatsapp' : email ? 'email' : 'link',
    navCtaLink: !hasWhatsapp && !email ? website : '',
    heroSectionEnabled: true,
    heroSlides: [
      {
        imageUrl: coverUrl,
        title: name,
        text: tagline || about.slice(0, 180),
        showTitle: true,
        showText: Boolean(tagline || about),
        showButtons: true,
        buttonsPosition: 'bottom-left',
      },
    ],
    heroTitle: name,
    heroSubtitle: tagline || about.slice(0, 180),
    aboutSectionEnabled: Boolean(about),
    aboutTagline: tagline,
    aboutBio: about,
    gallerySectionEnabled: galleryItems.length > 0,
    galleryItems,
    contactSectionEnabled: true,
    location,
    locationMapsUrl: mapsSearchUrl(location),
    showLocationMap: Boolean(location),
    email,
    phone,
    phoneIsWhatsapp: hasWhatsapp,
    socialSectionEnabled: true,
    instagram: instagramHandle,
    whatsapp: phone,
    facebook: facebookHandle,
    seo: {
      defaultTitle: name ? `${name}${specialty ? ` | ${specialty}` : ''}` : '',
      defaultDescription: about.slice(0, 160),
      ogImageUrl: coverUrl || profileUrl,
      canonicalBaseUrl: '',
    },
  };
}

export function summarizeMetaPages(accounts = []) {
  const list = Array.isArray(accounts) ? accounts : [];
  return list.map((item) => ({
    id: String(item.id ?? '').trim(),
    name: String(item.name ?? '').trim(),
    category: String(item.category ?? '').trim(),
    pictureUrl: pictureUrl(item.picture),
    hasInstagram: Boolean(item.instagram_business_account?.id),
  })).filter((item) => item.id);
}
