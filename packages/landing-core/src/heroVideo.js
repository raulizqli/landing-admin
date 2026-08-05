/**
 * Hero / section video URL helpers with strict HTTPS host allowlisting (F13).
 * iframe src is always rebuilt from validated YouTube/Vimeo IDs — never pass-through untrusted URLs.
 */

const YOUTUBE_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
]);

const VIMEO_HOSTS = new Set([
  'vimeo.com',
  'www.vimeo.com',
  'player.vimeo.com',
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

function withHttpsIfHostLike(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com|vimeo\.com|player\.vimeo\.com)\//i.test(raw)) {
    return `https://${raw}`;
  }
  return raw;
}

function extractYoutubeId(value) {
  const raw = withHttpsIfHostLike(value);
  const parsed = parseHttpsUrl(raw);
  if (parsed) {
    if (!YOUTUBE_HOSTS.has(parsed.hostname.toLowerCase())) return null;
    if (parsed.hostname.toLowerCase() === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return /^[\w-]{11}$/.test(id || '') ? id : null;
    }
    const fromQuery = parsed.searchParams.get('v');
    if (fromQuery && /^[\w-]{11}$/.test(fromQuery)) return fromQuery;
    const parts = parsed.pathname.split('/').filter(Boolean);
    if ((parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') && /^[\w-]{11}$/.test(parts[1] || '')) {
      return parts[1];
    }
    return null;
  }

  // Bare video id only (no host) — safe because we rebuild a YouTube embed URL.
  if (/^[\w-]{11}$/.test(String(value ?? '').trim())) {
    return String(value).trim();
  }

  return null;
}

function extractVimeoId(value) {
  const raw = withHttpsIfHostLike(value);
  const parsed = parseHttpsUrl(raw);
  if (parsed) {
    if (!VIMEO_HOSTS.has(parsed.hostname.toLowerCase())) return null;
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts[0] === 'video' && /^\d+$/.test(parts[1] || '')) return parts[1];
    if (/^\d+$/.test(parts[0] || '')) return parts[0];
    return null;
  }

  if (/^\d+$/.test(String(value ?? '').trim())) {
    return String(value).trim();
  }

  return null;
}

function isAllowedVideoFileUrl(raw) {
  const parsed = parseHttpsUrl(raw);
  if (!parsed) return false;
  return /\.(mp4|webm|ogg)$/i.test(parsed.pathname);
}

function youtubeEmbed(id, { background = false } = {}) {
  if (background) {
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&rel=0&modestbranding=1&playsinline=1`;
  }
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
}

function vimeoEmbed(id, { background = false } = {}) {
  if (background) {
    return `https://player.vimeo.com/video/${id}?background=1&autoplay=1&loop=1&muted=1`;
  }
  return `https://player.vimeo.com/video/${id}`;
}

export function resolveHeroVideo(url) {
  const raw = String(url ?? '').trim();
  if (!raw) return null;

  const youtubeId = extractYoutubeId(raw);
  if (youtubeId) {
    return {
      type: 'youtube',
      embedUrl: youtubeEmbed(youtubeId, { background: true }),
    };
  }

  const vimeoId = extractVimeoId(raw);
  if (vimeoId) {
    return {
      type: 'vimeo',
      embedUrl: vimeoEmbed(vimeoId, { background: true }),
    };
  }

  if (isAllowedVideoFileUrl(raw)) {
    return { type: 'file', videoSrc: parseHttpsUrl(raw).toString() };
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
      embedUrl: youtubeEmbed(youtubeId),
    };
  }

  const vimeoId = extractVimeoId(raw);
  if (vimeoId) {
    return {
      type: 'vimeo',
      embedUrl: vimeoEmbed(vimeoId),
    };
  }

  if (isAllowedVideoFileUrl(raw)) {
    return { type: 'file', videoSrc: parseHttpsUrl(raw).toString() };
  }

  return null;
}
