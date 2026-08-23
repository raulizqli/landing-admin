import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CTA_BUTTON_BG_COLOR,
  DEFAULT_CTA_BUTTON_TEXT_COLOR,
  normalizeCustomEmbeds,
  resolveCtaButtonColors,
} from './customEmbeds.js';

describe('resolveCtaButtonColors', () => {
  it('uses legacy sage defaults when fields are empty', () => {
    expect(resolveCtaButtonColors({})).toEqual({
      buttonBgColor: DEFAULT_CTA_BUTTON_BG_COLOR,
      buttonTextColor: DEFAULT_CTA_BUTTON_TEXT_COLOR,
    });
  });

  it('applies custom button colors when set', () => {
    expect(resolveCtaButtonColors({
      ctaButtonBgColor: '#523677',
      ctaButtonTextColor: '#FFFFFF',
    })).toEqual({
      buttonBgColor: '#523677',
      buttonTextColor: '#FFFFFF',
    });
  });

  it('normalizes cta button color fields', () => {
    const [embed] = normalizeCustomEmbeds([{
      type: 'cta',
      ctaButtonBgColor: '#523677',
      ctaButtonTextColor: '#FCFBF9',
    }]);

    expect(embed.ctaButtonBgColor).toBe('#523677');
    expect(embed.ctaButtonTextColor).toBe('#FCFBF9');
  });
});
