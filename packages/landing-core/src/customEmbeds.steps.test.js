import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FAQ_CARD_BG_COLOR,
  DEFAULT_FAQ_TEXT_COLOR,
  DEFAULT_STEPS_CARD_BG_COLOR,
  DEFAULT_STEPS_TITLE_COLOR,
  normalizeCustomEmbeds,
  resolveFaqCardColors,
  resolveStepsCardColors,
} from './customEmbeds.js';

describe('steps embed colors', () => {
  it('uses legacy defaults when color fields are empty', () => {
    const colors = resolveStepsCardColors({});
    expect(colors.cardBgColor).toBe(DEFAULT_STEPS_CARD_BG_COLOR);
    expect(colors.titleColor).toBe(DEFAULT_STEPS_TITLE_COLOR);
    expect(colors.bodyColor).toBe('#1A2420CC');
    expect(colors.mutedColor).toBe('#0A5C3A8C');
  });

  it('applies custom card and text colors', () => {
    const colors = resolveStepsCardColors({
      stepsCardBgColor: '#523677',
      stepsTextColor: '#FCFBF9',
    });
    expect(colors.cardBgColor).toBe('#523677');
    expect(colors.titleColor).toBe('#FCFBF9');
    expect(colors.bodyColor).toBe('#FCFBF9CC');
    expect(colors.mutedColor).toBe('#FCFBF98C');
  });

  it('normalizes steps color fields on embeds', () => {
    const [embed] = normalizeCustomEmbeds([{
      type: 'steps',
      stepsCardBgColor: '#523677',
      stepsTextColor: '#FCFBF9',
      steps: [{ title: 'Uno', description: 'Dos' }],
    }]);
    expect(embed.stepsCardBgColor).toBe('#523677');
    expect(embed.stepsTextColor).toBe('#FCFBF9');
  });
});

describe('faq embed colors', () => {
  it('uses legacy defaults when color fields are empty', () => {
    const colors = resolveFaqCardColors({});
    expect(colors.cardBgColor).toBe(DEFAULT_FAQ_CARD_BG_COLOR);
    expect(colors.titleColor).toBe(DEFAULT_FAQ_TEXT_COLOR);
  });

  it('applies custom card and text colors', () => {
    const colors = resolveFaqCardColors({
      faqCardBgColor: '#523677',
      faqTextColor: '#FCFBF9',
    });
    expect(colors.cardBgColor).toBe('#523677');
    expect(colors.titleColor).toBe('#FCFBF9');
    expect(colors.bodyColor).toBe('#FCFBF9CC');
  });

  it('normalizes faq color fields on embeds', () => {
    const [embed] = normalizeCustomEmbeds([{
      type: 'faq',
      faqCardBgColor: '#523677',
      faqTextColor: '#FCFBF9',
      faqItems: [{ question: 'Q', answer: 'A' }],
    }]);
    expect(embed.faqCardBgColor).toBe('#523677');
    expect(embed.faqTextColor).toBe('#FCFBF9');
  });
});
