import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import Button from '../components/ui/Button';
import { getAdminSignupUrl, SITE } from '../content/site';
import { useLang } from '../hooks/useLang';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema } from '../utils/schema';

export default function AboutPage() {
  const { lang, path, t } = useLang();
  const content = t.about;
  const signupUrl = getAdminSignupUrl();
  const meta = buildPageMeta({
    title: content.metaTitle,
    description: content.metaDescription,
    path: path('/about'),
    lang,
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Toqua', path: path() },
            { name: content.metaTitle, path: path('/about') },
          ]),
        ]}
      />
      <Section eyebrow={content.eyebrow} title={content.title} description={content.description}>
        <div className="max-w-3xl space-y-10">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-2xl font-semibold text-[var(--text)]">{section.heading}</h2>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-[var(--mute)]">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 60)}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          <div className="grid gap-4 sm:grid-cols-3">
            {content.values.map((item) => (
              <div key={item.title} className="surface rounded-2xl p-5">
                <h3 className="font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--mute)]">{item.text}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-[var(--mute)]">
            {content.contactLine}{' '}
            <a href={`mailto:${SITE.email}`} className="text-[var(--text-purple)] hover:underline">
              {SITE.email}
            </a>
            .
          </p>

          <Button href={signupUrl} external>
            {content.cta}
          </Button>
        </div>
      </Section>
    </>
  );
}
