export const PORTFOLIO = [
  {
    slug: 'landing-cms',
    title: 'Landing CMS Multi-tenant',
    summary: 'Central admin, shared template, Firebase-backed pages for professionals and agencies.',
    demoUrl: 'https://leftsidedev.site',
    videoUrl: '',
    githubUrl: '',
    stack: ['React', 'Vite', 'Firebase', 'Cloud Functions', 'Tailwind'],
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
    results: ['Zero-cost preview path', 'One deploy, many landings', 'English data model with legacy normalize'],
  },
  {
    slug: 'ops-agent-console',
    title: 'Ops Agent Console',
    summary: 'Supervision UI for AI agents handling support and ops workflows with approvals.',
    demoUrl: '',
    videoUrl: '',
    githubUrl: '',
    stack: ['React', 'Node.js', 'OpenAI', 'PostgreSQL', 'n8n'],
    features: [
      'Confidence-based queues',
      'Tool-call audit trail',
      'One-click approve / edit / reject',
      'Cost and latency panels',
    ],
    architecture: ['Webhook ingest', 'Agent runtime', 'Policy layer', 'Supervision UI', 'Write-back connectors'],
    results: ['Minutes-not-hours first response', 'Human oversight on risky actions'],
  },
  {
    slug: 'knowledge-rag',
    title: 'Knowledge RAG Workspace',
    summary: 'Role-aware internal assistant with citations over policies and playbooks.',
    demoUrl: '',
    videoUrl: '',
    githubUrl: '',
    stack: ['React', 'pgvector', 'Firebase Auth', 'Embeddings API'],
    features: ['Hybrid search', 'Citation drawer', 'Admin re-index', 'Feedback → eval set'],
    architecture: ['Connectors', 'Chunk/embed pipeline', 'Filtered retrieval', 'Grounded generation'],
    results: ['Higher trust via citations', 'Fewer expert interruptions'],
  },
];

export function getPortfolioBySlug(slug) {
  return PORTFOLIO.find((item) => item.slug === slug) || null;
}
