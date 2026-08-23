import { useId, useState } from 'react';
import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import Button from '../components/ui/Button';
import { getAdminSignupUrl } from '../content/site';
import { useLang } from '../hooks/useLang';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema, faqSchema } from '../utils/schema';

function FaqItem({ item, index }) {
  const panelId = useId();
  const [open, setOpen] = useState(index < 3);

  return (
    <div className="border-b border-[var(--line)]">
      <h3 className="text-base font-semibold text-[var(--text)]">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-4 py-4 text-left"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <span>{item.question}</span>
          <span className="text-[var(--text-purple)]" aria-hidden="true">
            {open ? '−' : '+'}
          </span>
        </button>
      </h3>
      <div id={panelId} hidden={!open} className="pb-4 text-sm leading-relaxed text-[var(--mute)]">
        {item.answer}
      </div>
    </div>
  );
}

export default function FaqPage() {
  const { lang, path, t } = useLang();
  const content = t.faq;
  const signupUrl = getAdminSignupUrl();
  const meta = buildPageMeta({
    title: content.metaTitle,
    description: content.metaDescription,
    path: path('/faq'),
    lang,
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Toqua', path: path() },
            { name: content.metaTitle, path: path('/faq') },
          ]),
          faqSchema(content.items),
        ]}
      />
      <Section eyebrow={content.eyebrow} title={content.title} description={content.description}>
        <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 sm:px-6">
          {content.items.map((item, index) => (
            <FaqItem key={item.question} item={item} index={index} />
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href={signupUrl} external>
            {t.nav.ctaPrimary}
          </Button>
          <Button to={path('/contact')} variant="secondary">
            {t.nav.links.find((l) => l.path === '/contact')?.label}
          </Button>
        </div>
      </Section>
    </>
  );
}
