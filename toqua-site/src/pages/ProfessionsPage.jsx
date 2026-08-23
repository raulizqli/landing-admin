import { Link } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import { useLang } from '../hooks/useLang';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema } from '../utils/schema';

export default function ProfessionsPage() {
  const { lang, path, t } = useLang();
  const content = t.professions;
  const meta = buildPageMeta({
    title: content.metaTitle,
    description: content.metaDescription,
    path: path('/professions'),
    lang,
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Toqua', path: path() },
            { name: content.metaTitle, path: path('/professions') },
          ]),
        ]}
      />
      <Section eyebrow={content.eyebrow} title={content.title} description={content.description}>
        <div className="grid gap-6 sm:grid-cols-2">
          {content.items.map((item) => (
            <Link
              key={item.slug}
              to={path(`/professions/${item.slug}`)}
              className="surface group rounded-2xl p-6 transition hover:border-[var(--text-purple)]/30"
            >
              <h3 className="font-display text-xl font-semibold text-[var(--text)] group-hover:text-[var(--text-purple)]">
                {item.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--mute)]">{item.summary}</p>
              <p className="mt-4 text-sm font-semibold text-[var(--text-purple)]">{content.listCta} →</p>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
