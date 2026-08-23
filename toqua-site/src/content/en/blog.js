export const blog = {
  metaTitle: 'Blog',
  metaDescription: 'Practical tips for professionals: first page, online trust, and first steps.',
  eyebrow: 'Blog',
  title: 'Practical notes for your online presence',
  description: 'Short pieces, no jargon, written for clinics and practices.',
  readMore: 'Read article',
  backToList: 'Back to blog',
  minutes: 'min read',
  posts: [
    {
      slug: 'first-professional-page-checklist',
      title: 'A short checklist for your first professional page',
      date: '2026-07-10',
      readingMinutes: 5,
      excerpt:
        'What to include before you share your page with clients: contact, services, and a clear photo.',
      tags: ['Getting started', 'Practice'],
      body: [
        'You do not need a perfect page on day one. You need an honest page that answers three things: who you are, what you offer, and how to reach you.',
        'Start with your name and specialty in language your clients would use. Skip long titles and empty phrases.',
        'Add a photo where you are clearly visible. A warm, approachable image builds more trust than a generic landscape.',
        'List 3 to 6 services or topics you work with. You do not need to detail every session — just orient people.',
        'Keep contact visible: email, phone, or WhatsApp. One primary button avoids confusion.',
        'Check on a phone. Most clients will find you there. If it reads well on mobile, you are on track.',
        'When ready, publish and share it on your card, social profiles, or email signature. You can improve it later.',
      ],
    },
    {
      slug: 'what-patients-look-for-online',
      title: 'What clients look for when they search for you online',
      date: '2026-06-18',
      readingMinutes: 6,
      excerpt:
        'How a trustworthy page looks: clarity, location, and an easy next step.',
      tags: ['Trust', 'Clients'],
      body: [
        'When someone types your name or specialty into a search box, they arrive in a hurry and a little unsure. They want quick signs that you are real and reachable.',
        'Clarity beats “pretty”. A confusing headline or too many buttons makes people leave. One simple sentence and a clear contact keep them.',
        'Location matters. Even if you work online, say where you are based or which areas you see. It reduces friction.',
        'Short testimonials help when you have consent. You do not need a wall of quotes — two or three are enough.',
        'The next step should be obvious: “Message me”, “Book”, or “Call”. If there are five options, none stand out.',
        'Update hours and contact details when they change. An outdated page feels uncared for — even with a nice design.',
        'Toqua exists so you can focus on that human content, not fight complicated tools.',
      ],
    },
  ],
};

export function getPost(slug) {
  return blog.posts.find((post) => post.slug === slug) || null;
}
