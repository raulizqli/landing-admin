import { describe, expect, it } from 'vitest';
import { toDataUrl } from './qrCode';

describe('toDataUrl', () => {
  it('rejects empty strings', async () => {
    await expect(toDataUrl('')).rejects.toThrow(/empty/i);
    await expect(toDataUrl('   ')).rejects.toThrow(/empty/i);
  });

  it('rejects non-absolute URLs', async () => {
    await expect(toDataUrl('instagram.com/user')).rejects.toThrow(/absolute/i);
  });

  it('returns a PNG data URL for https URLs', async () => {
    const dataUrl = await toDataUrl('https://example.com/page');
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });
});
