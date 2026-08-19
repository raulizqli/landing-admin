export const SITE = {
  name: 'LeftSideDev',
  legalName: 'LeftSideDev',
  brand: 'Software Agency',
  tagline:
    'We design and build web platforms, mobile apps, AI-powered solutions, and enterprise software that help businesses automate operations and grow faster.',
  url: 'https://leftsidedev.site',
  locale: 'en_US',
  language: 'en',
  email: 'hello@leftsidedev.site',
  phone: '',
  location: 'Remote · LATAM · Global',
  calendlyUrl: import.meta.env.VITE_CALENDLY_URL || 'https://calendly.com/',
  linkedin: 'https://www.linkedin.com/',
  x: 'https://x.com/',
  github: 'https://github.com/',
  youtube: 'https://www.youtube.com/',
  ogImage: 'https://leftsidedev.site/og-default.svg',
  foundingYear: 2019,
  googleAdsenseAccount: 'ca-pub-8125831908133216',
  facebookDomainVerification: 'duaj2fc3ofev1y6etqswekkpvak2fk',
};

export const HERO = {
  headline: 'Custom Software, AI Automation & Scalable Applications',
  subheadline: SITE.tagline,
  proofPoints: [
    'Enterprise-grade Architecture',
    'AI Solutions',
    'Web & Mobile Development',
    'Cloud Native',
  ],
};

export const SPECIALIZATIONS = [
  'Custom Software',
  'AI Automation',
  'Web Applications',
  'Mobile Applications',
  'Cloud Architecture',
  'API Development',
  'System Integrations',
  'Business Dashboards',
  'Enterprise Platforms',
  'Legacy Modernization',
];

export const STATS = [
  { value: '120+', label: 'Projects Delivered' },
  { value: '7+', label: 'Years of Experience' },
  { value: '40+', label: 'Technologies' },
  { value: '98%', label: 'Client Satisfaction' },
];

export const VALUE_PROPS = [
  {
    icon: '◎',
    title: 'Business-first development',
    description:
      'We start from outcomes—revenue, cost, risk—then choose the architecture that delivers them.',
  },
  {
    icon: '◆',
    title: 'Senior engineering experience',
    description:
      'Architects and builders who ship production systems, not slideshow prototypes.',
  },
  {
    icon: '⇄',
    title: 'Fast communication',
    description:
      'Clear owners, short feedback loops, and written decisions you can share with stakeholders.',
  },
  {
    icon: '⬡',
    title: 'Modern technologies',
    description:
      'React, Node, Flutter, Firebase, cloud, and AI stacks chosen for maintainability—not hype.',
  },
  {
    icon: '▣',
    title: 'Scalable architecture',
    description:
      'Designs that survive growth: tenancy, observability, security boundaries, and cost control.',
  },
  {
    icon: '↺',
    title: 'Long-term support',
    description:
      'Runbooks, handoff, and optional retainers so your product stays healthy after launch.',
  },
];

/** @deprecated Prefer TECH_CARDS — kept for legacy imports */
export const TECH_STACK = [
  'React',
  'Next.js',
  'Node.js',
  'NestJS',
  'TypeScript',
  'Firebase',
  'Flutter',
  'Angular',
  'PostgreSQL',
  'MongoDB',
  'Docker',
  'Kubernetes',
  'OpenAI',
  'Azure',
  'AWS',
  'Google Cloud',
];

export const TECH_CARDS = [
  {
    name: 'React',
    explanation: 'Component-driven UI for complex product surfaces.',
    businessUse: 'Admin panels, marketing sites, and customer portals.',
  },
  {
    name: 'Next.js',
    explanation: 'App Router and SSR/SSG when SEO and performance matter.',
    businessUse: 'Public product sites and content-heavy applications.',
  },
  {
    name: 'Node.js',
    explanation: 'Event-driven backends and API gateways.',
    businessUse: 'Integrations, webhooks, and real-time services.',
  },
  {
    name: 'NestJS',
    explanation: 'Structured TypeScript services with modules and DI.',
    businessUse: 'Enterprise APIs with clear domain boundaries.',
  },
  {
    name: 'TypeScript',
    explanation: 'Typed contracts across frontend and backend.',
    businessUse: 'Fewer production bugs and safer refactors.',
  },
  {
    name: 'Firebase',
    explanation: 'Auth, Firestore, Functions, and Hosting for fast delivery.',
    businessUse: 'Multi-tenant SaaS and internal tools.',
  },
  {
    name: 'Flutter',
    explanation: 'Cross-platform mobile with one codebase.',
    businessUse: 'iOS and Android apps with shared business logic.',
  },
  {
    name: 'Angular',
    explanation: 'Opinionated SPA framework for large teams.',
    businessUse: 'Enterprise dashboards and regulated UIs.',
  },
  {
    name: 'PostgreSQL',
    explanation: 'Relational source of truth with strong integrity.',
    businessUse: 'Billing, inventory, and multi-tenant data models.',
  },
  {
    name: 'MongoDB',
    explanation: 'Document store for flexible product schemas.',
    businessUse: 'Content, event logs, and evolving domain models.',
  },
  {
    name: 'Docker',
    explanation: 'Reproducible environments and portable deploys.',
    businessUse: 'Consistent CI/CD from laptop to cloud.',
  },
  {
    name: 'Kubernetes',
    explanation: 'Orchestration for resilient multi-service systems.',
    businessUse: 'High-availability platforms with autoscaling.',
  },
  {
    name: 'OpenAI',
    explanation: 'Models, embeddings, and tool-calling for AI features.',
    businessUse: 'Agents, copilots, and document intelligence.',
  },
  {
    name: 'AWS',
    explanation: 'Broad cloud primitives for production workloads.',
    businessUse: 'Global apps with compliance and scale needs.',
  },
  {
    name: 'Azure',
    explanation: 'Enterprise cloud with Microsoft ecosystem fit.',
    businessUse: 'Corporate IT integrations and hybrid setups.',
  },
  {
    name: 'Google Cloud',
    explanation: 'Data, AI, and Firebase-adjacent cloud services.',
    businessUse: 'Analytics pipelines and ML-backed products.',
  },
];

export const PROCESS_STEPS = [
  {
    title: 'Discovery',
    description:
      'Clarify goals, constraints, users, and success metrics. We leave with a scoped problem—not a vague wish list.',
  },
  {
    title: 'Architecture',
    description:
      'Define data models, APIs, security, tenancy, and integration boundaries before writing product features.',
  },
  {
    title: 'Development',
    description:
      'Ship in short iterations with demos you can judge. Production-quality code from the first vertical slice.',
  },
  {
    title: 'QA',
    description:
      'Automated tests, manual edge cases, accessibility checks, and performance budgets before release.',
  },
  {
    title: 'Deployment',
    description:
      'CI/CD, environments, monitoring, and rollback paths. Launch is an engineered event—not a hope.',
  },
  {
    title: 'Support',
    description:
      'Documentation, handoff, and optional retainers so the system stays operable as your team grows.',
  },
];

export const METHODOLOGIES = [
  'Domain-driven design',
  'Secure-by-default cloud architecture',
  'Observable systems (logs, traces, cost controls)',
  'Human-in-the-loop where risk demands it',
  'Incremental delivery with measurable ROI',
];

export const NAV_LINKS = [
  { to: '/services', label: 'Services' },
  { to: '/industries', label: 'Industries' },
  { to: '/case-studies', label: 'Case Studies' },
  { to: '/portfolio', label: 'Work' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export const CTA = {
  primary: { label: 'Book a Free Consultation', href: '/contact#discovery' },
  secondary: { label: 'View Our Work', href: '/portfolio' },
  estimate: { label: 'Get a Project Estimate', href: '/estimate' },
  engineer: { label: 'Talk to an Engineer', href: '/contact' },
  build: { label: "Let's Build Your Project", href: '/contact#discovery' },
};
