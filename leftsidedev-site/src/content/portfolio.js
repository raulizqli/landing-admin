/**
 * Portfolio / work — image placeholders marked for replacement.
 */

export const PORTFOLIO = [
  {
    slug: 'landing-cms',
    title: 'TapSite',
    industry: 'SaaS · Professional services',
    challenge:
      'Agencies needed many branded landings without forking code or paying for preview writes on every keystroke.',
    solution:
      'A central CMS with local mirror preview, shared template deploys, bilingual labels, and billing-gated features.',
    summary: 'Central admin, shared template, Firebase-backed pages for professionals and agencies.',
    imagePlaceholder: true,
    imageAlt: '[PLACEHOLDER] TapSite product screenshot — replace with real capture',
    demoUrl: 'https://leftsidedev.site',
    videoUrl: '',
    githubUrl: '',
    stack: ['React', 'Vite', 'Firebase', 'Cloud Functions', 'Tailwind'],
    technologies: ['React', 'Vite', 'Firebase', 'Cloud Functions', 'Tailwind'],
    features: [
      'Section-by-section editor with themes',
      'Mirror preview (local state, no write-per-key)',
      'Bilingual labels and vertical presets',
      'Custom domain routing',
      'Billing plans via Stripe',
    ],
    architecture: [
      'landing-admin edits formData locally',
      'Guardar y Publicar → pages/{pageId}',
      'landing-template getDoc once and render',
      'Optional external Firebase for Agency+',
    ],
    outcome: 'One deploy serves many tenants; editors get instant preview without Firestore thrash.',
    results: ['Zero-cost preview path', 'One deploy, many landings', 'English data model with legacy normalize'],
    ctaLabel: 'Discuss a similar platform',
    ctaHref: '/contact#discovery',
  },
  {
    slug: 'ops-agent-console',
    title: 'Ops Agent Console',
    industry: 'Operations · Support',
    challenge:
      'Support teams drowned in repetitive tickets while early AI bots lacked approvals and audit trails.',
    solution:
      'A supervision console for AI agents with confidence queues, tool-call logs, and human approve/edit/reject.',
    summary: 'Supervision UI for AI agents handling support and ops workflows with approvals.',
    imagePlaceholder: true,
    imageAlt: '[PLACEHOLDER] Ops Agent Console UI — replace with real capture',
    demoUrl: '',
    videoUrl: '',
    githubUrl: '',
    stack: ['React', 'Node.js', 'OpenAI', 'PostgreSQL', 'n8n'],
    technologies: ['React', 'Node.js', 'OpenAI', 'PostgreSQL', 'n8n'],
    features: [
      'Confidence-based queues',
      'Tool-call audit trail',
      'One-click approve / edit / reject',
      'Cost and latency panels',
    ],
    architecture: ['Webhook ingest', 'Agent runtime', 'Policy layer', 'Supervision UI', 'Write-back connectors'],
    outcome: 'First response dropped from hours to minutes on targeted queues while keeping humans on risky writes.',
    results: ['Minutes-not-hours first response', 'Human oversight on risky actions'],
    ctaLabel: 'Talk about AI ops',
    ctaHref: '/services/ai-agents',
  },
  {
    slug: 'knowledge-rag',
    title: 'Knowledge RAG Workspace',
    industry: 'Healthcare · Knowledge work',
    challenge:
      'Staff wasted hours searching policies; naive chatbots hallucinated and ignored permissions.',
    solution:
      'Role-aware retrieval with citations over approved corpora, hybrid search, and feedback into eval sets.',
    summary: 'Role-aware internal assistant with citations over policies and playbooks.',
    imagePlaceholder: true,
    imageAlt: '[PLACEHOLDER] Knowledge RAG workspace — replace with real capture',
    demoUrl: '',
    videoUrl: '',
    githubUrl: '',
    stack: ['React', 'pgvector', 'Firebase Auth', 'Embeddings API'],
    technologies: ['React', 'pgvector', 'Firebase Auth', 'Embeddings API'],
    features: ['Hybrid search', 'Citation drawer', 'Admin re-index', 'Feedback → eval set'],
    architecture: ['Connectors', 'Chunk/embed pipeline', 'Filtered retrieval', 'Grounded generation'],
    outcome: 'Higher trust via citations and fewer interruptions of subject-matter experts.',
    results: ['Higher trust via citations', 'Fewer expert interruptions'],
    ctaLabel: 'Explore RAG systems',
    ctaHref: '/services/rag-development',
  },
];

export function getPortfolioBySlug(slug) {
  return PORTFOLIO.find((item) => item.slug === slug) || null;
}
