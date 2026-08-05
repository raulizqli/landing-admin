import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import FinalCta from '../components/home/FinalCta';
import TrustSection from '../components/home/TrustSection';
import { SITE, SPECIALIZATIONS } from '../content/site';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema, organizationSchema, personSchema } from '../utils/schema';

export default function AboutPage() {
  const meta = buildPageMeta({
    title: 'About',
    description: `${SITE.name} is an ${SITE.brand}. ${SITE.tagline}`,
    path: '/about',
  });

  return (
    <>
      <Seo meta={meta} schemas={[organizationSchema(), personSchema(), breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }])]} />
      <Section
        eyebrow="About"
        title={`${SITE.name} is an ${SITE.brand}`}
        description={SITE.tagline}
      >
        <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-[var(--color-mute)] sm:text-base">
          <p>
            LeftSideDev is a software agency that designs and builds custom applications, AI automation,
            and cloud-native platforms. We partner with operators and product teams who need senior
            engineering—not generic agency slides.
          </p>
          <p>
            We specialize in systems where product UX, APIs, data, and (when useful) AI must work together
            in production: web and mobile apps, integrations, enterprise platforms, agents, and RAG.
          </p>
        </div>
        <ul className="mt-8 flex flex-wrap gap-2">
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
