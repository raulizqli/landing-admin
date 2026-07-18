import Seo from '../components/seo/Seo';
import Hero from '../components/home/Hero';
import ServicesPreview from '../components/home/ServicesPreview';
import CaseStudiesPreview from '../components/home/CaseStudiesPreview';
import TrustSection from '../components/home/TrustSection';
import FinalCta from '../components/home/FinalCta';
import { SITE } from '../content/site';
import { buildPageMeta } from '../utils/seo';
import { organizationSchema, personSchema } from '../utils/schema';

export default function HomePage() {
  const meta = buildPageMeta({
    title: `${SITE.name} — ${SITE.brand}`,
    description: SITE.tagline,
    path: '/',
  });

  return (
    <>
      <Seo meta={meta} schemas={[organizationSchema(), personSchema()]} />
      <Hero />
      <ServicesPreview />
      <CaseStudiesPreview />
      <TrustSection />
      <FinalCta />
    </>
  );
}
