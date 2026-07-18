export const SITE = {
  name: 'LeftSideDev',
  legalName: 'LeftSideDev',
  brand: 'AI Engineering Studio',
  tagline:
    'We build AI-powered software, custom applications and intelligent automations that help businesses scale.',
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
};

export const SPECIALIZATIONS = [
  'AI Agents',
  'RAG Systems',
  'MCP Integrations',
  'Workflow Automation',
  'Custom Software',
  'Web Applications',
  'Mobile Applications',
  'Cloud Solutions',
  'Firebase',
  'Enterprise Systems',
];

export const STATS = [
  { value: '120+', label: 'Projects Delivered' },
  { value: '7+', label: 'Years of Experience' },
  { value: '40+', label: 'Technologies' },
  { value: '98%', label: 'Client Satisfaction' },
];

export const TECH_STACK = [
  'OpenAI',
  'Anthropic',
  'LangGraph',
  'MCP',
  'React',
  'Angular',
  'Node.js',
  'Firebase',
  'PostgreSQL',
  'n8n',
  'AWS',
  'GCP',
  'Flutter',
  'PHP',
  'TypeScript',
];

export const PROCESS_STEPS = [
  {
    title: 'Discover',
    description: 'Map goals, constraints, data sources, and success metrics in a focused discovery call.',
  },
  {
    title: 'Architect',
    description: 'Design the system: agents, RAG pipelines, APIs, data model, and security boundaries.',
  },
  {
    title: 'Build',
    description: 'Ship in short iterations with demos, observability, and production-ready code quality.',
  },
  {
    title: 'Scale',
    description: 'Harden, automate, document, and transfer ownership so your team can operate confidently.',
  },
];

export const METHODOLOGIES = [
  'Domain-driven design',
  'Secure-by-default cloud architecture',
  'Observable AI systems (traces, evals, cost controls)',
  'Human-in-the-loop where risk demands it',
  'Incremental delivery with measurable ROI',
];

export const NAV_LINKS = [
  { to: '/services', label: 'Services' },
  { to: '/case-studies', label: 'Case Studies' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export const CTA = {
  primary: { label: 'Book a Discovery Call', href: '/contact#discovery' },
  secondary: { label: 'View Case Studies', href: '/case-studies' },
  estimate: { label: 'Estimate My Project', href: '/estimate' },
};
