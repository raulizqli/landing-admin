
export function extractMapsInput(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return '';

  const iframeSrc = value.match(/src=["']([^"']+)["']/i)?.[1];
  if (iframeSrc) return iframeSrc;

  return value;
}

function buildEmbedFromLink(url) {
  const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) {
    return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&hl=es&z=15&output=embed`;
  }

  const placeMatch = url.match(/\/maps\/place\/([^/@?]+)/);
  if (placeMatch) {
    const query = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=es&z=15&output=embed`;
  }

  return `https://maps.google.com/maps?q=${encodeURIComponent(url)}&hl=es&z=15&output=embed`;
}

export function resolveMapsUrls(data) {
  const stored = extractMapsInput(data?.locationMapsUrl ?? data?.mapsUrl);
  const fallbackQuery = String(data?.location ?? data?.address ?? '').trim();

  if (!stored && !fallbackQuery) {
    return { embedUrl: '', linkUrl: '' };
  }

  if (stored.includes('/maps/embed')) {
    return { embedUrl: stored, linkUrl: stored };
  }

  if (/google\.com\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(stored)) {
    return {
      linkUrl: stored,
      embedUrl: buildEmbedFromLink(stored),
    };
  }

  const query = stored || fallbackQuery;
  const encoded = encodeURIComponent(query);
  return {
    linkUrl: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
    embedUrl: `https://maps.google.com/maps?q=${encoded}&hl=es&z=15&output=embed`,
  };
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
