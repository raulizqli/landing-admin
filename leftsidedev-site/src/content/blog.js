export const BLOG_CATEGORIES = [
  'AI',
  'Software Development',
  'Cloud',
  'Mobile',
  'Web',
  'Firebase',
  'Node.js',
  'React',
  'Business Automation',
  'Integrations',
  // Legacy categories kept so existing posts keep grouping
  'Angular',
  'Node',
  'Automation',
  'MCP',
  'RAG',
  'LLMs',
  'Architecture',
];

export const BLOG_POSTS = [
  {
    slug: 'how-to-build-ai-agents',
    title: 'How to Build AI Agents That Survive Production',
    category: 'AI',
    date: '2026-06-12',
    readingMinutes: 12,
    excerpt:
      'A practical blueprint for tool contracts, guardrails, evals, and human-in-the-loop—beyond chatbot demos.',
    tags: ['AI Agents', 'Evals', 'Architecture'],
    body: [
      'Most “AI agent” demos collapse under permissions, flaky tools, and unclear ownership. Production agents are software systems.',
      'Start from a job-to-be-done with a measurable outcome: time-to-first-response, tickets deflected, or invoices matched. If you cannot name the metric, you are not ready to automate.',
      'Model tools as typed contracts with idempotency keys and explicit side-effect levels (read, draft, write). High-risk writes need approval gates.',
      'Add an eval set before you polish the UI. Ten real failure cases beat a hundred happy-path screenshots.',
      'Ship in stages: shadow mode (suggest only), supervised (one-click approve), then autonomy on the narrow path that clears your quality bar.',
      'Instrument everything: traces, token cost, tool error rates, and human override reasons. Agents improve when operations is a product surface.',
    ],
  },
  {
    slug: 'cursor-vs-claude-code',
    title: 'Cursor vs Claude Code: Choosing an AI Coding Workflow',
    category: 'AI',
    date: '2026-05-28',
    readingMinutes: 9,
    excerpt: 'How we pick IDE-native agents vs CLI workflows for delivery teams building real products.',
    tags: ['Cursor', 'Claude', 'Developer Experience'],
    body: [
      'The question is less “which model is smarter?” and more “which workflow fits your repo, review culture, and risk profile?”',
      'Cursor shines when the loop is visual: multi-file edits, inline review, and designers/engineers sharing a branch context.',
      'CLI-oriented flows excel in headless CI, scripted refactors, and servers where a full IDE is not the control plane.',
      'For client work we often combine both: IDE agents for feature slices, CLI agents for repetitive migrations with tight prompts and tests.',
      'Whatever you choose, keep secrets out of prompts, require tests for generated code, and treat agent diffs like junior PRs.',
    ],
  },
  {
    slug: 'react-best-practices-2026',
    title: 'React Best Practices for 2026 Product Teams',
    category: 'React',
    date: '2026-05-10',
    readingMinutes: 10,
    excerpt: 'Boundaries, data fetching, accessibility, and performance—without cargo-cult memoization.',
    tags: ['React', 'Performance', 'A11y'],
    body: [
      'Prefer clear feature boundaries over premature useMemo. Measure before you memoize.',
      'Colocate UI with its data requirements; keep server contracts typed.',
      'Treat accessibility as a release gate: focus order, labels, contrast, and reduced motion.',
      'Code-split routes and heavy editors. Keep the first viewport lean.',
      'When AI features enter the UI, isolate streaming and error states so the rest of the app stays calm.',
    ],
  },
  {
    slug: 'angular-performance',
    title: 'Angular Performance: Practical Wins That Matter',
    category: 'Angular',
    date: '2026-04-22',
    readingMinutes: 8,
    excerpt: 'Change detection, bundle discipline, and upgrade paths for enterprise Angular apps.',
    tags: ['Angular', 'Performance'],
    body: [
      'Profile before rewriting. Many apps need OnPush discipline and smarter lists more than a new framework.',
      'Track bundle composition on every PR. Lazy routes are still the highest leverage tool.',
      'Modernize incrementally: compiler options, standalone migration, then signals where they simplify state.',
      'Pair performance work with UX: skeletons and optimistic UI often beat micro-optimizations users never feel.',
    ],
  },
  {
    slug: 'firebase-authentication-patterns',
    title: 'Firebase Authentication Patterns That Scale',
    category: 'Firebase',
    date: '2026-04-02',
    readingMinutes: 11,
    excerpt: 'App Check, custom claims, multi-tenant roles, and avoiding rules that slowly become Swiss cheese.',
    tags: ['Firebase', 'Auth', 'Security'],
    body: [
      'Auth is not a checkbox—it is the root of your tenancy model.',
      'Use custom claims for roles; keep Firestore rules boring and reviewable.',
      'Turn on App Check early for public clients. Abuse is cheaper to prevent than to clean up.',
      'Privileged writes belong in Cloud Functions with Admin SDK—not in hopeful client rules.',
    ],
  },
  {
    slug: 'building-rag-systems',
    title: 'Building RAG Systems Teams Will Actually Trust',
    category: 'RAG',
    date: '2026-03-18',
    readingMinutes: 13,
    excerpt: 'Chunking, hybrid search, ACLs, citations, and evals—the unsexy work behind trustworthy answers.',
    tags: ['RAG', 'LLMs', 'Search'],
    body: [
      'Retrieval quality dominates model choice for internal knowledge tasks.',
      'Store ACL metadata with every chunk. Filter before you generate.',
      'Citations are a UX feature and a quality feature. Hide sources and trust collapses.',
      'Build an eval harness with real questions from Slack and tickets. Track groundedness over time.',
    ],
  },
  {
    slug: 'openai-responses-api',
    title: 'OpenAI Responses API: Patterns for Tool-Using Apps',
    category: 'LLMs',
    date: '2026-03-01',
    readingMinutes: 9,
    excerpt: 'Structured outputs, tools, and operational concerns when moving past chat completions.',
    tags: ['OpenAI', 'Tools', 'LLMs'],
    body: [
      'Treat tool calls as public API surface: version them, validate inputs, and log outcomes.',
      'Separate planner prompts from tool execution code paths.',
      'Budget tokens and set timeouts. A slow agent feels broken even when it is “working.”',
      'Cache deterministic retrieval; do not spend tokens re-fetching static context.',
    ],
  },
  {
    slug: 'n8n-automation-at-work',
    title: 'n8n Automation for Business Workflows That Cannot Fail Silently',
    category: 'Automation',
    date: '2026-02-14',
    readingMinutes: 8,
    excerpt: 'Idempotency, dead letters, and when to graduate from n8n to custom workers.',
    tags: ['n8n', 'Automation', 'Ops'],
    body: [
      'Automations fail. Design for visibility: alerts, retries, and ownership.',
      'Idempotency keys stop duplicate side effects when webhooks retry.',
      'Use AI steps for classification and drafting; keep irreversible actions behind approvals.',
      'Extract critical paths to Node workers when the graph becomes unreviewable.',
    ],
  },
  {
    slug: 'ai-for-businesses',
    title: 'AI for Businesses: Where ROI Shows Up First',
    category: 'AI',
    date: '2026-01-30',
    readingMinutes: 7,
    excerpt: 'A blunt prioritization guide for leaders tired of slideware AI strategies.',
    tags: ['AI', 'ROI', 'Strategy'],
    body: [
      'Start where text and tickets already concentrate: support, sales ops, document processing, and internal search.',
      'Prefer augmentation over moonshot autonomy in regulated or high-risk domains.',
      'Fund data cleanup—it is the unglamorous multiplier behind every RAG win.',
      'Measure baseline weeks before you launch. Otherwise “AI success” is a vibe.',
    ],
  },
  {
    slug: 'choosing-a-software-agency',
    title: 'How to Choose a Software Agency (Without Regretting It Six Months Later)',
    category: 'Software Development',
    date: '2026-08-10',
    readingMinutes: 14,
    excerpt:
      'A practical checklist for founders and operators: signals of senior delivery, red flags, and questions that reveal how an agency actually works.',
    tags: ['Agencies', 'Procurement', 'Strategy'],
    sections: [
      {
        heading: 'Start with the outcome, not the stack',
        paragraphs: [
          'Most RFPs list technologies before problems. Flip it: write the business outcome first—reduce support tickets by 30%, launch a paid tier, replace a spreadsheet workflow—and ask agencies how they would measure success.',
          'Strong partners push back on vague goals. Weak ones agree to everything and disappear into tickets.',
        ],
      },
      {
        heading: 'Look for production evidence, not deck polish',
        paragraphs: [
          'Ask for systems they still maintain, not only launches from three years ago. Who owns on-call? What broke after go-live and how did they fix it?',
          'Case studies should name constraints: timeline, team size, integrations, compliance. “We built an AI platform” without context is marketing, not proof.',
        ],
      },
      {
        heading: 'Interview the people who will actually build',
        paragraphs: [
          'Sales calls are not delivery. Request time with the lead engineer or architect who would own your account.',
          'Good signs: they ask about your users, data model, and release cadence. Bad signs: they promise a fixed price before understanding scope, or only the salesperson ever shows up.',
        ],
      },
      {
        heading: 'Understand how they handle change',
        paragraphs: [
          'Software projects change. Ask how they handle scope shifts, who approves them, and how billing works when priorities move.',
          'Fixed-price can work for well-bounded work. Discovery-heavy products often need time-and-materials with capped iterations and clear demos.',
        ],
      },
      {
        heading: 'Security and ownership basics',
        paragraphs: [
          'You should own the repo, cloud accounts, and domains. Credentials live in your vault, not theirs forever.',
          'Ask about secrets handling, backup strategy, and what happens if you stop working together. If answers are fuzzy, assume you will inherit debt.',
        ],
      },
      {
        heading: 'Communication rhythm',
        paragraphs: [
          'Weekly written updates beat surprise demos. Ask for a sample status report and how they document decisions.',
          'Time zone overlap matters for fast feedback. Clarify response SLAs for blockers vs. nice-to-haves.',
        ],
      },
      {
        heading: 'Red flags we see often',
        paragraphs: [
          'No tests, “we will add them later.”',
          'Everything is a custom framework only they understand.',
          'They cannot explain trade-offs in plain language.',
          'They outsource the core build without telling you who holds quality.',
          'They guarantee dates before a technical discovery session.',
        ],
      },
      {
        heading: 'A short question list you can steal',
        paragraphs: [
          'What would you build in the first two weeks to de-risk this project?',
          'What is explicitly out of scope for phase one?',
          'Show me monitoring or logging from a live client system (redacted).',
          'How do you hand off to an internal team?',
          'What happens if we pause for a month?',
        ],
      },
    ],
  },
  {
    slug: 'ai-automation-roi-guide',
    title: 'AI Automation ROI: A Blunt Guide for Operators',
    category: 'Business Automation',
    date: '2026-08-20',
    readingMinutes: 13,
    excerpt:
      'Where automation pays off first, how to measure it, and why data cleanup beats model hype every time.',
    tags: ['AI', 'ROI', 'Automation'],
    sections: [
      {
        heading: 'ROI shows up in boring places first',
        paragraphs: [
          'Leaders want a flagship copilot. Operators win faster on ticket triage, invoice matching, internal search, and draft replies with human approval.',
          'These workflows already have volume, text, and measurable before/after times. That is where you fund the next experiment.',
        ],
      },
      {
        heading: 'Measure baseline before you build',
        paragraphs: [
          'Track median handle time, error rate, or hours spent on a task for two to four weeks. Without a baseline, any “50% faster” claim is fiction.',
          'Include human review time. An agent that drafts in seconds but needs ten minutes of fixes is not a win.',
        ],
      },
      {
        heading: 'Augment before you automate',
        paragraphs: [
          'Start with suggestions: classify, summarize, route, draft. Keep irreversible actions behind a human click.',
          'Autonomy works on narrow, low-risk paths with clear rollback. Expense categorization with audit logs, not payments without approval.',
        ],
      },
      {
        heading: 'Data cleanup is the multiplier',
        paragraphs: [
          'RAG and agents fail on messy ACLs, duplicate docs, and PDFs nobody maintained. Cleaning access and canonical sources often beats upgrading the model.',
          'Budget time for ingestion, chunking strategy, and eval questions pulled from real Slack threads—not hypothetical FAQs.',
        ],
      },
      {
        heading: 'Cost model beyond tokens',
        paragraphs: [
          'Include engineering time, review labor, monitoring, and retraining when upstream systems change. Token bills are often the smaller line item.',
          'Set budgets and alerts early. A runaway agent loop is an ops incident, not a surprise invoice.',
        ],
      },
      {
        heading: 'Evals are not optional',
        paragraphs: [
          'Maintain ten to thirty real failure cases from production or staging. Run them on every prompt or tool change.',
          'Track groundedness and task completion, not vibes. Regression should block release.',
        ],
      },
      {
        heading: 'When to stop',
        paragraphs: [
          'If accuracy cannot clear your quality bar after two focused iterations, the workflow may need redesign—not a bigger model.',
          'Sometimes the ROI answer is a better form, a clearer policy, or a human team hire. That is still a good outcome.',
        ],
      },
      {
        heading: 'A simple ROI worksheet',
        paragraphs: [
          'Hours saved per week × loaded hourly cost = gross benefit.',
          'Subtract: build, maintenance, review time, infra, and risk buffer.',
          'If payback is under six months with conservative assumptions, prioritize. If not, shrink scope or pick another workflow.',
        ],
      },
    ],
  },
];

export function getPostBySlug(slug) {
  return BLOG_POSTS.find((post) => post.slug === slug) || null;
}
