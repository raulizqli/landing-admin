import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import Button from '../components/ui/Button';
import { useLang } from '../hooks/useLang';
import { buildPageMeta } from '../utils/seo';

export default function NotFoundPage() {
  const { lang, path, t } = useLang();
  const content = t.notFound;
  const meta = buildPageMeta({
    title: content.metaTitle,
    description: content.text,
    path: path('/not-found'),
    lang,
    noIndex: true,
  });

  return (
    <>
      <Seo meta={meta} />
      <Section title={content.title} description={content.text}>
        <Button to={path()}>{content.cta}</Button>
      </Section>
    </>
  );
}
