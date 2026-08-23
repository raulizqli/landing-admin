import { Navigate } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import LegalDocument from '../components/content/LegalDocument';
import { useLang } from '../hooks/useLang';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema } from '../utils/schema';

/**
 * @param {{ kind: 'privacy' | 'terms' }} props
 */
export default function LegalPage({ kind }) {
  const { lang, path, t } = useLang();
  const doc = t.legal?.[kind];

  if (!doc) {
    return <Navigate to={path()} replace />;
  }

  const meta = buildPageMeta({
    title: doc.metaTitle,
    description: doc.metaDescription,
    path: path(`/${kind === 'privacy' ? 'privacy' : 'terms'}`),
    lang,
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Toqua', path: path() },
            { name: doc.title, path: path(`/${kind === 'privacy' ? 'privacy' : 'terms'}`) },
          ]),
        ]}
      />
      <Section eyebrow={t.legal.eyebrow} title="" description="">
        <LegalDocument doc={doc} />
      </Section>
    </>
  );
}
