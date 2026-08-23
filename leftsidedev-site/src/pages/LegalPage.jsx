import { Navigate } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import LegalDocument from '../components/content/LegalDocument';
import { legal } from '../content/legal';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema } from '../utils/schema';

/**
 * @param {{ kind: 'privacy' | 'terms' }} props
 */
export default function LegalPage({ kind }) {
  const doc = legal[kind];

  if (!doc) {
    return <Navigate to="/" replace />;
  }

  const routePath = kind === 'privacy' ? '/privacy' : '/terms';
  const meta = buildPageMeta({
    title: doc.metaTitle,
    description: doc.metaDescription,
    path: routePath,
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: doc.title, path: routePath },
          ]),
        ]}
      />
      <Section eyebrow={legal.eyebrow}>
        <LegalDocument doc={doc} />
      </Section>
    </>
  );
}
