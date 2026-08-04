import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyAiAssistResult,
  isAiActionAllowed,
  normalizeStructureSuggestion,
  resolveAiAssistLane,
  sanitizeAiText,
} from './aiAssist.js';
import { createEmptyBillingAccount } from './billingPlans.js';

describe('aiAssist lanes and apply', () => {
  it('gives full lane to active Pro and lite to unpaid', () => {
    const pro = createEmptyBillingAccount({ plan: 'pro', status: 'active' });
    const unpaid = createEmptyBillingAccount({ plan: 'agency', status: 'canceled' });
    const starter = createEmptyBillingAccount({ plan: 'starter', status: 'active' });
    assert.equal(resolveAiAssistLane(pro), 'full');
    assert.equal(resolveAiAssistLane(unpaid), 'lite');
    assert.equal(resolveAiAssistLane(starter), 'lite');
  });

  it('blocks full-only actions on lite lane', () => {
    assert.equal(isAiActionAllowed('lite', 'rewrite_field'), true);
    assert.equal(isAiActionAllowed('lite', 'seo_meta'), false);
    assert.equal(isAiActionAllowed('full', 'seo_meta'), true);
    assert.equal(isAiActionAllowed('full', 'suggest_page_structure'), true);
    assert.equal(isAiActionAllowed('lite', 'suggest_page_structure'), false);
  });

  it('applies bio polish into formData without HTML', () => {
    const next = applyAiAssistResult(
      { aboutBio: 'old' },
      { action: 'polish_bio', result: { text: '<b>New bio</b> safe' } },
    );
    assert.equal(next.aboutBio, 'New bio safe');
    assert.equal(sanitizeAiText('<script>x</script>Hi'), 'Hi');
  });

  it('applies seo_meta and hero_suggest', () => {
    const withSeo = applyAiAssistResult(
      { seo: {} },
      { action: 'seo_meta', result: { title: 'Title', description: 'Desc' } },
    );
    assert.equal(withSeo.seo.defaultTitle, 'Title');
    const withHero = applyAiAssistResult(
      { heroSlides: [{ title: '', text: '' }] },
      { action: 'hero_suggest', result: { title: 'H', text: 'S' } },
    );
    assert.equal(withHero.heroSlides[0].title, 'H');
  });

  it('normalizes and applies suggest_page_structure', () => {
    const normalized = normalizeStructureSuggestion({
      vertical: 'veterinary',
      summary: 'Focus on services and gallery',
      recommendedSections: [
        { flag: 'servicesSectionEnabled', enabled: true, reason: 'Offerings' },
        { flag: 'gallerySectionEnabled', enabled: true, reason: 'Cases' },
        { flag: 'unknownFlag', enabled: true, reason: 'ignore' },
        { flag: 'blogSectionEnabled', enabled: false, reason: 'Later' },
      ],
    });
    assert.equal(normalized.vertical, 'veterinary');
    assert.equal(normalized.recommendedSections.length, 3);

    const next = applyAiAssistResult(
      {
        vertical: 'generic',
        servicesSectionEnabled: false,
        gallerySectionEnabled: false,
        blogSectionEnabled: true,
      },
      { action: 'suggest_page_structure', result: normalized },
    );
    assert.equal(next.vertical, 'veterinary');
    assert.equal(next.servicesSectionEnabled, true);
    assert.equal(next.gallerySectionEnabled, true);
    assert.equal(next.blogSectionEnabled, false);
  });
});
