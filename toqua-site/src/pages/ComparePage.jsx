import { getAdminSignupUrl } from '../content/site';
import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import Button from '../components/ui/Button';
import { useLang } from '../hooks/useLang';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema } from '../utils/schema';

export default function ComparePage() {
  const { lang, path, t } = useLang();
  const content = t.compare;
  const signupUrl = getAdminSignupUrl();
  const meta = buildPageMeta({
    title: content.metaTitle,
    description: content.metaDescription,
    path: path('/compare'),
    lang,
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Toqua', path: path() },
            { name: content.metaTitle, path: path('/compare') },
          ]),
        ]}
      />
      <Section eyebrow={content.eyebrow} title={content.title} description={content.description}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-[var(--text-purple)]">
                <th className="py-3 pr-4 font-semibold">{content.columns.option}</th>
                <th className="py-3 pr-4 font-semibold">{content.columns.fit}</th>
                <th className="py-3 pr-4 font-semibold">{content.columns.time}</th>
                <th className="py-3 pr-4 font-semibold">{content.columns.cost}</th>
                <th className="py-3 font-semibold">{content.columns.control}</th>
              </tr>
            </thead>
            <tbody>
              {content.rows.map((row) => (
                <tr key={row.option} className="border-b border-[var(--line)] align-top text-[var(--mute)]">
                  <td className="py-4 pr-4 font-semibold text-[var(--text)]">{row.option}</td>
                  <td className="py-4 pr-4">{row.fit}</td>
                  <td className="py-4 pr-4">{row.time}</td>
                  <td className="py-4 pr-4">{row.cost}</td>
                  <td className="py-4">{row.control}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-10 max-w-3xl text-base leading-relaxed text-[var(--mute)]">{content.closing}</p>
        <Button href={signupUrl} external className="mt-8">
          {content.cta}
        </Button>
      </Section>
    </>
  );
}
