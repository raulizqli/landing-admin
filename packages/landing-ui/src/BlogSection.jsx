import {
  getVisibleBlogPosts,
  shouldShowBlogSection,
  splitBlogText,
} from '@raulizqli/landing-core/blog';
import { buildSectionBackgroundStyle, getSectionTheme } from '@raulizqli/landing-core/sectionBackground';
import { SECTION_IDS } from '@raulizqli/landing-core/sectionAnchors';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';

function BlogParagraphs({ text, className = 'space-y-3 text-sm sm:text-base text-current/70 leading-relaxed' }) {
  const paragraphs = splitBlogText(text);
  if (paragraphs.length === 0) return null;

  return (
    <div className={className}>
      {paragraphs.map((paragraph, index) => (
        <p key={`blog-p-${index}`}>{paragraph}</p>
      ))}
    </div>
  );
}

function BlogImage({ src, alt, className = '' }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      className={`w-full object-cover rounded-2xl border border-[#2A342D]/10 bg-[#E8E4DB] ${className}`}
    />
  );
}

function BlogPostBlock({ post, imageAltFallback }) {
  const title = String(post.title ?? '').trim();
  const text = String(post.text ?? '').trim();
  const imageUrl = String(post.imageUrl ?? '').trim();
  const imageAlt = String(post.imageAlt ?? '').trim() || title || imageAltFallback;
  const layout = post.layout;

  if (layout === 'image_only') {
    return (
      <article className="space-y-0">
        <BlogImage src={imageUrl} alt={imageAlt} className="aspect-[16/9] sm:aspect-[21/9]" />
      </article>
    );
  }

  if (layout === 'title_image') {
    return (
      <article className="space-y-5">
        {title && (
          <h3 className="font-serif text-xl sm:text-2xl text-current text-center">{title}</h3>
        )}
        <BlogImage src={imageUrl} alt={imageAlt} className="aspect-[16/10]" />
      </article>
    );
  }

  if (layout === 'title_text_image_left') {
    return (
      <article className="grid md:grid-cols-2 gap-8 md:gap-10 items-center">
        <BlogImage src={imageUrl} alt={imageAlt} className="aspect-[4/3] md:aspect-square" />
        <div className="space-y-4">
          {title && <h3 className="font-serif text-xl sm:text-2xl text-current">{title}</h3>}
          <BlogParagraphs text={text} />
        </div>
      </article>
    );
  }

  if (layout === 'title_image_right_text') {
    return (
      <article className="grid md:grid-cols-2 gap-8 md:gap-10 items-center">
        <div className="space-y-4 md:order-1">
          {title && <h3 className="font-serif text-xl sm:text-2xl text-current">{title}</h3>}
          <BlogParagraphs text={text} />
        </div>
        <BlogImage
          src={imageUrl}
          alt={imageAlt}
          className="aspect-[4/3] md:aspect-square md:order-2"
        />
      </article>
    );
  }

  // title_text (default)
  return (
    <article className="max-w-3xl mx-auto space-y-4">
      {title && <h3 className="font-serif text-xl sm:text-2xl text-current">{title}</h3>}
      <BlogParagraphs text={text} />
    </article>
  );
}

export default function BlogSection({ data }) {
  if (!shouldShowBlogSection(data)) return null;

  const labels = resolvePageLabels(data);
  const posts = getVisibleBlogPosts(data);
  const sectionTitle = String(data.blogSectionTitle ?? '').trim() || getLabel(labels, 'blog.defaultTitle');
  const introParagraphs = splitBlogText(data.blogSectionText);
  const sectionStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'blog'), { sectionKey: 'blog' });
  const imageAltFallback = getLabel(labels, 'blog.imageAlt');

  return (
    <section id={SECTION_IDS.blog} className="border-y border-[#2A342D]/10" style={sectionStyle}>
      <div className="max-w-5xl mx-auto px-5 py-14 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <h2 className="font-serif text-2xl sm:text-3xl text-current mb-3">
            {sectionTitle}
          </h2>
          {introParagraphs.length > 0 ? (
            <div className="space-y-3 text-sm text-current/60 leading-relaxed">
              {introParagraphs.map((paragraph, index) => (
                <p key={`blog-intro-${index}`}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-current/60">
              {getLabel(labels, 'blog.defaultIntro')}
            </p>
          )}
        </div>

        <div className="space-y-12 sm:space-y-16">
          {posts.map((post, index) => (
            <BlogPostBlock
              key={`blog-post-${index}`}
              post={post}
              imageAltFallback={imageAltFallback}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
