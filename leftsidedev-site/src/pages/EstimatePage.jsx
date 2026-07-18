import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import EstimateCalculator from '../components/conversion/EstimateCalculator';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema } from '../utils/schema';

export default function EstimatePage() {
  const meta = buildPageMeta({
    title: 'Estimate Your Project',
    description: 'Ballpark calculator for AI agents, RAG, automation, and custom software projects.',
    path: '/estimate',
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Estimate', path: '/estimate' },
          ]),
        ]}
      />
      <Section
        eyebrow="Estimate"
        title="Estimate your project"
        description="A planning range—not a quote. Discovery still validates integrations, compliance, and success metrics."
      >
        <EstimateCalculator />
      </Section>
    </>
  );
}
