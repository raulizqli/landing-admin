
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
  const stored = extractMapsInput(data?.locationMapsUrl);
  const fallbackQuery = String(data?.location ?? '').trim();

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

export function shouldShowMapsEmbed(data, maps = resolveMapsUrls(data)) {
  if (data?.showLocationMap !== true) return false;
  return Boolean(maps.embedUrl);
}
