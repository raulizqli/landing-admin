import Seo from '../components/seo/Seo';
import Hero from '../components/home/Hero';
import ValuePropsSection from '../components/home/ValuePropsSection';
import ServicesPreview from '../components/home/ServicesPreview';
import IndustriesPreview from '../components/home/IndustriesPreview';
import PortfolioPreview from '../components/home/PortfolioPreview';
import TestimonialsSection from '../components/home/TestimonialsSection';
import TrustSection from '../components/home/TrustSection';
import FaqSection from '../components/home/FaqSection';
import AiAnswersSection from '../components/home/AiAnswersSection';
import FinalCta from '../components/home/FinalCta';
import InContentAdBanner from '../components/ads/InContentAdBanner';
import { SITE, HERO } from '../content/site';
import { SITE_FAQS } from '../content/faq';
import { buildPageMeta } from '../utils/seo';
import {
  organizationSchema,
  personSchema,
  faqSchema,
  websiteSchema,
} from '../utils/schema';

export default function HomePage() {
  const meta = buildPageMeta({
    title: `${SITE.name} — Custom Software, AI Automation & Scalable Applications`,
    description: HERO.subheadline,
    path: '/',
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          websiteSchema(),
          organizationSchema(),
          personSchema(),
          faqSchema(SITE_FAQS),
        ]}
      />
      <Hero />
      <ValuePropsSection />
      <ServicesPreview />
      <IndustriesPreview />
      <PortfolioPreview />
      <TestimonialsSection />
      <TrustSection />
      <AiAnswersSection />
      <InContentAdBanner />
      <FaqSection />
      <FinalCta />
    </>
  );
}
