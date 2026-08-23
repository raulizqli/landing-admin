import { SITE } from '../content/site';
import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import ContactForm from '../components/conversion/ContactForm';
import { useLang } from '../hooks/useLang';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema } from '../utils/schema';

export default function ContactPage() {
  const { lang, path, t } = useLang();
  const content = t.contact;
  const meta = buildPageMeta({
    title: content.metaTitle,
    description: content.metaDescription,
    path: path('/contact'),
    lang,
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Toqua', path: path() },
            { name: content.metaTitle, path: path('/contact') },
          ]),
        ]}
      />
      <Section eyebrow={content.eyebrow} title={content.title} description={content.description}>
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4 text-sm text-[var(--mute)]">
            <p>
              {content.emailLabel}{' '}
              <a className="text-[var(--text-purple)] hover:underline" href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
              .
            </p>
            <div className="surface rounded-2xl p-5">
              <p className="font-semibold text-[var(--text)]">{content.prepareTitle}</p>
              <ul className="mt-3 space-y-2">
                {content.prepareItems.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
          <ContactForm />
        </div>
      </Section>
    </>
  );
}
