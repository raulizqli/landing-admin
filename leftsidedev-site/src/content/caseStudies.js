export const CASE_STUDIES = [
  {
    slug: 'support-ai-agents',
    client: 'Regional SaaS support org',
    industry: 'B2B Software',
    title: 'AI agents that cut support response time from 18 hours to under 2 minutes',
    summary:
      'Reduced customer support response time from 18 hours to under 2 minutes using AI Agents and workflow automation.',
    problem:
      'Tier-1 tickets sat in a shared inbox for hours. Agents copy-pasted from outdated macros, and after-hours coverage was inconsistent. CSAT slipped while hiring lagged ticket growth.',
    solution:
      'We designed a supervised AI agent that classifies tickets, retrieves grounded answers via RAG, drafts replies, and only escalates ambiguous or high-risk cases. Approvals stayed one click away in Slack.',
    architecture: [
      'Ingest tickets from helpdesk webhooks',
      'Classifier + priority scorer',
      'RAG over macros, product docs, and resolved tickets',
      'Draft generator with citation checks',
      'Human approval for refunds/account changes',
      'Write-back to helpdesk + analytics warehouse',
    ],
    technologies: ['OpenAI', 'RAG', 'n8n', 'Node.js', 'Slack', 'PostgreSQL'],
    timeline: '6 weeks to supervised production · 10 weeks to high autonomy on Tier-1',
    results: [
      { label: 'First response time', value: '18h → <2 min' },
      { label: 'Tier-1 deflection', value: '62%' },
      { label: 'CSAT delta', value: '+11 pts' },
      { label: 'Agent handle time', value: '−47%' },
    ],
    testimonial: {
      quote:
        'The agent did not replace our team—it removed the queue. Humans finally work the exceptions that matter.',
      author: 'Head of Support',
      role: 'B2B SaaS',
    },
    screenshots: [
      { alt: 'Agent supervision dashboard mock', caption: 'Supervision queue with confidence scores' },
      { alt: 'Architecture diagram mock', caption: 'Ticket → RAG → draft → approval → helpdesk' },
    ],
  },
  {
    slug: 'rag-knowledge-assistant',
    client: 'Multi-clinic healthcare network',
    industry: 'Healthcare operations',
    title: 'Internal RAG assistant for policies and clinical ops playbooks',
    summary:
      'Gave clinic managers cited answers from 4,000+ internal documents with role-aware retrieval.',
    problem:
      'Policies lived in PDFs and shared drives. Managers pinged specialists for the same answers daily. Onboarding new staff took weeks.',
    solution:
      'Built a permission-aware RAG assistant with hybrid search, citation UX, and admin re-indexing. Sensitive content stayed filtered by clinic role.',
    architecture: [
      'Document connectors + scheduled re-ingest',
      'Chunking by document type',
      'Hybrid search + re-rank',
      'ACL filters on every retrieval',
      'Feedback capture for eval sets',
    ],
    technologies: ['pgvector', 'Firebase Auth', 'Node.js', 'React', 'OpenAI Embeddings'],
    timeline: '8 weeks',
    results: [
      { label: 'Search time', value: '−70%' },
      { label: 'Expert interruptions', value: '−45%' },
      { label: 'Groundedness (eval)', value: '94%' },
    ],
    testimonial: {
      quote: 'People trust the answers because they can see the source. That changed adoption overnight.',
      author: 'Ops Director',
      role: 'Healthcare network',
    },
    screenshots: [{ alt: 'Cited answer UI', caption: 'Answers with source snippets and roles' }],
  },
  {
    slug: 'firebase-multi-tenant-cms',
    client: 'LeftSideDev Landing CMS',
    industry: 'Developer tools / SaaS',
    title: 'Multi-tenant landing CMS on Firebase with zero-cost live preview',
    summary:
      'Shipped a multi-tenant CMS where editors get instant mirror preview without Firestore writes per keystroke.',
    problem:
      'Agencies and professionals needed many landings without redeploying code for every copy change—and without burning Firebase quota on preview.',
    solution:
      'Architected hub Firebase + optional external Firebase, section themes, bilingual labels, and a mirror preview that renders local form state.',
    architecture: [
      'Admin SPA with local formData',
      'Mirror LandingPage component (no iframe DB polling)',
      'Normalize on read / English fields on write',
      'Hosting deploy hooks for Agency+',
    ],
    technologies: ['React', 'Vite', 'Firebase', 'Cloud Functions', 'Tailwind'],
    timeline: 'Ongoing product',
    results: [
      { label: 'Preview Firestore writes', value: '0 / keystroke' },
      { label: 'Time to publish copy', value: 'Minutes' },
      { label: 'Tenancy model', value: 'pages/{pageId}' },
    ],
    testimonial: {
      quote: 'The mirror preview is the product. Clients feel the edit before we ever hit publish.',
      author: 'Product team',
      role: 'LeftSideDev',
    },
    screenshots: [{ alt: 'CMS three-panel layout', caption: 'List · form · device mirror' }],
  },
];

export function getCaseStudyBySlug(slug) {
  return CASE_STUDIES.find((item) => item.slug === slug) || null;
}
