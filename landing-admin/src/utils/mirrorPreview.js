export const LANDING_PREVIEW_UPDATE = 'LANDING_PREVIEW_UPDATE';
export const LANDING_PREVIEW_SCROLL = 'LANDING_PREVIEW_SCROLL';
export const LANDING_PREVIEW_READY = 'LANDING_PREVIEW_READY';

export function buildMirrorPreviewFrameUrl({ pageId, language, origin } = {}) {
  const base = typeof origin === 'string' && origin
    ? origin.replace(/\/$/, '')
    : '';
  const params = new URLSearchParams();
  if (pageId) params.set('pageId', pageId);
  if (language) params.set('lang', language);
  const query = params.toString();
  const path = `/app/preview-frame${query ? `?${query}` : ''}`;
  return base ? `${base}${path}` : path;
}

export function isSameOriginPreviewMessage(event, expectedOrigin = window.location.origin) {
  return Boolean(event && event.origin === expectedOrigin);
}

export function postLandingPreviewUpdate(targetWindow, targetOrigin, payload) {
  if (!targetWindow || !targetOrigin || !payload) return;
  targetWindow.postMessage(
    {
      type: LANDING_PREVIEW_UPDATE,
      data: payload.data ?? null,
      pageId: payload.pageId ?? null,
      language: payload.language ?? null,
      scrollSectionId: payload.scrollSectionId ?? null,
      activeMarketingRouteId: payload.activeMarketingRouteId ?? null,
    },
    targetOrigin,
  );
}

export function postLandingPreviewScroll(targetWindow, targetOrigin, sectionId) {
  if (!targetWindow || !targetOrigin || !sectionId) return;
  targetWindow.postMessage(
    { type: LANDING_PREVIEW_SCROLL, sectionId },
    targetOrigin,
  );
}
