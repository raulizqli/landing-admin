import { createContentId, normalizeContentId } from './contentIds.js';

export const EXPEDITION_PATH = '/expedicion';

export function createEmptyExpeditionDocument() {
  return {
    id: createContentId('expedition'),
    documentType: '',
    folio: '',
    issuedAt: '',
    slug: '',
    imageUrl: '',
    alt: '',
  };
}

export function slugifyExpeditionSegment(value, fallback = 'documento') {
  const slug = String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return slug || fallback;
}

function uniqueSlug(base, used) {
  let slug = base;
  let n = 2;
  while (used.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  used.add(slug);
  return slug;
}

export function normalizeIsoDate(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() + 1 !== month
    || date.getUTCDate() !== day
  ) {
    return '';
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
}

export function formatExpeditionIssuedAt(value, language = 'es') {
  const iso = normalizeIsoDate(value);
  if (!iso) return '';
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function normalizeExpeditionDocument(item = {}, index = 0, usedSlugs = new Set()) {
  const id = normalizeContentId(item.id, `expedition-${index + 1}`);
  const documentType = String(item.documentType || item.title || '').trim();
  const folio = String(item.folio ?? '').trim();
  const requested = slugifyExpeditionSegment(
    item.slug || documentType || folio || id,
    `documento-${index + 1}`,
  );
  return {
    id,
    documentType,
    folio,
    issuedAt: normalizeIsoDate(item.issuedAt),
    slug: uniqueSlug(requested, usedSlugs),
    imageUrl: String(item.imageUrl ?? '').trim(),
    alt: String(item.alt ?? '').trim(),
  };
}

export function normalizeExpeditionDocuments(items) {
  if (!Array.isArray(items)) return [];
  const usedSlugs = new Set();
  return items.map((item, index) => normalizeExpeditionDocument(item, index, usedSlugs));
}

export function normalizeExpeditionIssuerFields(data = {}) {
  return {
    expeditionIssuerName: String(data.expeditionIssuerName ?? '').trim(),
    expeditionLicenseNumber: String(data.expeditionLicenseNumber ?? '').trim(),
  };
}

export function resolveExpeditionIssuer(data = {}) {
  return String(data.expeditionIssuerName ?? '').trim()
    || String(data.name ?? '').trim();
}

export function getExpeditionDocumentLabel(doc, fallback = '') {
  return String(doc?.documentType || doc?.folio || fallback).trim();
}

export function getVisibleExpeditionDocuments(data) {
  return normalizeExpeditionDocuments(data?.expeditionDocuments).filter((item) => Boolean(item.imageUrl));
}

export function findExpeditionDocument(documents, slugOrId) {
  const needle = String(slugOrId ?? '').trim();
  if (!needle) return null;
  return documents.find((item) => item.slug === needle || item.id === needle) || null;
}

export function buildExpeditionPath(slug = '') {
  const clean = String(slug ?? '').trim();
  return clean ? `${EXPEDITION_PATH}/${encodeURIComponent(clean)}` : EXPEDITION_PATH;
}

/**
 * @returns {{ list: boolean, slug: string } | null}
 */
export function parseExpeditionPath(pathname) {
  const raw = String(pathname || '/').split('?')[0];
  const path = raw.length > 1 ? raw.replace(/\/+$/, '') : '/';
  if (path === EXPEDITION_PATH) return { list: true, slug: '' };
  if (!path.startsWith(`${EXPEDITION_PATH}/`)) return null;
  const rest = path.slice(EXPEDITION_PATH.length + 1);
  if (!rest || rest.includes('/')) return null;
  let slug = rest;
  try {
    slug = decodeURIComponent(rest);
  } catch {
    // Keep the raw segment if it is not a valid encoding.
  }
  slug = String(slug).trim();
  if (!slug) return null;
  return { list: false, slug };
}

export function buildExpeditionPublicUrl(baseUrl, slug = '') {
  const raw = String(baseUrl ?? '').trim();
  if (!raw) return '';
  const href = raw.includes('://') ? raw : `https://${raw}`;
  try {
    const url = new URL(href);
    url.pathname = buildExpeditionPath(slug);
    return url.toString();
  } catch {
    return '';
  }
}
