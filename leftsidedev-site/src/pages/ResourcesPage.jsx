import Seo from '../components/seo/Seo';
import Section from '../components/ui/Section';
import Button from '../components/ui/Button';
import { buildPageMeta } from '../utils/seo';
import { breadcrumbSchema } from '../utils/schema';

const CHECKLIST = [
  'Name the job-to-be-done and the metric that proves success.',
  'Inventory systems of record and who owns credentials.',
  'Classify actions: read, draft, write—and where humans must approve.',
  'List 10 real failure cases for your first eval set.',
  'Decide data residency, PII, and retention constraints early.',
  'Pick a pilot workflow narrow enough to ship in weeks.',
  'Define shadow → supervised → autonomous rollout gates.',
  'Assign an internal owner for quality and incident response.',
];

export default function ResourcesPage() {
  const meta = buildPageMeta({
    title: 'Free AI Guide & Checklist',
    description: 'Downloadable AI implementation checklist and free guide from LeftSideDev.',
    path: '/resources',
  });

  const downloadChecklist = () => {
    const content = [
      'LeftSideDev — AI Implementation Checklist',
      '',
      ...CHECKLIST.map((item, index) => `${index + 1}. ${item}`),
      '',
      'Guide: Start with retrieval or agents only after the metric and data path are clear.',
      'https://leftsidedev.site/resources',
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'leftsidedev-ai-implementation-checklist.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Seo
        meta={meta}
        schemas={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Resources', path: '/resources' },
          ]),
        ]}
      />
      <Section
        eyebrow="Lead magnet"
        title="Free AI implementation checklist"
        description="A practical guide for leaders and builders preparing their first production AI workflow."
      >
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <ol className="space-y-3">
            {CHECKLIST.map((item, index) => (
              <li key={item} className="glass rounded-xl px-4 py-3 text-sm text-[var(--color-mute)]">
                <span className="mr-2 font-semibold text-[var(--color-accent)]">{index + 1}.</span>
                {item}
              </li>
            ))}
          </ol>
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-2xl font-semibold">Free guide: AI for businesses</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-mute)]">
              Start where tickets and documents already concentrate value. Fund data cleanup. Measure a
              baseline before you launch. Prefer augmentation in high-risk domains.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Button type="button" onClick={downloadChecklist}>
                Download checklist
              </Button>
              <Button to="/blog/ai-for-businesses" variant="secondary">
                Read the free AI guide
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
