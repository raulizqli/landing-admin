import { describe, expect, it, vi } from 'vitest';
import {
  buildMirrorPreviewFrameUrl,
  isSameOriginPreviewMessage,
  LANDING_PREVIEW_SCROLL,
  LANDING_PREVIEW_UPDATE,
  postLandingPreviewScroll,
  postLandingPreviewUpdate,
} from './mirrorPreview';

describe('mirrorPreview helpers', () => {
  it('builds a relative preview-frame URL with query params', () => {
    expect(buildMirrorPreviewFrameUrl({
      pageId: 'acme',
      language: 'en',
    })).toBe('/app/preview-frame?pageId=acme&lang=en');
  });

  it('builds an absolute preview-frame URL when origin is provided', () => {
    expect(buildMirrorPreviewFrameUrl({
      pageId: 'acme',
      language: 'es',
      origin: 'https://admin.example.com/',
    })).toBe('https://admin.example.com/app/preview-frame?pageId=acme&lang=es');
  });

  it('rejects cross-origin preview messages', () => {
    expect(isSameOriginPreviewMessage(
      { origin: 'https://evil.example' },
      'https://admin.example.com',
    )).toBe(false);
    expect(isSameOriginPreviewMessage(
      { origin: 'https://admin.example.com' },
      'https://admin.example.com',
    )).toBe(true);
  });

  it('posts update and scroll messages to the target window', () => {
    const target = { postMessage: vi.fn() };
    postLandingPreviewUpdate(target, 'https://admin.example.com', {
      data: { name: 'Ada' },
      pageId: 'ada',
      language: 'es',
      scrollSectionId: 'about',
      activeMarketingRouteId: 'home',
    });
    expect(target.postMessage).toHaveBeenCalledWith(
      {
        type: LANDING_PREVIEW_UPDATE,
        data: { name: 'Ada' },
        pageId: 'ada',
        language: 'es',
        scrollSectionId: 'about',
        activeMarketingRouteId: 'home',
      },
      'https://admin.example.com',
    );

    postLandingPreviewScroll(target, 'https://admin.example.com', 'contact');
    expect(target.postMessage).toHaveBeenCalledWith(
      { type: LANDING_PREVIEW_SCROLL, sectionId: 'contact' },
      'https://admin.example.com',
    );
  });
});
