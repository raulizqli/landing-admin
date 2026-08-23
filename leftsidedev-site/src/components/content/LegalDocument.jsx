import { Link } from 'react-router-dom';
import { SITE } from '../../content/site';
import { legal } from '../../content/legal';

/**
 * @param {{ doc: { title: string, updated: string, sections: { heading: string, paragraphs: string[] }[] } }} props
 */
export default function LegalDocument({ doc }) {
  return (
    <article className="max-w-3xl">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-mute)]">
        {legal.updatedLabel.replace('{date}', doc.updated)}
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[var(--color-mist)] sm:text-4xl">
        {doc.title}
      </h1>
      <p className="mt-4 text-sm text-[var(--color-mute)]">
        {legal.contactNote}{' '}
        <a href={`mailto:${SITE.email}`} className="text-[var(--color-accent)] hover:underline">
          {SITE.email}
        </a>
        .
      </p>

      <nav className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-[var(--color-accent)]">
        <Link to="/privacy" className="hover:underline">
          {legal.privacyLink}
        </Link>
        <Link to="/terms" className="hover:underline">
          {legal.termsLink}
        </Link>
        <Link to="/about" className="hover:underline">
          {legal.aboutLink}
        </Link>
        <Link to="/contact" className="hover:underline">
          Contact
        </Link>
      </nav>

      <div className="mt-10 space-y-10">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-xl font-semibold text-[var(--color-mist)]">{section.heading}</h2>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-[var(--color-mute)]">
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
