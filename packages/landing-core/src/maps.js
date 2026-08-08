/**
 * Google Maps URL helpers with strict HTTPS host allowlisting (F13).
 * Never pass untrusted URLs straight into iframe src.
 *
 * Priority for embeds:
 * 1. Usable Maps share / embed URL in mapsUrl
 * 2. Visible address / place text (fallback when the link is missing or invalid)
 */

const GOOGLE_MAPS_HOSTS = new Set([
  'www.google.com',
  'google.com',
  'maps.google.com',
  'maps.app.goo.gl',
  'goo.gl',
]);

function parseHttpsUrl(raw) {
  try {
    const url = new URL(String(raw ?? '').trim());
    if (url.protocol !== 'https:') return null;
    if (url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

function isGoogleMapsHostname(hostname) {
  const host = String(hostname ?? '').trim().toLowerCase();
  if (!host) return false;
  if (GOOGLE_MAPS_HOSTS.has(host)) return true;
  // Regional Google domains used for Maps share links (google.com.mx, google.co.uk, …)
  return /^([a-z0-9-]+\.)*google\.[a-z.]+$/i.test(host);
}

function hasMapsQuery(url) {
  if (!url) return false;
  return Boolean(
    url.searchParams.get('q')
    || url.searchParams.get('query')
    || url.searchParams.get('pb')
    || url.searchParams.get('cid'),
  );
}

function isAllowedMapsShareUrl(url) {
  if (!url || !isGoogleMapsHostname(url.hostname)) return false;
  const host = url.hostname.toLowerCase();
  if (host === 'maps.app.goo.gl' || host === 'goo.gl') return true;

  const path = url.pathname.toLowerCase();
  // Classic share formats:
  // - https://maps.google.com/?q=Monterrey+Nuevo+Leon  (path `/`)
  // - https://www.google.com/maps/place/...
  // - https://www.google.com/maps/embed?pb=...
  if (path.includes('/maps')) return true;
  if (path === '/url') return true;
  if ((host === 'maps.google.com' || host === 'google.com' || host === 'www.google.com')
    && hasMapsQuery(url)) {
    return true;
  }
  return false;
}

function isSafeGoogleMapsEmbedUrl(url) {
  if (!url || !isGoogleMapsHostname(url.hostname)) return false;
  const path = url.pathname.toLowerCase();
  if (path.includes('/maps/embed')) return true;
  if (path.includes('/maps') && url.searchParams.get('output') === 'embed') return true;
  if (url.searchParams.get('output') === 'embed' && hasMapsQuery(url)) return true;
  return false;
}

function looksLikeAbsoluteUrl(value) {
  return /^[a-z][a-z0-9+.-]*:/i.test(String(value ?? '').trim());
}

export function extractMapsInput(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return '';

  const iframeSrc = value.match(/src=["']([^"']+)["']/i)?.[1];
  if (iframeSrc) return iframeSrc.trim();

  return value;
}

function embedFromAddressQuery(query) {
  const encoded = encodeURIComponent(query);
  return {
    linkUrl: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
    embedUrl: `https://maps.google.com/maps?q=${encoded}&hl=es&z=15&output=embed`,
  };
}

function buildEmbedFromLink(urlString) {
  const parsed = parseHttpsUrl(urlString);
  if (!parsed || !isAllowedMapsShareUrl(parsed)) return '';

  if (isSafeGoogleMapsEmbedUrl(parsed)) {
    return parsed.toString();
  }

  const coordMatch = urlString.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) {
    return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&hl=es&z=15&output=embed`;
  }

  const placeMatch = urlString.match(/\/maps\/place\/([^/@?]+)/);
  if (placeMatch) {
    const query = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=es&z=15&output=embed`;
  }

  const searchQuery = parsed.searchParams.get('q') || parsed.searchParams.get('query');
  if (searchQuery) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(searchQuery)}&hl=es&z=15&output=embed`;
  }

  // Short links (goo.gl / maps.app.goo.gl) can't be expanded server-side; embed via q= of the URL
  // is unreliable — return empty so callers fall back to the visible address.
  if (parsed.hostname.toLowerCase() === 'maps.app.goo.gl'
    || parsed.hostname.toLowerCase() === 'goo.gl') {
    return '';
  }

  // Last resort for allowlisted Maps URLs without an extractable query.
  return `https://maps.google.com/maps?q=${encodeURIComponent(urlString)}&hl=es&z=15&output=embed`;
}

/**
 * @returns {{ embedUrl: string, linkUrl: string, source: 'mapsUrl' | 'address' | '' }}
 */
export function resolveMapsUrls(data) {
  const stored = extractMapsInput(data?.locationMapsUrl ?? data?.mapsUrl);
  const fallbackQuery = String(data?.location ?? data?.address ?? '').trim();
  const fromAddress = () => (
    fallbackQuery
      ? { ...embedFromAddressQuery(fallbackQuery), source: 'address' }
      : { embedUrl: '', linkUrl: '', source: '' }
  );

  if (!stored && !fallbackQuery) {
    return { embedUrl: '', linkUrl: '', source: '' };
  }

  if (!stored) {
    return fromAddress();
  }

  if (looksLikeAbsoluteUrl(stored)) {
    const parsed = parseHttpsUrl(stored);
    if (!parsed || !isAllowedMapsShareUrl(parsed)) {
      // Bad / non-Maps absolute URL → visible address wins.
      return fromAddress();
    }

    if (isSafeGoogleMapsEmbedUrl(parsed)) {
      const embedUrl = parsed.toString();
      return { embedUrl, linkUrl: embedUrl, source: 'mapsUrl' };
    }

    const embedUrl = buildEmbedFromLink(stored);
    if (embedUrl) {
      return { linkUrl: stored, embedUrl, source: 'mapsUrl' };
    }
    // Allowlisted but not embeddable (e.g. short link) → address fallback.
    return fromAddress();
  }

  // Plain-text place pasted into the Maps field.
  return { ...embedFromAddressQuery(stored), source: 'mapsUrl' };
}

export function resolveMapsUrlsForLocation(location = {}) {
  return resolveMapsUrls({
    location: location.address,
    locationMapsUrl: location.mapsUrl,
  });
}

export function shouldShowMapsEmbed(data, maps = resolveMapsUrls(data)) {
  if (data?.showLocationMap !== true && data?.showMap !== true) return false;
  return Boolean(maps.embedUrl);
}

export function shouldShowLocationMap(location = {}) {
  if (location?.showMap !== true) return false;
  return Boolean(resolveMapsUrlsForLocation(location).embedUrl);
}

/** True when mapsUrl is set but cannot produce an embed without the visible address. */
export function mapsUrlNeedsAddressFallback(location = {}) {
  const stored = extractMapsInput(location?.mapsUrl ?? '');
  if (!stored) return false;
  const withoutAddress = resolveMapsUrls({
    locationMapsUrl: stored,
    location: '',
  });
  if (withoutAddress.embedUrl) return false;
  return Boolean(String(location?.address ?? '').trim());
}

export const CONTACT_MAP_LAYOUTS = [
  { value: 'below', label: 'Debajo del contacto' },
  { value: 'beside', label: 'Al lado (escritorio)' },
];

export function normalizeContactMapLayout(value) {
  return value === 'beside' ? 'beside' : 'below';
}
