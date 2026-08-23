import { Link } from 'react-router-dom';
import { SITE } from '../../content/site';
import { useLang } from '../../hooks/useLang';

/**
 * @param {{ doc: { title: string, updated: string, sections: { heading: string, paragraphs: string[] }[] } }} props
 */
export default function LegalDocument({ doc }) {
  const { path, t } = useLang();

  return (
    <article className="max-w-3xl">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--mute)]">
        {t.legal.updatedLabel.replace('{date}', doc.updated)}
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
        {doc.title}
      </h1>
      <p className="mt-4 text-sm text-[var(--mute)]">
        {t.legal.contactNote}{' '}
        <a href={`mailto:${SITE.email}`} className="text-[var(--text-purple)] hover:underline">
          {SITE.email}
        </a>
        .
      </p>

      <nav className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-[var(--text-purple)]">
        <Link to={path('/privacy')} className="hover:underline">
          {t.legal.privacyLink}
        </Link>
        <Link to={path('/terms')} className="hover:underline">
          {t.legal.termsLink}
        </Link>
        <Link to={path('/about')} className="hover:underline">
          {t.legal.aboutLink}
        </Link>
        <Link to={path('/contact')} className="hover:underline">
          {t.nav.links.find((l) => l.path === '/contact')?.label}
        </Link>
      </nav>

      <div className="mt-10 space-y-10">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-xl font-semibold text-[var(--text)]">{section.heading}</h2>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-[var(--mute)]">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 60)}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
