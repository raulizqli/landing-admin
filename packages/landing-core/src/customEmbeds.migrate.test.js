import { describe, expect, it } from 'vitest';
import { migrateCustomEmbedType } from './customEmbeds.js';

describe('migrateCustomEmbedType', () => {
  it('maps faq items to steps and carries card colors', () => {
    const migrated = migrateCustomEmbedType({
      id: 'embed-1',
      type: 'faq',
      label: 'Planes',
      title: 'Precios',
      placement: 'after_testimonials',
      faqCardBgColor: '#523677',
      faqTextColor: '#FFFFFF',
      faqItems: [
        { question: 'Starter', answer: 'Plan básico', price: 'MX$189' },
        { question: 'Pro', answer: 'Plan completo', price: 'MX$469' },
      ],
    }, 'steps');

    expect(migrated.type).toBe('steps');
    expect(migrated.title).toBe('Precios');
    expect(migrated.label).toBe('Planes');
    expect(migrated.stepsCardBgColor).toBe('#523677');
    expect(migrated.stepsTextColor).toBe('#FFFFFF');
    expect(migrated.steps).toHaveLength(2);
    expect(migrated.steps[0].title).toBe('Starter');
    expect(migrated.steps[0].description).toBe('Plan básico');
  });

  it('maps steps back to faq items', () => {
    const migrated = migrateCustomEmbedType({
      type: 'steps',
      title: 'Proceso',
      stepsCardBgColor: '#523677',
      stepsTextColor: '#FCFBF9',
      steps: [
        { title: 'Paso 1', description: 'Primera sesión' },
      ],
    }, 'faq');

    expect(migrated.faqCardBgColor).toBe('#523677');
    expect(migrated.faqTextColor).toBe('#FCFBF9');
    expect(migrated.faqItems[0].question).toBe('Paso 1');
    expect(migrated.faqItems[0].answer).toBe('Primera sesión');
  });

  it('maps faq pricing rows into service items with price', () => {
    const migrated = migrateCustomEmbedType({
      type: 'faq',
      faqItems: [
        { question: 'Starter', answer: 'Básico', price: 'MX$189' },
      ],
    }, 'services');

    expect(migrated.serviceItems[0].title).toBe('Starter');
    expect(migrated.serviceItems[0].description).toBe('Básico');
    expect(migrated.serviceItems[0].price).toBe('MX$189');
  });

  it('maps long text into quote and cta types', () => {
    const source = {
      type: 'text',
      title: 'Mi enfoque',
      body: 'Acompaño procesos con calma y claridad.',
    };

    expect(migrateCustomEmbedType(source, 'quote').quoteText).toBe(source.body);
    expect(migrateCustomEmbedType(source, 'cta').ctaText).toBe(source.body);
    expect(migrateCustomEmbedType(source, 'cta').title).toBe('Mi enfoque');
  });

  it('formats list sections into editorial body text', () => {
    const migrated = migrateCustomEmbedType({
      type: 'faq',
      faqItems: [
        { question: '¿Online?', answer: 'Sí, por videollamada.' },
      ],
    }, 'text');

    expect(migrated.body).toContain('¿Online?');
    expect(migrated.body).toContain('Sí, por videollamada.');
  });

  it('preserves pre-hero image and body when switching types', () => {
    const migrated = migrateCustomEmbedType({
      type: 'pre_hero',
      title: 'Bienvenida',
      body: 'Texto editorial',
      imageUrl: 'https://cdn.example/hero.jpg',
      preHeroMode: 'split',
      preHeroImageSide: 'right',
    }, 'text');

    expect(migrated.body).toBe('Texto editorial');

    const back = migrateCustomEmbedType({
      ...migrated,
      type: 'text',
      imageUrl: 'https://cdn.example/hero.jpg',
      preHeroMode: 'split',
      preHeroImageSide: 'right',
    }, 'pre_hero');

    expect(back.imageUrl).toBe('https://cdn.example/hero.jpg');
    expect(back.preHeroImageSide).toBe('right');
  });
});
