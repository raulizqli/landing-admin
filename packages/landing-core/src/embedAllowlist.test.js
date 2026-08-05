import { describe, expect, it } from 'vitest';
import { resolveMapsUrls } from './maps.js';
import { resolveHeroVideo, resolveSectionVideo } from './heroVideo.js';

describe('resolveMapsUrls host allowlist (F13)', () => {
  it('builds embed URLs from plain addresses', () => {
    const maps = resolveMapsUrls({ location: 'Av Reforma 100, CDMX', showLocationMap: true });
    expect(maps.embedUrl).toMatch(/^https:\/\/maps\.google\.com\/maps\?/);
    expect(maps.embedUrl).toContain('output=embed');
  });

  it('accepts Google Maps share and embed links', () => {
    const share = resolveMapsUrls({
      locationMapsUrl: 'https://www.google.com/maps/place/Mexico+City/@19.4,-99.1,12z',
    });
    expect(share.embedUrl).toMatch(/^https:\/\/maps\.google\.com\/maps\?/);

    const embed = resolveMapsUrls({
      locationMapsUrl: 'https://www.google.com/maps/embed?pb=example',
    });
    expect(embed.embedUrl).toBe('https://www.google.com/maps/embed?pb=example');
  });

  it('rejects non-Maps absolute URLs that contain /maps/embed', () => {
    const maps = resolveMapsUrls({
      locationMapsUrl: 'https://evil.example/maps/embed?q=x',
      location: 'Safe Place',
    });
    expect(maps.embedUrl).toContain(encodeURIComponent('Safe Place'));
    expect(maps.embedUrl).not.toContain('evil.example');
  });

  it('rejects javascript and http (non-https) map URLs', () => {
    expect(resolveMapsUrls({
      locationMapsUrl: 'javascript:alert(1)',
    }).embedUrl).toBe('');

    expect(resolveMapsUrls({
      locationMapsUrl: 'http://www.google.com/maps?q=x&output=embed',
    }).embedUrl).toBe('');
  });
});

describe('resolveHeroVideo / resolveSectionVideo host allowlist (F13)', () => {
  it('rebuilds YouTube and Vimeo embeds from allowlisted hosts', () => {
    const yt = resolveHeroVideo('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(yt.type).toBe('youtube');
    expect(yt.embedUrl).toMatch(/^https:\/\/www\.youtube\.com\/embed\/dQw4w9WgXcQ\?/);

    const vim = resolveSectionVideo('https://vimeo.com/123456789');
    expect(vim.type).toBe('vimeo');
    expect(vim.embedUrl).toBe('https://player.vimeo.com/video/123456789');
  });

  it('does not pass through malicious URLs that only mention youtube/vimeo substrings', () => {
    expect(resolveHeroVideo('https://evil.example/youtube.com/embed/dQw4w9WgXcQ')).toBeNull();
    expect(resolveSectionVideo('https://evil.example/?player.vimeo.com/video/1')).toBeNull();
  });

  it('rejects non-https media files and allows https mp4', () => {
    expect(resolveHeroVideo('http://cdn.example/video.mp4')).toBeNull();
    expect(resolveHeroVideo('javascript:alert(1)')).toBeNull();

    const file = resolveHeroVideo('https://cdn.example/path/video.mp4');
    expect(file).toEqual({ type: 'file', videoSrc: 'https://cdn.example/path/video.mp4' });
  });
});
