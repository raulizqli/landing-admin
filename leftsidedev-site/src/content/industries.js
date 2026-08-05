export const INDUSTRIES = [
  {
    slug: 'healthcare',
    title: 'Healthcare',
    icon: '✚',
    description:
      'Clinics and health operators need secure patient workflows, scheduling, and knowledge tools with clear access control.',
    solutions: [
      'Patient portals and booking',
      'Role-aware RAG over policies',
      'Internal ops dashboards',
      'Integrations with EHR-adjacent systems',
    ],
  },
  {
    slug: 'education',
    title: 'Education',
    icon: '◈',
    description:
      'Schools and edtech teams ship learning platforms, admin tools, and content systems that stay fast at scale.',
    solutions: [
      'LMS-style portals',
      'Enrollment and billing flows',
      'Content publishing pipelines',
      'Analytics for engagement',
    ],
  },
  {
    slug: 'construction',
    title: 'Construction',
    icon: '▣',
    description:
      'Field and office teams need mobile-friendly project tracking, document control, and supplier coordination.',
    solutions: [
      'Project and site apps',
      'Document and photo workflows',
      'Vendor portals',
      'Offline-tolerant mobile UIs',
    ],
  },
  {
    slug: 'manufacturing',
    title: 'Manufacturing',
    icon: '⚙',
    description:
      'Plants and supply chains benefit from inventory visibility, quality logging, and automation between machines and ERP.',
    solutions: [
      'Production dashboards',
      'Inventory and quality apps',
      'Machine/ERP integrations',
      'Alerting and reporting',
    ],
  },
  {
    slug: 'retail',
    title: 'Retail',
    icon: '◇',
    description:
      'Retailers need commerce backends, inventory sync, and customer experiences that match brand and ops reality.',
    solutions: [
      'E-commerce backends',
      'Inventory sync',
      'Loyalty and CRM bridges',
      'Store ops tools',
    ],
  },
  {
    slug: 'professional-services',
    title: 'Professional Services',
    icon: '⬡',
    description:
      'Agencies and consultancies need CRM-adjacent workflows, client portals, and delivery tooling without bloated suites.',
    solutions: [
      'Client portals',
      'Proposal and project trackers',
      'Time and billing integrations',
      'Knowledge bases',
    ],
  },
  {
    slug: 'finance',
    title: 'Finance',
    icon: '₿',
    description:
      'Finance teams require auditable workflows, reporting, and integrations where correctness and permissions matter.',
    solutions: [
      'Internal finance tools',
      'Reconciliation assistants',
      'Reporting dashboards',
      'Secure API layers',
    ],
  },
  {
    slug: 'logistics',
    title: 'Logistics',
    icon: '⇢',
    description:
      'Logistics operators track shipments, partners, and exceptions across many systems in near real time.',
    solutions: [
      'Tracking portals',
      'Exception queues',
      'Carrier integrations',
      'Ops agent consoles',
    ],
  },
];

export function getIndustryBySlug(slug) {
  return INDUSTRIES.find((item) => item.slug === slug) || null;
}

export function getIndustryPath(slug) {
  return `/industries/${slug}`;
}
