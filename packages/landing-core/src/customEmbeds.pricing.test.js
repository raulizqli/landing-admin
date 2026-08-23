import { describe, expect, it } from 'vitest';
import { normalizeCustomEmbeds } from './customEmbeds.js';
import { normalizeService } from './services.js';

describe('optional service and faq prices', () => {
  it('normalizes an optional price on service items', () => {
    expect(normalizeService({
      title: 'Starter',
      price: 'MX$189 / mes',
      description: 'Plan básico',
    }).price).toBe('MX$189 / mes');

    expect(normalizeService({
      title: 'Consulta',
      description: 'Sin tarifa fija',
    }).price).toBe('');
  });

  it('normalizes an optional price on faq items inside custom embeds', () => {
    const [embed] = normalizeCustomEmbeds([{
      type: 'faq',
      faqItems: [
        { question: 'Pro', price: 'US$25 / mes', answer: 'Todo incluido' },
        { question: 'Enterprise', answer: 'A medida' },
      ],
    }]);

    expect(embed.faqItems[0].price).toBe('US$25 / mes');
    expect(embed.faqItems[1].price).toBe('');
  });
});
