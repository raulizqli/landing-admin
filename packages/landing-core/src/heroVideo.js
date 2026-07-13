
export function resolveHeroVideo(url) {
  const raw = String(url ?? '').trim();
  if (!raw) return null;

  const youtubeId = extractYoutubeId(raw);
  if (youtubeId) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&rel=0&modestbranding=1&playsinline=1`,
    };
  }

  const vimeoId = extractVimeoId(raw);
  if (vimeoId) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&loop=1&muted=1`,
    };
  }

  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(raw)) {
    return { type: 'file', videoSrc: raw };
  }

  if (/youtube\.com\/embed\//i.test(raw) || /player\.vimeo\.com/i.test(raw)) {
    return { type: 'embed', embedUrl: raw };
  }

  return null;
}

export function resolveSectionVideo(url) {
  const raw = String(url ?? '').trim();
  if (!raw) return null;

  const youtubeId = extractYoutubeId(raw);
  if (youtubeId) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`,
    };
  }

  const vimeoId = extractVimeoId(raw);
  if (vimeoId) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
    };
  }

  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(raw)) {
    return { type: 'file', videoSrc: raw };
  }

  if (/youtube\.com\/embed\//i.test(raw) || /player\.vimeo\.com/i.test(raw)) {
    return { type: 'embed', embedUrl: raw };
  }

  return null;
}

function extractYoutubeId(value) {
  const patterns = [
    /(?:youtube\.com\/watch\?[^#]*v=)([\w-]{11})/i,
    /youtu\.be\/([\w-]{11})/i,
    /youtube\.com\/embed\/([\w-]{11})/i,
    /youtube\.com\/shorts\/([\w-]{11})/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function extractVimeoId(value) {
  const match = value.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return match?.[1] ?? null;
}
