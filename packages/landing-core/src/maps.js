/**
 * Google Maps URL helpers with strict HTTPS host allowlisting (F13).
 * Never pass untrusted URLs straight into iframe src.
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

function isAllowedMapsShareUrl(url) {
  if (!url || !isGoogleMapsHostname(url.hostname)) return false;
  const path = url.pathname.toLowerCase();
  return (
    path.includes('/maps')
    || path.includes('/maps/embed')
    || path === '/url'
    || url.hostname.toLowerCase() === 'maps.app.goo.gl'
    || url.hostname.toLowerCase() === 'goo.gl'
  );
}

function isSafeGoogleMapsEmbedUrl(url) {
  if (!url || !isGoogleMapsHostname(url.hostname)) return false;
  const path = url.pathname.toLowerCase();
  if (path.includes('/maps/embed')) return true;
  if (path.includes('/maps') && url.searchParams.get('output') === 'embed') return true;
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

function buildEmbedFromLink(urlString) {
  const coordMatch = urlString.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) {
    return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&hl=es&z=15&output=embed`;
  }

  const placeMatch = urlString.match(/\/maps\/place\/([^/@?]+)/);
  if (placeMatch) {
    const query = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=es&z=15&output=embed`;
  }

  // Never echo an arbitrary URL into q= if it is not an allowed Maps share link.
  const parsed = parseHttpsUrl(urlString);
  if (parsed && isAllowedMapsShareUrl(parsed)) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(urlString)}&hl=es&z=15&output=embed`;
  }

  return '';
}

function embedFromAddressQuery(query) {
  const encoded = encodeURIComponent(query);
  return {
    linkUrl: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
    embedUrl: `https://maps.google.com/maps?q=${encoded}&hl=es&z=15&output=embed`,
  };
}

export function resolveMapsUrls(data) {
  const stored = extractMapsInput(data?.locationMapsUrl ?? data?.mapsUrl);
  const fallbackQuery = String(data?.location ?? data?.address ?? '').trim();

  if (!stored && !fallbackQuery) {
    return { embedUrl: '', linkUrl: '' };
  }

  if (stored) {
    if (looksLikeAbsoluteUrl(stored)) {
      const parsed = parseHttpsUrl(stored);
      if (!parsed || !isAllowedMapsShareUrl(parsed)) {
        // Reject malicious / non-Maps absolute URLs; fall back to address text if any.
        return fallbackQuery ? embedFromAddressQuery(fallbackQuery) : { embedUrl: '', linkUrl: '' };
      }

      if (isSafeGoogleMapsEmbedUrl(parsed)) {
        const embedUrl = parsed.toString();
        return { embedUrl, linkUrl: embedUrl };
      }

      const embedUrl = buildEmbedFromLink(stored);
      if (embedUrl) {
        return { linkUrl: stored, embedUrl };
      }
      return fallbackQuery ? embedFromAddressQuery(fallbackQuery) : { embedUrl: '', linkUrl: stored };
    }

    // Plain-text place / address (not an absolute URL)
    return embedFromAddressQuery(stored);
  }

  return embedFromAddressQuery(fallbackQuery);
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

export const CONTACT_MAP_LAYOUTS = [
  { value: 'below', label: 'Debajo del contacto' },
  { value: 'beside', label: 'Al lado (escritorio)' },
];

export function normalizeContactMapLayout(value) {
  return value === 'beside' ? 'beside' : 'below';
}
