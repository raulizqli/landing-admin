import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import FinalCta from '../components/home/FinalCta';
import TrustSection from '../components/home/TrustSection';
import { SITE, SPECIALIZATIONS } from '../content/site';
import { aboutExtended } from '../content/legal';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema, organizationSchema, personSchema } from '../utils/schema';

export default function AboutPage() {
  const meta = buildPageMeta({
    title: aboutExtended.metaTitle,
    description: aboutExtended.metaDescription,
    path: '/about',
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          organizationSchema(),
          personSchema(),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'About', path: '/about' },
          ]),
        ]}
      />
      <Section
        eyebrow="About"
        title={`${SITE.name} is an ${SITE.brand}`}
        description={SITE.tagline}
      >
        <div className="max-w-3xl space-y-10">
          {aboutExtended.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-2xl font-semibold text-[var(--color-mist)]">{section.heading}</h2>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-[var(--color-mute)]">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 60)}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          <div className="grid gap-4 sm:grid-cols-3">
            {aboutExtended.values.map((item) => (
              <div key={item.title} className="glass rounded-2xl p-5">
                <h3 className="font-semibold text-[var(--color-mist)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-mute)]">{item.text}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-[var(--color-mute)]">
            Questions? Email{' '}
            <a href={`mailto:${SITE.email}`} className="text-[var(--color-accent)] hover:underline">
              {SITE.email}
            </a>
            .
          </p>
        </div>

        <ul className="mt-10 flex flex-wrap gap-2">
          {SPECIALIZATIONS.map((item) => (
            <li key={item} className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm">
              {item}
            </li>
          ))}
        </ul>
      </Section>
      <TrustSection />
      <FinalCta />
    </>
  );
}
