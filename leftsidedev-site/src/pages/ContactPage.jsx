import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import ContactForm from '../components/conversion/ContactForm';
import Button from '../components/ui/Button';
import { SITE } from '../content/site';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema } from '../utils/schema';

export default function ContactPage() {
  const meta = buildPageMeta({
    title: 'Contact',
    description: 'Book a discovery call with LeftSideDev or send a project brief.',
    path: '/contact',
  });

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Contact', path: '/contact' },
          ]),
        ]}
      />
      <Section
        id="discovery"
        eyebrow="Contact"
        title="Book a discovery call"
        description="Tell us what you are building. We will respond with next steps, fit, and a proposed path."
      >
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4 text-sm text-[var(--color-mute)]">
            <p>
              Prefer calendar booking? Use Calendly, or email{' '}
              <a className="text-[var(--color-accent)] hover:underline" href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
              .
            </p>
            <Button href={SITE.calendlyUrl} external>
              Open Calendly
            </Button>
            <div className="glass rounded-2xl p-5">
              <p className="font-semibold text-[var(--color-mist)]">What to prepare</p>
              <ul className="mt-3 space-y-2">
                <li>• The workflow or product outcome you care about</li>
                <li>• Systems of record (CRM, helpdesk, ERP, docs)</li>
                <li>• Timeline and constraints (compliance, budget)</li>
              </ul>
            </div>
          </div>
          <ContactForm intent="discovery-call" />
        </div>
      </Section>
    </>
  );
}
