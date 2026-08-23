import { Link, Navigate, useParams } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import { useLang } from '../hooks/useLang';
import { buildPageMeta } from '../utils/seo';
import { articleSchema, breadcrumbSchema } from '../utils/schema';

export default function BlogPostPage() {
  const { slug } = useParams();
  const { lang, path, t } = useLang();
  const post = t.getPost(slug);

  if (!post) {
    return <Navigate to={path('/blog')} replace />;
  }

  const meta = buildPageMeta({
    title: post.title,
    description: post.excerpt,
    path: path(`/blog/${post.slug}`),
    lang,
    type: 'article',
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Toqua', path: path() },
            { name: t.blog.metaTitle, path: path('/blog') },
            { name: post.title, path: path(`/blog/${post.slug}`) },
          ]),
          articleSchema(post, lang),
        ]}
      />
      <Section>
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--mute)]">
          {post.date} · {post.readingMinutes} {t.blog.minutes}
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--mute)]">{post.excerpt}</p>
        <div className="mt-10 max-w-3xl text-base leading-relaxed text-[var(--mute)]">
          {post.sections?.length ? (
            <div className="space-y-10">
              {post.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="font-display text-xl font-semibold text-[var(--text)]">{section.heading}</h2>
                  <div className="mt-4 space-y-4">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {post.body.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
          )}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--mute)]"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-12">
          <Link to={path('/blog')} className="text-sm font-semibold text-[var(--text-purple)]">
            ← {t.blog.backToList}
          </Link>
        </p>
      </Section>
    </>
  );
}
