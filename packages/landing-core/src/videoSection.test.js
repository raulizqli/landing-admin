import { describe, expect, it } from 'vitest';
import {
  createEmptyVideoItem,
  getVisibleVideoItems,
  normalizeVideoSectionItems,
  shouldShowVideoSection,
  shouldUseVideoCarousel,
  syncVideoSectionUrlFromItems,
} from './videoSection.js';

const YOUTUBE_A = 'https://www.youtube.com/watch?v=dQw4w9wgGcQ';
const YOUTUBE_B = 'https://youtu.be/aaaaaaaaaaa';

describe('normalizeVideoSectionItems', () => {
  it('migrates a legacy single URL into items', () => {
    const items = normalizeVideoSectionItems([], YOUTUBE_A);
    expect(items).toHaveLength(1);
    expect(items[0].url).toBe(YOUTUBE_A);
    expect(items[0].id).toBe('video-1');
  });

  it('fills the first empty item from the legacy URL', () => {
    const items = normalizeVideoSectionItems([{ id: 'keep-me', url: '', caption: 'Intro' }], YOUTUBE_A);
    expect(items[0].id).toBe('keep-me');
    expect(items[0].url).toBe(YOUTUBE_A);
    expect(items[0].caption).toBe('Intro');
  });

  it('keeps existing items when present', () => {
    const items = normalizeVideoSectionItems(
      [{ url: YOUTUBE_A }, { url: YOUTUBE_B, caption: 'Second' }],
      'https://example.com/ignored.mp4',
    );
    expect(items).toHaveLength(2);
    expect(items[0].url).toBe(YOUTUBE_A);
    expect(items[1].caption).toBe('Second');
  });
});

describe('video section visibility', () => {
  it('hides the section without a resolvable video', () => {
    expect(shouldShowVideoSection({
      videoSectionEnabled: true,
      videoSectionUrl: 'https://example.com/not-a-video',
    })).toBe(false);
    expect(getVisibleVideoItems({
      videoSectionEnabled: true,
      videoSectionUrl: YOUTUBE_A,
    })).toHaveLength(1);
  });

  it('uses a carousel when more than one valid video is present', () => {
    const data = {
      videoSectionEnabled: true,
      videoSectionItems: [{ url: YOUTUBE_A }, { url: YOUTUBE_B }],
    };
    expect(shouldShowVideoSection(data)).toBe(true);
    expect(shouldUseVideoCarousel(data)).toBe(true);
    expect(shouldUseVideoCarousel({
      videoSectionEnabled: true,
      videoSectionUrl: YOUTUBE_A,
    })).toBe(false);
  });
});

describe('syncVideoSectionUrlFromItems', () => {
  it('mirrors the first item URL for legacy compatibility', () => {
    expect(syncVideoSectionUrlFromItems([{ url: YOUTUBE_A }, { url: YOUTUBE_B }])).toBe(YOUTUBE_A);
    expect(createEmptyVideoItem({ url: YOUTUBE_A }).url).toBe(YOUTUBE_A);
  });
});
