import { Link } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import { useLang } from '../hooks/useLang';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema } from '../utils/schema';

export default function BlogPage() {
  const { lang, path, t } = useLang();
  const content = t.blog;
  const meta = buildPageMeta({
    title: content.metaTitle,
    description: content.metaDescription,
    path: path('/blog'),
    lang,
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Toqua', path: path() },
            { name: content.metaTitle, path: path('/blog') },
          ]),
        ]}
      />
      <Section eyebrow={content.eyebrow} title={content.title} description={content.description}>
        <div className="grid gap-6">
          {content.posts.map((post) => (
            <article key={post.slug} className="surface rounded-2xl p-6 sm:p-8">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--mute)]">
                {post.date} · {post.readingMinutes} {content.minutes}
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text)]">
                <Link to={path(`/blog/${post.slug}`)} className="hover:text-[var(--text-purple)]">
                  {post.title}
                </Link>
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--mute)] sm:text-base">{post.excerpt}</p>
              <Link
                to={path(`/blog/${post.slug}`)}
                className="mt-4 inline-block text-sm font-semibold text-[var(--text-purple)]"
              >
                {content.readMore} →
              </Link>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
