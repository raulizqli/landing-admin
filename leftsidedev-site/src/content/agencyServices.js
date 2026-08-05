/**
 * Home / catalog service cards (problem → benefits → technologies).
 * Links to existing GEO detail pages when a matching slug exists.
 */

export const AGENCY_SERVICES = [
  {
    slug: 'custom-software',
    title: 'Custom Software Development',
    problem: 'Off-the-shelf tools force workarounds that slow teams and hide data.',
    benefits: [
      'Software shaped to your workflows',
      'Ownership of IP and roadmap',
      'Integrations that match how you operate',
    ],
    technologies: ['TypeScript', 'Node.js', 'React', 'PostgreSQL', 'Cloud'],
  },
  {
    slug: 'automation',
    title: 'AI Automation',
    problem: 'Repetitive multi-step work still depends on humans switching between tools.',
    benefits: [
      'Agents and workflows that complete jobs',
      'Guardrails, approvals, and audit trails',
      'Measurable time and cost savings',
    ],
    technologies: ['OpenAI', 'LangGraph', 'n8n', 'MCP', 'Node.js'],
  },
  {
    slug: 'web-development',
    title: 'Web Applications',
    problem: 'Public and internal products need speed, SEO, and maintainable UX.',
    benefits: [
      'Fast, accessible interfaces',
      'Admin and customer portals',
      'Design systems that scale with features',
    ],
    technologies: ['React', 'Next.js', 'Vite', 'Tailwind', 'Firebase'],
  },
  {
    slug: 'mobile-development',
    title: 'Mobile Applications',
    problem: 'Field and consumer users need reliable iOS/Android experiences.',
    benefits: [
      'Cross-platform delivery with Flutter',
      'Offline-aware patterns when needed',
      'Shared logic with web backends',
    ],
    technologies: ['Flutter', 'Firebase', 'REST/GraphQL', 'Push'],
  },
  {
    slug: 'cloud-architecture',
    title: 'Cloud Architecture',
    problem: 'Ad-hoc infrastructure creates outages, surprise bills, and security gaps.',
    benefits: [
      'Environments, CI/CD, and observability',
      'Cost-aware scaling',
      'Secure defaults for multi-tenant systems',
    ],
    technologies: ['AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes'],
    detailPath: '/services/firebase-development',
  },
  {
    slug: 'api-development',
    title: 'API Development',
    problem: 'Teams cannot share data safely across products and partners.',
    benefits: [
      'Typed contracts and versioning',
      'Auth, rate limits, and docs',
      'Webhooks and event-driven flows',
    ],
    technologies: ['NestJS', 'Node.js', 'OpenAPI', 'PostgreSQL'],
    detailPath: '/services/node-development',
  },
  {
    slug: 'system-integrations',
    title: 'System Integrations',
    problem: 'CRM, ERP, billing, and support tools do not talk to each other.',
    benefits: [
      'Reliable sync and orchestration',
      'Fewer manual exports',
      'Clear failure and retry policies',
    ],
    technologies: ['n8n', 'Node.js', 'Webhooks', 'Queues'],
    detailPath: '/services/automation',
  },
  {
    slug: 'business-dashboards',
    title: 'Business Dashboards',
    problem: 'Leaders lack a single view of operations and KPIs.',
    benefits: [
      'Role-aware reporting',
      'Live metrics from source systems',
      'Export and alerting hooks',
    ],
    technologies: ['React', 'PostgreSQL', 'BI APIs', 'Charts'],
    detailPath: '/services/web-development',
  },
  {
    slug: 'enterprise-platforms',
    title: 'Enterprise Platforms',
    problem: 'Growth requires multi-tenant, permissioned products—not spreadsheets.',
    benefits: [
      'Tenant isolation and billing hooks',
      'Admin and operator consoles',
      'Compliance-aware design',
    ],
    technologies: ['React', 'Firebase', 'Cloud Functions', 'Stripe'],
    detailPath: '/services/custom-software',
  },
  {
    slug: 'legacy-modernization',
    title: 'Legacy Modernization',
    problem: 'Aging systems block hiring, security patches, and new features.',
    benefits: [
      'Strangler patterns and dual-run',
      'Data migration plans',
      'Lower risk than big-bang rewrites',
    ],
    technologies: ['Node.js', 'APIs', 'Containers', 'Cloud'],
    detailPath: '/services/custom-software',
  },
  {
    slug: 'maintenance-support',
    title: 'Maintenance & Support',
    problem: 'After launch, product debt and incidents need a named owner.',
    benefits: [
      'SLAs and on-call options',
      'Dependency and security updates',
      'Continuous improvement backlog',
    ],
    technologies: ['CI/CD', 'Monitoring', 'Runbooks'],
    detailPath: '/contact',
  },
];

export function getAgencyServicePath(service) {
  if (service.detailPath) return service.detailPath;
  return `/services/${service.slug}`;
}
