import { Link, Navigate, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import Button from '../components/ui/Button';
import FinalCta from '../components/home/FinalCta';
import { getPostBySlug } from '../content/blog';
import { SITE } from '../content/site';
import { buildPageMeta } from '../utils/seo';
import { articleSchema, breadcrumbSchema } from '../utils/schema';
import { buildSocialPack } from '../utils/socialTemplates';

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);
  const [copied, setCopied] = useState('');

  const social = useMemo(() => (post ? buildSocialPack(post, SITE.url) : null), [post]);

  if (!post) return <Navigate to="/blog" replace />;

  const meta = buildPageMeta({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    type: 'article',
  });

  const copy = async (key, value) => {
    const text = Array.isArray(value) ? value.join('\n\n') : value;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(''), 2000);
    } catch {
      setCopied('error');
    }
  };

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          articleSchema(post),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />

      <article>
        <header className="border-b border-[var(--color-line)] px-5 pb-12 pt-14 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-accent)]">
              <Link to="/blog" className="hover:underline">
                Blog
              </Link>{' '}
              / {post.category}
            </p>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-5xl">{post.title}</h1>
            <p className="mt-5 text-lg text-[var(--color-mute)]">{post.excerpt}</p>
            <p className="mt-4 text-sm text-[var(--color-mute)]">
              {post.date} · {post.readingMinutes} min read
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl space-y-5 px-5 py-12 text-base leading-relaxed text-[var(--color-mute)] sm:px-8">
          {post.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <div className="flex flex-wrap gap-2 pt-4">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </article>

      <Section
        eyebrow="Social kit"
        title="Auto-generated publishing templates"
        description="Reusable packs for LinkedIn, X, Reels/TikTok, YouTube, Facebook, and Instagram—ready to paste."
        className="bg-[var(--color-ink-elevated)]/40"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {[
            ['linkedin', 'LinkedIn post', social.linkedin],
            ['xThread', 'X thread', social.xThread],
            ['reelScript', 'Reel / TikTok script', social.reelScript],
            ['youtube', 'YouTube description', social.youtube],
            ['facebook', 'Facebook post', social.facebook],
            ['instagram', 'Instagram caption', social.instagram],
          ].map(([key, label, value]) => (
            <div key={key} className="glass rounded-2xl p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-[var(--color-mist)]">{label}</h3>
                <Button
                  type="button"
                  variant="secondary"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => copy(key, value)}
                >
                  {copied === key ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-[var(--color-mute)]">
                {Array.isArray(value) ? value.join('\n\n') : value}
              </pre>
            </div>
          ))}
        </div>
      </Section>

      <FinalCta />
    </>
  );
}
