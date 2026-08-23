import { Link } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import { useLang } from '../hooks/useLang';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema } from '../utils/schema';

export default function ResourcesPage() {
  const { lang, path, t } = useLang();
  const content = t.resources;
  const meta = buildPageMeta({
    title: content.metaTitle,
    description: content.metaDescription,
    path: path('/resources'),
    lang,
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Toqua', path: path() },
            { name: content.metaTitle, path: path('/resources') },
          ]),
        ]}
      />
      <Section eyebrow={content.eyebrow} title={content.title} description={content.description}>
        <div className="grid gap-5 sm:grid-cols-2">
          {content.items.map((item) => (
            <Link
              key={item.to}
              to={path(item.to)}
              className="surface rounded-2xl p-6 transition hover:border-[var(--text-purple)]/30"
            >
              <h3 className="font-display text-xl font-semibold text-[var(--text)]">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--mute)]">{item.text}</p>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
