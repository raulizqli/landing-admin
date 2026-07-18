/**
 * AI Assist helpers — lanes, actions, and local apply (no Firestore writes).
 * Keep in sync with Cloud Functions runAiAssist allow-lists.
 */

import {
  accountHasFeature,
  getAiMonthlyQuota,
  getBillingPlan,
  isBillingAccountActive,
} from './billingPlans.js';

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
];

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
 * Apply a successful AI result into local formData (mirror-friendly).
 */
export function applyAiAssistResult(formData = {}, { action, fieldPath, result } = {}) {
  const next = { ...formData };
  const text = sanitizeAiText(result?.text ?? result?.value ?? '');
  const normalizedAction = normalizeAiAction(action);

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
