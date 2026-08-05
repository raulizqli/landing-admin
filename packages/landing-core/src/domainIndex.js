import { normalizeHostname } from './hostname.js';

/** World-readable domain → pageId map (F03 Step B). Anonymous clients must not list /pages. */
export const DOMAIN_INDEX_COLLECTION = 'domainIndex';

export function domainIndexDocId(hostname) {
  return normalizeHostname(hostname);
}

export function buildDomainIndexPayload(pageId, collectionName = 'pages') {
  const id = String(pageId ?? '').trim();
  const collection = collectionName === 'paginas' ? 'paginas' : 'pages';
  return {
    pageId: id,
    collectionName: collection,
    updatedAt: new Date().toISOString(),
  };
}
