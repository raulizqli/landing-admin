
import { createContentId, normalizeContentId } from './contentIds.js';
import { resolveSectionVideo } from './heroVideo.js';

export const VIDEO_SECTION_CAROUSEL_AUTOPLAY_MS = 8000;

export function createEmptyVideoItem(overrides = {}) {
  return {
    id: createContentId('video'),
    url: '',
    caption: '',
    ...overrides,
  };
}

export function normalizeVideoItem(item = {}, index = 0) {
  return {
    id: normalizeContentId(item.id, `video-${index + 1}`),
    url: String(item.url || item.videoUrl || item.videoSectionUrl || '').trim(),
    caption: String(item.caption || item.title || item.leyenda || '').trim(),
  };
}

export function normalizeVideoSectionItems(items, fallbackUrl = '') {
  const list = Array.isArray(items)
    ? items.map((item, index) => normalizeVideoItem(item, index))
    : [];
  const fallback = String(fallbackUrl ?? '').trim();

  if (list.length === 0) {
    return fallback ? [normalizeVideoItem({ url: fallback }, 0)] : [];
  }

  if (fallback && !list[0].url) {
    list[0] = { ...list[0], url: fallback };
  }

  return list;
}

export function normalizeVideoSectionCarouselAutoplay(value) {
  return value === true || value === 'auto';
}

export function syncVideoSectionUrlFromItems(items, fallbackUrl = '') {
  const list = normalizeVideoSectionItems(items, fallbackUrl);
  return String(list[0]?.url ?? '').trim();
}

export function getVisibleVideoItems(data) {
  return normalizeVideoSectionItems(data?.videoSectionItems, data?.videoSectionUrl)
    .filter((item) => Boolean(resolveSectionVideo(item.url)));
}

export function shouldShowVideoSection(data) {
  if (!data?.videoSectionEnabled) return false;
  return getVisibleVideoItems(data).length > 0;
}

export function shouldUseVideoCarousel(data) {
  return getVisibleVideoItems(data).length > 1;
}

export function splitVideoSectionParagraphs(text) {
  return String(text ?? '')
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
