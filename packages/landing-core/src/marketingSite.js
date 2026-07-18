/**
 * Enterprise Marketing Site model: siteMode, marketing settings, SEO, routes.
 * Routes are edited in-memory as `marketingRoutes` and persisted under
 * pages/{pageId}/routes/{routeId}.
 */

export const SITE_MODES = ['landing', 'marketing'];
export const DEFAULT_SITE_MODE = 'landing';

export const MARKETING_ROUTE_TYPES = [
  'home',
  'services_index',
  'service',
  'contact',
  'case_studies_index',
  'case_study',
  'blog_index',
  'blog_post',
  'estimate',
  'resources',
  'custom',
];

export const MVP_MARKETING_ROUTE_TYPES = ['home', 'services_index', 'service', 'contact'];

export const PHASE4_MARKETING_ROUTE_TYPES = [
  ...MVP_MARKETING_ROUTE_TYPES,
  'case_studies_index',
  'case_study',
  'blog_index',
  'blog_post',
  'estimate',
  'resources',
];

export const ROUTES_SUBCOLLECTION = 'routes';

const DEFAULT_ENABLED_ROUTE_TYPES = [...PHASE4_MARKETING_ROUTE_TYPES];

function asString(value) {
  return String(value ?? '').trim();
}

function asStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item)).filter(Boolean);
}

function asCta(value = {}) {
  return {
    label: asString(value?.label),
    href: asString(value?.href) || '/contact',
    external: value?.external === true,
  };
}

function asStat(value = {}) {
  return {
    value: asString(value?.value),
    label: asString(value?.label),
  };
}

function asStep(value = {}) {
  return {
    title: asString(value?.title),
    description: asString(value?.description),
  };
}

function asFaq(value = {}) {
  return {
    question: asString(value?.question),
    answer: asString(value?.answer),
  };
}

export function normalizeSiteMode(value) {
  const mode = asString(value).toLowerCase();
  return SITE_MODES.includes(mode) ? mode : DEFAULT_SITE_MODE;
}

export function isMarketingSite(pageData) {
  return normalizeSiteMode(pageData?.siteMode) === 'marketing';
}

export function normalizeMarketingSeo(value = {}) {
  return {
    defaultTitle: asString(value?.defaultTitle),
    defaultDescription: asString(value?.defaultDescription),
    ogImageUrl: asString(value?.ogImageUrl),
    canonicalBaseUrl: asString(value?.canonicalBaseUrl).replace(/\/$/, ''),
  };
}

export function createEmptyMarketingSettings(overrides = {}) {
  return {
    enabledRouteTypes: [...DEFAULT_ENABLED_ROUTE_TYPES],
    primaryCta: asCta({ label: 'Book a Discovery Call', href: '/contact' }),
    secondaryCta: asCta({ label: 'View Services', href: '/services' }),
    stickyCtaEnabled: true,
    floatingContactEnabled: true,
    calendlyUrl: '',
    newsletterEnabled: false,
    stats: [
      { value: '120+', label: 'Projects Delivered' },
      { value: '7+', label: 'Years of Experience' },
      { value: '40+', label: 'Technologies' },
      { value: '98%', label: 'Client Satisfaction' },
    ],
    specializations: [
      'AI Agents',
      'RAG Systems',
      'MCP Integrations',
      'Workflow Automation',
      'Custom Software',
      'Web Applications',
    ],
    techStack: ['React', 'Node.js', 'Firebase', 'OpenAI', 'TypeScript'],
    processSteps: [
      { title: 'Discover', description: 'Map goals, constraints, and success metrics.' },
      { title: 'Architect', description: 'Design agents, APIs, data, and security boundaries.' },
      { title: 'Build', description: 'Ship in short iterations with demos and observability.' },
      { title: 'Scale', description: 'Harden, document, and transfer ownership.' },
    ],
    ...overrides,
  };
}

export function normalizeMarketingSettings(value = {}) {
  const base = createEmptyMarketingSettings();
  const enabled = Array.isArray(value?.enabledRouteTypes)
    ? value.enabledRouteTypes.map((item) => asString(item)).filter((item) => MARKETING_ROUTE_TYPES.includes(item))
    : base.enabledRouteTypes;

  return {
    enabledRouteTypes: enabled.length ? [...new Set(enabled)] : [...DEFAULT_ENABLED_ROUTE_TYPES],
    primaryCta: asCta(value?.primaryCta ?? base.primaryCta),
    secondaryCta: asCta(value?.secondaryCta ?? base.secondaryCta),
    stickyCtaEnabled: value?.stickyCtaEnabled !== false,
    floatingContactEnabled: value?.floatingContactEnabled !== false,
    calendlyUrl: asString(value?.calendlyUrl),
    newsletterEnabled: value?.newsletterEnabled === true,
    stats: Array.isArray(value?.stats) && value.stats.length
      ? value.stats.map(asStat).filter((item) => item.value || item.label)
      : base.stats,
    specializations: asStringArray(value?.specializations).length
      ? asStringArray(value?.specializations)
      : base.specializations,
    techStack: asStringArray(value?.techStack).length
      ? asStringArray(value?.techStack)
      : base.techStack,
    processSteps: Array.isArray(value?.processSteps) && value.processSteps.length
      ? value.processSteps.map(asStep).filter((item) => item.title || item.description)
      : base.processSteps,
  };
}

export function slugify(value) {
  return asString(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export function pathForMarketingRoute(type, slug = '') {
  const cleanSlug = slugify(slug);
  switch (type) {
    case 'home':
      return '/';
    case 'services_index':
      return '/services';
    case 'service':
      return cleanSlug ? `/services/${cleanSlug}` : '/services';
    case 'contact':
      return '/contact';
    case 'case_studies_index':
      return '/case-studies';
    case 'case_study':
      return cleanSlug ? `/case-studies/${cleanSlug}` : '/case-studies';
    case 'blog_index':
      return '/blog';
    case 'blog_post':
      return cleanSlug ? `/blog/${cleanSlug}` : '/blog';
    case 'estimate':
      return '/estimate';
    case 'resources':
      return '/resources';
    case 'custom':
      return cleanSlug ? `/${cleanSlug}` : '/';
    default:
      return '/';
  }
}

function emptyServiceContent() {
  return {
    summary: '',
    whoFor: '',
    problems: [''],
    benefits: [''],
    technologies: [],
    architecture: [''],
    process: [''],
    faqs: [{ question: '', answer: '' }],
    comparison: '',
    roi: '',
    metaDescription: '',
  };
}

function emptyHomeContent() {
  return {
    headline: '',
    subheadline: '',
    supportingText: '',
  };
}

function emptyContactContent() {
  return {
    headline: 'Book a discovery call',
    body: 'Tell us what you want to build. We will map fit, timeline, and next steps.',
  };
}

function emptyIndexContent() {
  return {
    headline: '',
    body: '',
  };
}

function emptyCaseStudyContent() {
  return {
    client: '',
    industry: '',
    summary: '',
    problem: '',
    solution: '',
    architecture: [''],
    technologies: [],
    timeline: '',
    results: [{ label: '', value: '' }],
    testimonialQuote: '',
    testimonialAuthor: '',
    testimonialRole: '',
  };
}

function emptyBlogPostContent() {
  return {
    category: 'AI',
    date: '',
    readingMinutes: 5,
    excerpt: '',
    tags: [],
    body: [''],
  };
}

function emptyEstimateContent() {
  return {
    headline: 'Estimate your project',
    body: 'A planning range—not a quote. Discovery still validates integrations and success metrics.',
    baseMvp: 12000,
    baseProduct: 28000,
    basePlatform: 55000,
  };
}

function emptyResourcesContent() {
  return {
    headline: 'Free AI implementation checklist',
    body: 'A practical guide for leaders and builders preparing their first production AI workflow.',
    checklist: [
      'Name the job-to-be-done and the metric that proves success.',
      'Inventory systems of record and who owns credentials.',
      'Classify actions: read, draft, write—and where humans must approve.',
      'List 10 real failure cases for your first eval set.',
    ],
    guideTitle: 'Free guide: AI for businesses',
    guideBody: 'Start where tickets and documents already concentrate value. Fund data cleanup. Measure a baseline before you launch.',
  };
}

function emptyContentForType(type) {
  switch (type) {
    case 'service':
      return emptyServiceContent();
    case 'home':
      return emptyHomeContent();
    case 'contact':
      return emptyContactContent();
    case 'case_study':
      return emptyCaseStudyContent();
    case 'blog_post':
      return emptyBlogPostContent();
    case 'estimate':
      return emptyEstimateContent();
    case 'resources':
      return emptyResourcesContent();
    default:
      return emptyIndexContent();
  }
}

function asResult(value = {}) {
  return {
    label: asString(value?.label),
    value: asString(value?.value),
  };
}

export function createEmptyMarketingRoute(partial = {}) {
  const type = MARKETING_ROUTE_TYPES.includes(partial.type) ? partial.type : 'custom';
  const slug = type === 'service' || type === 'case_study' || type === 'blog_post' || type === 'custom'
    ? slugify(partial.slug || partial.title || 'page')
    : '';
  const id = asString(partial.id) || `${type}${slug ? `-${slug}` : ''}` || `route-${Date.now()}`;
  const content = { ...emptyContentForType(type), ...(partial.content || {}) };

  return {
    id,
    type,
    slug,
    path: pathForMarketingRoute(type, slug),
    enabled: partial.enabled !== false,
    sortOrder: Number.isFinite(Number(partial.sortOrder)) ? Number(partial.sortOrder) : 0,
    title: asString(partial.title),
    seo: {
      title: asString(partial.seo?.title),
      description: asString(partial.seo?.description),
      ogImageUrl: asString(partial.seo?.ogImageUrl),
      noIndex: partial.seo?.noIndex === true,
    },
    content: normalizeRouteContent(type, content),
  };
}

function normalizeStringList(value, { min = 0 } = {}) {
  const list = Array.isArray(value) ? value.map((item) => asString(item)) : [];
  const cleaned = list.filter(Boolean);
  if (cleaned.length >= min) return cleaned.length ? cleaned : (min > 0 ? [''] : []);
  while (cleaned.length < min) cleaned.push('');
  return cleaned;
}

export function normalizeRouteContent(type, content = {}) {
  if (type === 'service') {
    return {
      summary: asString(content.summary),
      whoFor: asString(content.whoFor),
      problems: normalizeStringList(content.problems, { min: 1 }),
      benefits: normalizeStringList(content.benefits, { min: 1 }),
      technologies: asStringArray(content.technologies),
      architecture: normalizeStringList(content.architecture, { min: 1 }),
      process: normalizeStringList(content.process, { min: 1 }),
      faqs: Array.isArray(content.faqs) && content.faqs.length
        ? content.faqs.map(asFaq)
        : [{ question: '', answer: '' }],
      comparison: asString(content.comparison),
      roi: asString(content.roi),
      metaDescription: asString(content.metaDescription),
    };
  }
  if (type === 'home') {
    return {
      headline: asString(content.headline),
      subheadline: asString(content.subheadline),
      supportingText: asString(content.supportingText),
    };
  }
  if (type === 'contact') {
    return {
      headline: asString(content.headline) || 'Book a discovery call',
      body: asString(content.body),
    };
  }
  if (type === 'case_study') {
    return {
      client: asString(content.client),
      industry: asString(content.industry),
      summary: asString(content.summary),
      problem: asString(content.problem),
      solution: asString(content.solution),
      architecture: normalizeStringList(content.architecture, { min: 1 }),
      technologies: asStringArray(content.technologies),
      timeline: asString(content.timeline),
      results: Array.isArray(content.results) && content.results.length
        ? content.results.map(asResult)
        : [{ label: '', value: '' }],
      testimonialQuote: asString(content.testimonialQuote),
      testimonialAuthor: asString(content.testimonialAuthor),
      testimonialRole: asString(content.testimonialRole),
    };
  }
  if (type === 'blog_post') {
    const minutes = Number(content.readingMinutes);
    return {
      category: asString(content.category) || 'AI',
      date: asString(content.date),
      readingMinutes: Number.isFinite(minutes) && minutes > 0 ? minutes : 5,
      excerpt: asString(content.excerpt),
      tags: asStringArray(content.tags),
      body: normalizeStringList(content.body, { min: 1 }),
    };
  }
  if (type === 'estimate') {
    return {
      headline: asString(content.headline) || 'Estimate your project',
      body: asString(content.body),
      baseMvp: Number(content.baseMvp) || 12000,
      baseProduct: Number(content.baseProduct) || 28000,
      basePlatform: Number(content.basePlatform) || 55000,
    };
  }
  if (type === 'resources') {
    return {
      headline: asString(content.headline) || 'Free AI implementation checklist',
      body: asString(content.body),
      checklist: normalizeStringList(content.checklist, { min: 1 }),
      guideTitle: asString(content.guideTitle) || 'Free guide: AI for businesses',
      guideBody: asString(content.guideBody),
    };
  }
  return {
    headline: asString(content.headline),
    body: asString(content.body),
  };
}

export function normalizeMarketingRoute(raw = {}) {
  const type = MARKETING_ROUTE_TYPES.includes(raw.type) ? raw.type : 'custom';
  const slug = slugify(raw.slug);
  const route = createEmptyMarketingRoute({
    ...raw,
    type,
    slug,
    content: normalizeRouteContent(type, raw.content || {}),
  });
  route.path = pathForMarketingRoute(type, slug);
  return route;
}

export function normalizeMarketingRoutes(value) {
  if (!Array.isArray(value)) return [];
  const routes = value.map(normalizeMarketingRoute);
  const seen = new Set();
  return routes.filter((route) => {
    if (seen.has(route.id)) return false;
    seen.add(route.id);
    return true;
  }).sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

export function createMarketingSiteSkeleton({ name = 'Marketing Site', brand = 'AI Engineering Studio' } = {}) {
  return normalizeMarketingRoutes([
    {
      id: 'home',
      type: 'home',
      title: 'Home',
      sortOrder: 0,
      content: {
        headline: `${name}`,
        subheadline: brand,
        supportingText: 'We build AI-powered software, custom applications and intelligent automations that help businesses scale.',
      },
      seo: {
        title: `${name} — ${brand}`,
        description: 'AI-powered software, custom applications and intelligent automations.',
      },
    },
    {
      id: 'services-index',
      type: 'services_index',
      title: 'Services',
      sortOrder: 10,
      content: {
        headline: 'Services',
        body: 'Specialized AI engineering and custom software—not a generic software shop.',
      },
    },
    {
      id: 'service-ai-agents',
      type: 'service',
      slug: 'ai-agents',
      title: 'AI Agents',
      sortOrder: 11,
      content: {
        summary: 'Production-grade AI agents that research, decide, call tools, and complete multi-step work.',
        whoFor: 'Ops, support, and product teams that need reliable automation beyond chatbots.',
        problems: [
          'Repetitive multi-step workflows still depend on humans.',
          'Chatbots cannot take safe, auditable actions.',
        ],
        benefits: [
          'Agents with tool contracts and guardrails.',
          'Human-in-the-loop for high-risk writes.',
        ],
        technologies: ['OpenAI', 'LangGraph', 'MCP', 'Node.js'],
        architecture: ['Orchestrator agent', 'Policy layer', 'Observability'],
        process: ['Define jobs-to-be-done', 'Build vertical slice', 'Harden and roll out'],
        faqs: [
          {
            question: 'What is an AI agent?',
            answer: 'Software that plans steps, calls tools, and completes a goal with memory and guardrails.',
          },
        ],
        comparison: 'Unlike chatbot widgets, agents are engineered as operable software systems.',
        roi: 'Typical pilots cut handling time 40–90% on targeted workflows.',
        metaDescription: 'Build production AI agents with tool use, guardrails, and integrations.',
      },
      seo: {
        title: 'AI Agents',
        description: 'Production AI agents with tool use, guardrails, and evals.',
      },
    },
    {
      id: 'case-studies-index',
      type: 'case_studies_index',
      title: 'Case Studies',
      sortOrder: 20,
      content: {
        headline: 'Case studies',
        body: 'Problem → Solution → Architecture → Results.',
      },
    },
    {
      id: 'case-support-agents',
      type: 'case_study',
      slug: 'support-ai-agents',
      title: 'AI agents that cut support response time from 18 hours to under 2 minutes',
      sortOrder: 21,
      content: {
        client: 'Regional SaaS support org',
        industry: 'B2B Software',
        summary: 'Reduced customer support response time from 18 hours to under 2 minutes using AI Agents and workflow automation.',
        problem: 'Tier-1 tickets sat in a shared inbox for hours. CSAT slipped while hiring lagged ticket growth.',
        solution: 'A supervised AI agent classifies tickets, retrieves grounded answers, drafts replies, and escalates high-risk cases.',
        architecture: [
          'Helpdesk webhooks',
          'Classifier + RAG',
          'Draft generator',
          'Human approval for risky writes',
        ],
        technologies: ['OpenAI', 'RAG', 'n8n', 'Node.js'],
        timeline: '6 weeks to supervised production',
        results: [
          { label: 'First response time', value: '18h → <2 min' },
          { label: 'Tier-1 deflection', value: '62%' },
        ],
        testimonialQuote: 'The agent did not replace our team—it removed the queue.',
        testimonialAuthor: 'Head of Support',
        testimonialRole: 'B2B SaaS',
      },
    },
    {
      id: 'blog-index',
      type: 'blog_index',
      title: 'Blog',
      sortOrder: 30,
      content: {
        headline: 'Blog',
        body: 'Technical notes on AI engineering, architecture, and automation.',
      },
    },
    {
      id: 'blog-how-to-build-ai-agents',
      type: 'blog_post',
      slug: 'how-to-build-ai-agents',
      title: 'How to Build AI Agents That Survive Production',
      sortOrder: 31,
      content: {
        category: 'AI',
        date: '2026-06-12',
        readingMinutes: 12,
        excerpt: 'A practical blueprint for tool contracts, guardrails, evals, and human-in-the-loop.',
        tags: ['AI Agents', 'Evals', 'Architecture'],
        body: [
          'Most AI agent demos collapse under permissions, flaky tools, and unclear ownership.',
          'Start from a job-to-be-done with a measurable outcome.',
          'Model tools as typed contracts with idempotency keys and explicit side-effect levels.',
          'Ship in stages: shadow mode, supervised, then autonomy on the narrow safe path.',
        ],
      },
    },
    {
      id: 'estimate',
      type: 'estimate',
      title: 'Estimate',
      sortOrder: 80,
      content: {
        headline: 'Estimate your project',
        body: 'A planning range—not a quote. Discovery still validates integrations and success metrics.',
      },
    },
    {
      id: 'resources',
      type: 'resources',
      title: 'Resources',
      sortOrder: 85,
      content: emptyResourcesContent(),
    },
    {
      id: 'contact',
      type: 'contact',
      title: 'Contact',
      sortOrder: 90,
      content: {
        headline: 'Book a discovery call',
        body: 'Tell us what you want to build. We will respond with next steps and fit.',
      },
    },
  ]);
}

export function findMarketingRouteByPath(routes, pathname = '/') {
  const path = asString(pathname) || '/';
  const normalized = path.length > 1 ? path.replace(/\/$/, '') : path;
  const list = normalizeMarketingRoutes(routes).filter((route) => route.enabled);
  return list.find((route) => route.path === normalized)
    || list.find((route) => route.type === 'home' && (normalized === '/' || normalized === ''))
    || null;
}

export function listEnabledMarketingNav(routes) {
  const list = normalizeMarketingRoutes(routes).filter((route) => route.enabled);
  const navTypes = new Set(['home', 'services_index', 'contact', 'case_studies_index', 'blog_index', 'estimate', 'resources']);
  return list
    .filter((route) => navTypes.has(route.type))
    .map((route) => ({
      to: route.path,
      label: route.title || route.type,
      type: route.type,
    }));
}

/** Strip editor-only fields before persisting the site root document. */
export function stripMarketingEditorFields(pageData = {}) {
  const next = { ...pageData };
  delete next.marketingRoutes;
  delete next.activeMarketingRouteId;
  return next;
}

export function marketingRouteToFirestore(route) {
  const normalized = normalizeMarketingRoute(route);
  const { id, ...rest } = normalized;
  return { ...rest, id };
}
