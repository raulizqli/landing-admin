import { getAdminSignupUrl } from '../content/site';
import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import Button from '../components/ui/Button';
import { useLang } from '../hooks/useLang';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema } from '../utils/schema';

export default function HowItWorksPage() {
  const { lang, path, t } = useLang();
  const content = t.howItWorks;
  const signupUrl = getAdminSignupUrl();
  const meta = buildPageMeta({
    title: content.metaTitle,
    description: content.metaDescription,
    path: path('/how-it-works'),
    lang,
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Toqua', path: path() },
            { name: content.metaTitle, path: path('/how-it-works') },
          ]),
        ]}
      />
      <Section eyebrow={content.eyebrow} title={content.title} description={content.description}>
        <ol className="grid gap-8 md:grid-cols-3">
          {content.steps.map((step) => (
            <li key={step.title} className="surface rounded-2xl p-6">
              <h3 className="font-display text-xl font-semibold text-[var(--text)]">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--mute)]">{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-14 max-w-2xl">
          <h3 className="font-display text-2xl font-semibold text-[var(--text)]">{content.afterTitle}</h3>
          <p className="mt-3 text-[var(--mute)]">{content.afterText}</p>
          <Button href={signupUrl} external className="mt-6">
            {content.cta}
          </Button>
        </div>
      </Section>
    </>
  );
}
