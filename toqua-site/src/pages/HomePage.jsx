import Seo from '../components/seo/Seo';
import Hero from '../components/home/Hero';
import ValuePropsSection from '../components/home/ValuePropsSection';
import HowItWorksTeaser from '../components/home/HowItWorksTeaser';
import PricingTeaser from '../components/home/PricingTeaser';
import FaqTeaser from '../components/home/FaqTeaser';
import FinalCta from '../components/home/FinalCta';
import { useLang } from '../hooks/useLang';
import { buildPageMeta } from '../utils/seo';
import { organizationSchema, websiteSchema, faqSchema } from '../utils/schema';

export default function HomePage() {
  const { lang, path, t } = useLang();
  const meta = buildPageMeta({
    title: t.home.metaTitle,
    description: t.home.metaDescription,
    path: path(),
    lang,
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[websiteSchema(lang), organizationSchema(lang), faqSchema(t.faq.items.slice(0, 6))]}
      />
      <Hero />
      <ValuePropsSection />
      <HowItWorksTeaser />
      <PricingTeaser />
      <FaqTeaser />
      <FinalCta />
    </>
  );
}
