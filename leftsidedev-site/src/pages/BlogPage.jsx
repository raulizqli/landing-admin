import { Link, useSearchParams } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import { BLOG_CATEGORIES, BLOG_POSTS } from '../content/blog';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema } from '../utils/schema';

export default function BlogPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || 'All';
  const posts =
    category === 'All' ? BLOG_POSTS : BLOG_POSTS.filter((post) => post.category === category);

  const meta = buildPageMeta({
    title: 'Blog',
    description:
      'Technical writing on AI agents, RAG, MCP, React, Angular, Node, Firebase, automation, and cloud architecture.',
    path: '/blog',
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
          ]),
        ]}
      />
      <Section
        eyebrow="Blog"
        title="Technical notes from an AI Engineering Studio"
        description="Practical articles for builders and buyers—optimized to be useful when cited by search and generative engines."
      >
        <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Blog categories">
          {['All', ...BLOG_CATEGORIES].map((item) => {
            const active = category === item;
            return (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={active}
                className={[
                  'rounded-full border px-3 py-1.5 text-xs transition',
                  active
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                    : 'border-[var(--color-line)] text-[var(--color-mute)] hover:text-[var(--color-mist)]',
                ].join(' ')}
                onClick={() => {
                  if (item === 'All') setParams({});
                  else setParams({ category: item });
                }}
              >
                {item}
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <article key={post.slug} className="glass rounded-2xl p-6">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-accent)]">
                {post.category} · {post.readingMinutes} min
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold">
                <Link to={`/blog/${post.slug}`} className="hover:text-[var(--color-accent)]">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-mute)]">{post.excerpt}</p>
              <p className="mt-4 text-xs text-[var(--color-mute)]">{post.date}</p>
            </article>
          ))}
          {posts.length === 0 && (
            <p className="text-sm text-[var(--color-mute)]">No posts in this category yet.</p>
          )}
        </div>
      </Section>
    </>
  );
}
