import { Link, Navigate, useParams } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import Button from '../components/ui/Button';
import { getAdminSignupUrl } from '../content/site';
import { useLang } from '../hooks/useLang';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema } from '../utils/schema';

export default function ProfessionDetailPage() {
  const { slug } = useParams();
  const { lang, path, t } = useLang();
  const item = t.getProfession(slug);
  const signupUrl = getAdminSignupUrl();

  if (!item) {
    return <Navigate to={path('/professions')} replace />;
  }

  const meta = buildPageMeta({
    title: item.name,
    description: item.summary,
    path: path(`/professions/${item.slug}`),
    lang,
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Toqua', path: path() },
            { name: t.professions.metaTitle, path: path('/professions') },
            { name: item.name, path: path(`/professions/${item.slug}`) },
          ]),
        ]}
      />
      <Section
        eyebrow={t.professions.eyebrow}
        title={item.name}
        description={item.summary}
      >
        <p className="mb-8 text-sm font-medium text-[var(--text-purple)]">{item.audience}</p>
        <div className="max-w-3xl space-y-4 text-base leading-relaxed text-[var(--mute)]">
          {item.body.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>
        <ul className="mt-10 max-w-3xl space-y-3">
          {item.tips.map((tip) => (
            <li key={tip} className="flex gap-3 text-sm text-[var(--text)] sm:text-base">
              <span className="text-[var(--text-purple)]" aria-hidden="true">
                ✓
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
        <div className="mt-12 flex flex-wrap gap-3">
          <Button href={signupUrl} external>
            {t.nav.ctaPrimary}
          </Button>
          <Button to={path('/professions')} variant="secondary">
            ← {t.professions.metaTitle}
          </Button>
        </div>
        <p className="mt-8 text-sm text-[var(--mute)]">
          <Link to={path('/pricing')} className="text-[var(--text-purple)] hover:underline">
            {t.nav.ctaSecondary}
          </Link>
        </p>
      </Section>
    </>
  );
}
