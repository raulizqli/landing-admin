import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import Button from '../components/ui/Button';
import { useLang } from '../hooks/useLang';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema } from '../utils/schema';

export default function WhatYouGetPage() {
  const { lang, path, t } = useLang();
  const content = t.whatYouGet;
  const meta = buildPageMeta({
    title: content.metaTitle,
    description: content.metaDescription,
    path: path('/what-you-get'),
    lang,
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Toqua', path: path() },
            { name: content.metaTitle, path: path('/what-you-get') },
          ]),
        ]}
      />
      <Section eyebrow={content.eyebrow} title={content.title} description={content.description}>
        <div className="grid gap-8 sm:grid-cols-2">
          {content.items.map((item) => (
            <div key={item.title}>
              <h3 className="font-display text-xl font-semibold text-[var(--text)]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--mute)] sm:text-base">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-12">
          <Button to={path('/pricing')}>{content.cta}</Button>
        </div>
      </Section>
    </>
  );
}
