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

export const ROUTES_SUBCOLLECTION = 'routes';

const DEFAULT_ENABLED_ROUTE_TYPES = [...MVP_MARKETING_ROUTE_TYPES];

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

export function createEmptyMarketingRoute(partial = {}) {
  const type = MARKETING_ROUTE_TYPES.includes(partial.type) ? partial.type : 'custom';
  const slug = type === 'service' || type === 'case_study' || type === 'blog_post' || type === 'custom'
    ? slugify(partial.slug || partial.title || 'page')
    : '';
  const id = asString(partial.id) || `${type}${slug ? `-${slug}` : ''}` || `route-${Date.now()}`;

  let content;
  if (type === 'service') content = { ...emptyServiceContent(), ...(partial.content || {}) };
  else if (type === 'home') content = { ...emptyHomeContent(), ...(partial.content || {}) };
  else if (type === 'contact') content = { ...emptyContactContent(), ...(partial.content || {}) };
  else content = { ...emptyIndexContent(), ...(partial.content || {}) };

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
