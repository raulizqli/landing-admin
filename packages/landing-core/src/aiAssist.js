/**
 * AI Assist helpers — lanes, actions, and local apply (no Firestore writes).
 * Keep in sync with Cloud Functions runAiAssist allow-lists.
 */

import { createEmptyBlogPost } from './blog.js';
import { createEmptyCatalogItem } from './catalog.js';
import {
  accountHasFeature,
  getAiMonthlyQuota,
  getBillingPlan,
  isBillingAccountActive,
} from './billingPlans.js';
import { createEmptyService } from './services.js';
import { createEmptyTestimonial } from './testimonials.js';
import { normalizeVertical } from './verticals.js';

export const AI_ASSIST_LANES = ['lite', 'full'];

/** Actions allowed on free-tier / Starter (Ollama / free cloud). */
export const AI_LITE_ACTIONS = [
  'rewrite_field',
  'polish_bio',
  'polish_tagline',
  'hero_suggest',
];

/** Extra actions for Pro+ paid lane. */
export const AI_FULL_ACTIONS = [
  ...AI_LITE_ACTIONS,
  'service_blurb',
  'seo_meta',
  'blog_draft',
  'suggest_page_structure',
  'generate_page_content',
  'generate_logo',
];

/** Content blocks the structure assistant can pre-fill after a layout suggestion. */
export const STRUCTURE_CONTENT_TARGETS = [
  { id: 'seo', defaultEnabled: true },
  { id: 'hero', sectionFlag: 'heroSectionEnabled', defaultEnabled: true },
  { id: 'preHero', sectionFlag: 'preHeroEnabled', defaultEnabled: false },
  { id: 'about', sectionFlag: 'aboutSectionEnabled', defaultEnabled: true },
  { id: 'services', sectionFlag: 'servicesSectionEnabled', defaultEnabled: true },
  { id: 'catalog', sectionFlag: 'catalogSectionEnabled', defaultEnabled: false },
  { id: 'testimonials', sectionFlag: 'testimonialsEnabled', defaultEnabled: false },
  { id: 'blog', sectionFlag: 'blogSectionEnabled', defaultEnabled: false },
];

const STRUCTURE_CONTENT_TARGET_IDS = new Set(STRUCTURE_CONTENT_TARGETS.map((item) => item.id));

/** Keep in sync with TOGGLEABLE_PAGE_SECTIONS flags in sectionVisibility.js */
export const STRUCTURE_SECTION_FLAGS = [
  'preHeroEnabled',
  'heroSectionEnabled',
  'aboutSectionEnabled',
  'servicesSectionEnabled',
  'catalogSectionEnabled',
  'gallerySectionEnabled',
  'videoSectionEnabled',
  'testimonialsEnabled',
  'blogSectionEnabled',
  'contactSectionEnabled',
  'socialSectionEnabled',
  'footerSectionEnabled',
];
const STRUCTURE_SECTION_FLAG_SET = new Set(STRUCTURE_SECTION_FLAGS);

export const AI_TONES = ['empathetic', 'formal', 'concise', 'shorter', 'translate_en', 'translate_es'];

export function normalizeAiTone(value) {
  const tone = String(value ?? '').trim().toLowerCase();
  return AI_TONES.includes(tone) ? tone : 'empathetic';
}

export function normalizeAiAction(value) {
  const action = String(value ?? '').trim().toLowerCase();
  return AI_FULL_ACTIONS.includes(action) ? action : '';
}

/**
 * @returns {'lite'|'full'|null}
 */
export function resolveAiAssistLane(account, { bypass = false } = {}) {
  if (bypass) return 'full';
  if (isBillingAccountActive(account) && accountHasFeature(account, 'aiAssist', { bypass: false })) {
    return 'full';
  }
  if (accountHasFeature(account, 'aiAssistLite', { bypass: false })) {
    return 'lite';
  }
  // Unpaid accounts: Lite even if plan flag missing on legacy docs
  if (!isBillingAccountActive(account)) return 'lite';
  return null;
}

export function isAiActionAllowed(lane, action) {
  const normalized = normalizeAiAction(action);
  if (!normalized) return false;
  if (lane === 'full') return AI_FULL_ACTIONS.includes(normalized);
  if (lane === 'lite') return AI_LITE_ACTIONS.includes(normalized);
  return false;
}

export function accountCanUseAiByok(account, { bypass = false } = {}) {
  if (bypass) return true;
  if (!isBillingAccountActive(account)) return false;
  return accountHasFeature(account, 'aiByok', { bypass: false });
}

export function getAiQuotaForAccount(account, { bypass = false } = {}) {
  const lane = resolveAiAssistLane(account, { bypass });
  if (!lane) {
    return { lane: null, limit: 0, unlimited: false };
  }
  const limit = getAiMonthlyQuota(account, lane, { bypass });
  return {
    lane,
    limit,
    unlimited: limit == null,
    planId: getBillingPlan(account?.plan).id,
  };
}

export function currentAiUsagePeriod(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/** Strip HTML / scripts from model output before applying to form fields. */
export function sanitizeAiText(value) {
  return String(value ?? '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\r\n/g, '\n')
    .trim();
}

/**
 * Normalize a suggest_page_structure model result to known section flags.
 */
export function normalizeStructureSuggestion(result = {}) {
  const source = result && typeof result === 'object' ? result : {};
  const recommendedSections = (Array.isArray(source.recommendedSections) ? source.recommendedSections : [])
    .map((item) => {
      const flag = String(item?.flag ?? '').trim();
      if (!STRUCTURE_SECTION_FLAG_SET.has(flag)) return null;
      return {
        flag,
        enabled: item?.enabled === true,
        reason: sanitizeAiText(item?.reason ?? ''),
      };
    })
    .filter(Boolean);

  return {
    vertical: normalizeVertical(source.vertical),
    summary: sanitizeAiText(source.summary ?? source.rationale ?? ''),
    recommendedSections,
  };
}

export function defaultStructureContentTargets() {
  return Object.fromEntries(
    STRUCTURE_CONTENT_TARGETS.map((item) => [item.id, item.defaultEnabled === true]),
  );
}

export function normalizeStructureContentTargets(value = {}) {
  const defaults = defaultStructureContentTargets();
  const source = value && typeof value === 'object' ? value : {};
  const next = { ...defaults };
  for (const item of STRUCTURE_CONTENT_TARGETS) {
    if (typeof source[item.id] === 'boolean') next[item.id] = source[item.id];
  }
  return next;
}

function pickNonEmptyString(value) {
  const text = sanitizeAiText(value);
  return text || '';
}

function shouldWriteField(currentValue, onlyEmpty) {
  if (!onlyEmpty) return true;
  return !String(currentValue ?? '').trim();
}

/**
 * Normalize generate_page_content model output.
 */
export function normalizeGeneratedPageContent(result = {}) {
  const source = result && typeof result === 'object' ? result : {};
  const next = {};

  if (source.seo && typeof source.seo === 'object') {
    next.seo = {
      title: pickNonEmptyString(source.seo.title ?? source.seo.defaultTitle),
      description: pickNonEmptyString(source.seo.description ?? source.seo.defaultDescription),
    };
  }

  if (source.hero && typeof source.hero === 'object') {
    next.hero = {
      title: pickNonEmptyString(source.hero.title),
      text: pickNonEmptyString(source.hero.text ?? source.hero.subtitle),
    };
  }

  if (source.preHero && typeof source.preHero === 'object') {
    next.preHero = {
      title: pickNonEmptyString(source.preHero.title),
      text: pickNonEmptyString(source.preHero.text),
    };
  }

  if (source.about && typeof source.about === 'object') {
    next.about = {
      tagline: pickNonEmptyString(source.about.tagline ?? source.about.aboutTagline),
      bio: pickNonEmptyString(source.about.bio ?? source.about.aboutBio),
    };
  }

  if (source.services && typeof source.services === 'object') {
    const items = (Array.isArray(source.services.items) ? source.services.items : [])
      .map((item) => ({
        title: pickNonEmptyString(item?.title),
        description: pickNonEmptyString(item?.description ?? item?.text),
      }))
      .filter((item) => item.title || item.description)
      .slice(0, 6);
    next.services = {
      sectionTitle: pickNonEmptyString(source.services.sectionTitle ?? source.services.title),
      sectionText: pickNonEmptyString(source.services.sectionText ?? source.services.intro),
      items,
    };
  }

  if (source.catalog && typeof source.catalog === 'object') {
    const items = (Array.isArray(source.catalog.items) ? source.catalog.items : [])
      .map((item) => ({
        title: pickNonEmptyString(item?.title),
        description: pickNonEmptyString(item?.description ?? item?.text),
      }))
      .filter((item) => item.title || item.description)
      .slice(0, 6);
    next.catalog = {
      sectionTitle: pickNonEmptyString(source.catalog.sectionTitle ?? source.catalog.title),
      sectionText: pickNonEmptyString(source.catalog.sectionText ?? source.catalog.intro),
      items,
    };
  }

  if (source.testimonials && typeof source.testimonials === 'object') {
    const items = (Array.isArray(source.testimonials.items) ? source.testimonials.items : [])
      .map((item) => ({
        title: pickNonEmptyString(item?.title ?? item?.name),
        quote: pickNonEmptyString(item?.quote ?? item?.text),
      }))
      .filter((item) => item.quote)
      .slice(0, 4);
    next.testimonials = {
      sectionTitle: pickNonEmptyString(source.testimonials.sectionTitle ?? source.testimonials.title),
      items,
    };
  }

  if (source.blog && typeof source.blog === 'object') {
    const posts = (Array.isArray(source.blog.posts) ? source.blog.posts : [])
      .map((item) => ({
        title: pickNonEmptyString(item?.title),
        excerpt: pickNonEmptyString(item?.excerpt ?? item?.summary),
        body: pickNonEmptyString(item?.body ?? item?.text),
      }))
      .filter((item) => item.title)
      .slice(0, 2);
    next.blog = {
      sectionTitle: pickNonEmptyString(source.blog.sectionTitle ?? source.blog.title),
      sectionText: pickNonEmptyString(source.blog.sectionText ?? source.blog.intro),
      posts,
    };
  }

  return next;
}

/**
 * Merge generated copy into formData for selected content targets.
 */
export function applyGeneratedPageContent(
  formData = {},
  result = {},
  { targets = [], onlyEmpty = true } = {},
) {
  const normalized = normalizeGeneratedPageContent(result);
  const selected = new Set(
    (Array.isArray(targets) ? targets : [])
      .map((item) => String(item ?? '').trim())
      .filter((item) => STRUCTURE_CONTENT_TARGET_IDS.has(item)),
  );
  const next = { ...formData };

  if (selected.has('seo') && normalized.seo) {
    next.seo = { ...(next.seo || {}) };
    if (shouldWriteField(next.seo.defaultTitle, onlyEmpty) && normalized.seo.title) {
      next.seo.defaultTitle = normalized.seo.title;
    }
    if (shouldWriteField(next.seo.defaultDescription, onlyEmpty) && normalized.seo.description) {
      next.seo.defaultDescription = normalized.seo.description;
    }
  }

  if (selected.has('hero') && normalized.hero) {
    const slides = Array.isArray(next.heroSlides) ? [...next.heroSlides] : [{}];
    const first = { ...slides[0] };
    if (shouldWriteField(first.title, onlyEmpty) && normalized.hero.title) first.title = normalized.hero.title;
    if (shouldWriteField(first.text, onlyEmpty) && normalized.hero.text) first.text = normalized.hero.text;
    if (normalized.hero.title || normalized.hero.text) {
      first.showTitle = true;
      first.showText = Boolean(normalized.hero.text);
    }
    slides[0] = first;
    next.heroSlides = slides;
  }

  if (selected.has('preHero') && normalized.preHero) {
    if (shouldWriteField(next.preHeroTitle, onlyEmpty) && normalized.preHero.title) {
      next.preHeroTitle = normalized.preHero.title;
    }
    if (shouldWriteField(next.preHeroText, onlyEmpty) && normalized.preHero.text) {
      next.preHeroText = normalized.preHero.text;
    }
  }

  if (selected.has('about') && normalized.about) {
    if (shouldWriteField(next.aboutTagline, onlyEmpty) && normalized.about.tagline) {
      next.aboutTagline = normalized.about.tagline;
    }
    if (shouldWriteField(next.aboutBio, onlyEmpty) && normalized.about.bio) {
      next.aboutBio = normalized.about.bio;
    }
  }

  if (selected.has('services') && normalized.services) {
    if (shouldWriteField(next.servicesSectionTitle, onlyEmpty) && normalized.services.sectionTitle) {
      next.servicesSectionTitle = normalized.services.sectionTitle;
    }
    if (shouldWriteField(next.servicesSectionText, onlyEmpty) && normalized.services.sectionText) {
      next.servicesSectionText = normalized.services.sectionText;
    }
    if (normalized.services.items?.length) {
      const existing = Array.isArray(next.services) ? [...next.services] : [];
      const hasContent = existing.some((item) => String(item?.title ?? '').trim());
      if (!onlyEmpty || !hasContent) {
        next.services = normalized.services.items.map((item) => createEmptyService({
          title: item.title,
          description: item.description,
          layout: 'title_description',
        }));
      }
    }
  }

  if (selected.has('catalog') && normalized.catalog) {
    if (shouldWriteField(next.catalogSectionTitle, onlyEmpty) && normalized.catalog.sectionTitle) {
      next.catalogSectionTitle = normalized.catalog.sectionTitle;
    }
    if (shouldWriteField(next.catalogSectionText, onlyEmpty) && normalized.catalog.sectionText) {
      next.catalogSectionText = normalized.catalog.sectionText;
    }
    if (normalized.catalog.items?.length) {
      const existing = Array.isArray(next.catalogItems) ? [...next.catalogItems] : [];
      const hasContent = existing.some((item) => String(item?.title ?? '').trim());
      if (!onlyEmpty || !hasContent) {
        next.catalogItems = normalized.catalog.items.map((item) => ({
          ...createEmptyCatalogItem(),
          title: item.title,
          description: item.description,
        }));
      }
    }
  }

  if (selected.has('testimonials') && normalized.testimonials) {
    if (shouldWriteField(next.testimonialsSectionTitle, onlyEmpty) && normalized.testimonials.sectionTitle) {
      next.testimonialsSectionTitle = normalized.testimonials.sectionTitle;
    }
    if (normalized.testimonials.items?.length) {
      const existing = Array.isArray(next.testimonials) ? [...next.testimonials] : [];
      const hasContent = existing.some((item) => String(item?.quote ?? '').trim());
      if (!onlyEmpty || !hasContent) {
        next.testimonials = normalized.testimonials.items.map((item) => createEmptyTestimonial({
          title: item.title,
          quote: item.quote,
        }));
      }
    }
  }

  if (selected.has('blog') && normalized.blog) {
    if (shouldWriteField(next.blogSectionTitle, onlyEmpty) && normalized.blog.sectionTitle) {
      next.blogSectionTitle = normalized.blog.sectionTitle;
    }
    if (shouldWriteField(next.blogSectionText, onlyEmpty) && normalized.blog.sectionText) {
      next.blogSectionText = normalized.blog.sectionText;
    }
    if (normalized.blog.posts?.length) {
      const existing = Array.isArray(next.blogPosts) ? [...next.blogPosts] : [];
      const hasContent = existing.some((item) => String(item?.title ?? '').trim());
      if (!onlyEmpty || !hasContent) {
        next.blogPosts = normalized.blog.posts.map((item) => ({
          ...createEmptyBlogPost('title_text'),
          title: item.title,
          text: item.body || item.excerpt,
        }));
      }
    }
  }

  return next;
}

export function buildGeneratePageContentPrompt({
  language = 'es',
  brief = '',
  context = {},
  targets = [],
  structureSummary = '',
} = {}) {
  const selected = (Array.isArray(targets) ? targets : [])
    .map((item) => String(item ?? '').trim())
    .filter((item) => STRUCTURE_CONTENT_TARGET_IDS.has(item));
  const shape = {};
  if (selected.includes('seo')) {
    shape.seo = { title: 'string', description: 'string' };
  }
  if (selected.includes('hero')) {
    shape.hero = { title: 'string', text: 'string' };
  }
  if (selected.includes('preHero')) {
    shape.preHero = { title: 'string', text: 'string' };
  }
  if (selected.includes('about')) {
    shape.about = { tagline: 'string', bio: 'string' };
  }
  if (selected.includes('services')) {
    shape.services = {
      sectionTitle: 'string',
      sectionText: 'string',
      items: [{ title: 'string', description: 'string' }],
    };
  }
  if (selected.includes('catalog')) {
    shape.catalog = {
      sectionTitle: 'string',
      sectionText: 'string',
      items: [{ title: 'string', description: 'string' }],
    };
  }
  if (selected.includes('testimonials')) {
    shape.testimonials = {
      sectionTitle: 'string',
      items: [{ title: 'optional attribution', quote: 'string' }],
    };
  }
  if (selected.includes('blog')) {
    shape.blog = {
      sectionTitle: 'string',
      sectionText: 'string',
      posts: [{ title: 'string', excerpt: 'string', body: 'string' }],
    };
  }

  return [
    'Action: generate_page_content',
    'Write starter copy to pre-fill a landing page form.',
    `Language: ${language === 'en' ? 'English' : 'Spanish'}.`,
    `Vertical: ${context.vertical || 'generic'}.`,
    `Generate ONLY these content blocks: ${selected.join(', ') || '(none)'}.`,
    'Do not invent phone numbers, emails, addresses, prices, credentials, or medical claims.',
    'For testimonials use generic attribution (e.g. "Paciente", "Cliente") — no real names.',
    'Services/catalog: 2-4 concise items when requested.',
    'Blog: at most 1 post when requested.',
    structureSummary ? `Structure rationale:\n${structureSummary}` : '',
    context.name ? `Brand/name: ${context.name}` : '',
    context.specialty ? `Specialty: ${context.specialty}` : '',
    brief ? `User note:\n${brief}` : 'User note: (none)',
    'Return ONLY one valid JSON object matching this shape (omit keys not requested):',
    JSON.stringify(shape),
  ].filter(Boolean).join('\n');
}

/**
 * Apply a successful AI result into local formData (mirror-friendly).
 */
export function applyAiAssistResult(formData = {}, { action, fieldPath, result } = {}) {
  const next = { ...formData };
  const text = sanitizeAiText(result?.text ?? result?.value ?? '');
  const normalizedAction = normalizeAiAction(action);

  if (normalizedAction === 'suggest_page_structure') {
    const suggestion = normalizeStructureSuggestion(result);
    if (suggestion.vertical) next.vertical = suggestion.vertical;
    for (const item of suggestion.recommendedSections) {
      next[item.flag] = item.enabled === true;
    }
    return next;
  }

  if (normalizedAction === 'generate_page_content') {
    const targets = Array.isArray(result?.targets) ? result.targets : [];
    const payload = result?.content && typeof result.content === 'object'
      ? result.content
      : result;
    return applyGeneratedPageContent(next, payload, { targets, onlyEmpty: true });
  }

  if (normalizedAction === 'polish_bio' || fieldPath === 'aboutBio') {
    next.aboutBio = text || next.aboutBio;
    return next;
  }
  if (normalizedAction === 'polish_tagline' || fieldPath === 'aboutTagline') {
    next.aboutTagline = text || next.aboutTagline;
    return next;
  }
  if (normalizedAction === 'rewrite_field' && fieldPath) {
    if (fieldPath === 'aboutBio') next.aboutBio = text;
    else if (fieldPath === 'aboutTagline') next.aboutTagline = text;
    else if (fieldPath.startsWith('heroSlides(') || fieldPath.startsWith('heroSlides[')) {
      // heroSlides[0].title | heroSlides[0].text
      const match = fieldPath.match(/heroSlides\[(\d+)\]\.(title|text)/);
      if (match) {
        const index = Number(match[1]);
        const key = match[2];
        const slides = Array.isArray(next.heroSlides) ? [...next.heroSlides] : [];
        if (slides[index]) {
          slides[index] = { ...slides[index], [key]: text };
          next.heroSlides = slides;
        }
      }
    }
    return next;
  }
  if (normalizedAction === 'hero_suggest' && result?.title != null) {
    const slides = Array.isArray(next.heroSlides) ? [...next.heroSlides] : [{}];
    slides[0] = {
      ...slides[0],
      title: sanitizeAiText(result.title) || slides[0].title,
      text: sanitizeAiText(result.text) || slides[0].text,
      showTitle: true,
      showText: true,
    };
    next.heroSlides = slides;
    return next;
  }
  if (normalizedAction === 'seo_meta') {
    next.seo = {
      ...(next.seo || {}),
      defaultTitle: sanitizeAiText(result?.title) || next.seo?.defaultTitle || '',
      defaultDescription: sanitizeAiText(result?.description) || next.seo?.defaultDescription || '',
    };
    return next;
  }
  if (normalizedAction === 'blog_draft' && result?.title) {
    const posts = Array.isArray(next.blogPosts) ? [...next.blogPosts] : [];
    posts.unshift({
      id: `ai-${Date.now()}`,
      title: sanitizeAiText(result.title),
      excerpt: sanitizeAiText(result.excerpt || ''),
      body: Array.isArray(result.body)
        ? result.body.map(sanitizeAiText).filter(Boolean)
        : [sanitizeAiText(result.body || text)].filter(Boolean),
      date: new Date().toISOString().slice(0, 10),
      enabled: true,
    });
    next.blogPosts = posts;
    next.blogSectionEnabled = true;
    return next;
  }
  if (normalizedAction === 'generate_logo') {
    const imageUrl = sanitizeAiText(result?.imageUrl || result?.url || '');
    if (!imageUrl) return next;
    if (fieldPath === 'navIconUrl') {
      next.navIconUrl = imageUrl;
      return next;
    }
    next.navLogoUrl = imageUrl;
    next.navMode = 'logo';
    return next;
  }
  if (normalizedAction === 'service_blurb' && typeof result?.index === 'number') {
    const services = Array.isArray(next.services) ? [...next.services] : [];
    if (services[result.index]) {
      services[result.index] = {
        ...services[result.index],
        description: text || services[result.index].description,
      };
      next.services = services;
    }
    return next;
  }
  return next;
}

export function buildAiSystemPrompt({ language = 'es', vertical = 'generic' } = {}) {
  const lang = language === 'en' ? 'English' : 'Spanish';
  return [
    'You are a writing assistant for professional service landing pages (psychology, therapy, coaching, clinics).',
    `Write in ${lang}.`,
    'Tone: warm, clear, ethical. Never invent clinical diagnoses, guarantees of cure, or medical claims.',
    'Return ONLY valid JSON as instructed. No markdown fences.',
    `Vertical context: ${vertical || 'generic'}.`,
  ].join(' ');
}

export function buildAiUserPrompt({
  action,
  tone = 'empathetic',
  fieldPath = '',
  currentValue = '',
  brief = '',
  context = {},
} = {}) {
  const name = context.name || '';
  const specialty = context.specialty || '';
  const normalizedAction = normalizeAiAction(action) || String(action ?? '').trim().toLowerCase();

  if (normalizedAction === 'generate_page_content') {
    return buildGeneratePageContentPrompt({
      language: context.language || 'es',
      brief,
      context,
      targets: context.targets || [],
      structureSummary: context.structureSummary || '',
    });
  }

  if (normalizedAction === 'suggest_page_structure') {
    return [
      'Action: suggest_page_structure',
      'Recommend which landing-page sections to enable for this business.',
      `Selected vertical (prefer unless the note clearly requires another): ${context.vertical || 'generic'}.`,
      'Allowed vertical values: generic, psychology, dental, veterinary, legal, medical, beauty, fitness, education, ecommerce.',
      `Allowed section flags: ${STRUCTURE_SECTION_FLAGS.join(', ')}.`,
      'Always enable heroSectionEnabled, aboutSectionEnabled, contactSectionEnabled, and footerSectionEnabled unless there is a strong reason not to.',
      'Do not invent contact details, prices, testimonials, credentials, or medical claims.',
      'Return ONLY one valid JSON object. No markdown fences.',
      'Use exactly this shape:',
      JSON.stringify({
        vertical: 'one allowed vertical value',
        summary: '1-2 sentences explaining the recommended structure',
        recommendedSections: [
          { flag: 'servicesSectionEnabled', enabled: true, reason: 'short reason' },
        ],
      }),
      name ? `Brand/name: ${name}` : '',
      specialty ? `Specialty: ${specialty}` : '',
      brief ? `User note:\n${brief}` : 'User note: (none)',
    ].filter(Boolean).join('\n');
  }

  const parts = [
    `Action: ${action}`,
    `Tone: ${normalizeAiTone(tone)}`,
    fieldPath ? `Field: ${fieldPath}` : '',
    name ? `Brand/name: ${name}` : '',
    specialty ? `Specialty: ${specialty}` : '',
    brief ? `Brief: ${brief}` : '',
    currentValue ? `Current text:\n${currentValue}` : '',
    'Respond as JSON object with keys appropriate to the action (at least "text" for rewrites).',
  ];
  return parts.filter(Boolean).join('\n');
}
