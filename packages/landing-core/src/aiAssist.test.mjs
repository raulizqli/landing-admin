import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyAiAssistResult,
  isAiActionAllowed,
  normalizeStructureSuggestion,
  parseBlogPostTarget,
  parseHeroSlideTarget,
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
    assert.equal(isAiActionAllowed('full', 'generate_page_content'), true);
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

  it('normalizes and applies generate_page_content', () => {
    const next = applyAiAssistResult(
      {
        aboutTagline: '',
        aboutBio: '',
        heroSlides: [{ title: '', text: '' }],
        seo: { defaultTitle: '', defaultDescription: '' },
      },
      {
        action: 'generate_page_content',
        result: {
          targets: ['about', 'hero', 'seo'],
          content: {
            about: { tagline: 'Tag', bio: 'Bio text' },
            hero: { title: 'Hero title', text: 'Hero text' },
            seo: { title: 'SEO title', description: 'SEO desc' },
          },
        },
      },
    );
    assert.equal(next.aboutTagline, 'Tag');
    assert.equal(next.heroSlides[0].title, 'Hero title');
    assert.equal(next.seo.defaultTitle, 'SEO title');
  });

  it('applies hero_suggest to selected slide or appends a new slide', () => {
    assert.deepEqual(parseHeroSlideTarget('heroSlides[2]'), { mode: 'edit', index: 2 });
    assert.deepEqual(parseHeroSlideTarget('heroSlides[+]'), { mode: 'add', index: null });

    const edited = applyAiAssistResult(
      {
        heroSlides: [
          { title: 'A', text: 'a' },
          { title: 'B', text: 'b' },
          { title: 'C', text: 'c' },
        ],
      },
      {
        action: 'hero_suggest',
        fieldPath: 'heroSlides[1]',
        result: { title: 'New B', text: 'New subtitle' },
      },
    );
    assert.equal(edited.heroSlides[1].title, 'New B');
    assert.equal(edited.heroSlides[1].text, 'New subtitle');
    assert.equal(edited.heroSlides[0].title, 'A');

    const added = applyAiAssistResult(
      { heroSlides: [{ title: 'Only', text: 'one' }] },
      {
        action: 'hero_suggest',
        fieldPath: 'heroSlides[+]',
        result: { title: 'Slide 2', text: 'Second slide' },
      },
    );
    assert.equal(added.heroSlides.length, 2);
    assert.equal(added.heroSlides[1].title, 'Slide 2');
    assert.equal(added.heroSlides[1].showTitle, true);
  });

  it('applies blog_draft to selected post or appends a new post', () => {
    assert.deepEqual(parseBlogPostTarget('blogPosts[1]'), { mode: 'edit', index: 1 });
    assert.deepEqual(parseBlogPostTarget('blogPosts[+]'), { mode: 'add', index: null });

    const edited = applyAiAssistResult(
      {
        blogPosts: [
          { title: 'A', text: 'a' },
          { title: 'B', text: 'b' },
        ],
      },
      {
        action: 'blog_draft',
        fieldPath: 'blogPosts[1]',
        result: { title: 'New B', text: 'New body' },
      },
    );
    assert.equal(edited.blogPosts[1].title, 'New B');
    assert.equal(edited.blogPosts[1].text, 'New body');
    assert.equal(edited.blogSectionEnabled, true);

    const added = applyAiAssistResult(
      { blogPosts: [{ title: 'Only', text: 'one' }] },
      {
        action: 'blog_draft',
        fieldPath: 'blogPosts[+]',
        result: { title: 'Post 2', text: 'Second post' },
      },
    );
    assert.equal(added.blogPosts.length, 2);
    assert.equal(added.blogPosts[1].title, 'Post 2');
  });
});
