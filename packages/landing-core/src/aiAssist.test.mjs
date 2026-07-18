import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyAiAssistResult,
  isAiActionAllowed,
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
});
