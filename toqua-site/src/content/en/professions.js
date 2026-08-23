export const professions = {
  metaTitle: 'Professions',
  metaDescription:
    'Toqua for psychology, pediatrics, dental, and legal practices. Clear pages for your clients.',
  eyebrow: 'Professions',
  title: 'Built for your kind of practice',
  description:
    'The same simple steps, with examples and language that match how you care for people.',
  listCta: 'View details',
  items: [
    {
      slug: 'psychology',
      name: 'Psychology',
      summary: 'Share your approach, services, and how to book — with calm and clarity.',
      audience: 'Psychologists, therapists, and mental-health practices.',
      body: [
        'People who find you online want to know if they can trust you. Your page should feel human: who you are, what you work with, and how to take the first step.',
        'With Toqua you build a clean page: introduction, services, testimonials if you have them, and easy contact (email, phone, or WhatsApp).',
        'Start with the essentials. Later, if you want a tips blog or a gallery, change plans without rebuilding everything.',
      ],
      tips: [
        'Use a professional yet approachable photo.',
        'Explain your way of working in 2–3 sentences.',
        'Keep one clear call to action: “Book” or “Message me”.',
      ],
    },
    {
      slug: 'pediatrics',
      name: 'Pediatrics',
      summary: 'Information for parents: hours, location, and how to get there.',
      audience: 'Pediatricians and children’s clinics.',
      body: [
        'Parents look quickly for address, hours, urgent care, and how to book. A clear page cuts repeated calls.',
        'Toqua lets you show a map location, extra phones if needed, and services (well-child visits, vaccines, follow-up).',
        'Keep the tone warm and reassuring — useful information, not overpromises.',
      ],
      tips: [
        'Highlight hours and how to reach the office.',
        'List services in parent language, not chart language.',
        'Add a secondary contact if you have a front desk.',
      ],
    },
    {
      slug: 'dental',
      name: 'Dental',
      summary: 'Services, before/after if appropriate, and an easy way to book.',
      audience: 'Dentists and dental clinics.',
      body: [
        'People looking for a dentist want treatments, location, and a simple next step. Real photos of the office build trust.',
        'Plans with a gallery can show the space or results (with consent). A blog can cover basic care tips.',
        'Toqua keeps the design clean so the important parts are not lost.',
      ],
      tips: [
        'List treatments with prices only if you are comfortable.',
        'An office photo beats generic stock.',
        'WhatsApp often works well for first appointments.',
      ],
    },
    {
      slug: 'legal',
      name: 'Legal',
      summary: 'Practice areas, credentials, and a serious yet approachable contact path.',
      audience: 'Lawyers and small firms.',
      body: [
        'Prospective clients look for specialty, experience, and frictionless contact. A sober, clear page says more than a long wall of text.',
        'Toqua helps you organize practice areas, about you, and a form or email. Add a notes blog when you need it.',
        'The warm Toqua look adapts: you set the tone with your copy.',
      ],
      tips: [
        'Be specific about areas (family, labor, commercial…).',
        'Avoid unnecessary jargon on the first screen.',
        'Include bar or credential details when they matter.',
      ],
    },
  ],
};

export function getProfession(slug) {
  return professions.items.find((item) => item.slug === slug) || null;
}
