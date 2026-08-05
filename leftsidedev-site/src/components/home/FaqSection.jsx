import { useId, useState } from 'react';
import { SITE_FAQS } from '../../content/faq';
import { CTA } from '../../content/site';
import Section from '../ui/Section';
import Button from '../ui/Button';

function FaqItem({ item, index }) {
  const panelId = useId();
  const [open, setOpen] = useState(index < 3);

  return (
    <div className="border-b border-[var(--color-line)]">
      <h3 className="text-base font-semibold text-[var(--color-mist)]">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-4 py-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <span>{item.question}</span>
          <span className="text-[var(--color-accent)]" aria-hidden="true">
            {open ? '−' : '+'}
          </span>
        </button>
      </h3>
      <div id={panelId} hidden={!open} className="pb-4 text-sm leading-relaxed text-[var(--color-mute)]">
        {item.answer}
      </div>
    </div>
  );
}

export default function FaqSection() {
  return (
    <Section
      id="faq"
      eyebrow="FAQ"
      title="Answers before the first call"
      description="Straight answers on cost, timeline, AI, modernization, and how we work."
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)]/40 px-5 sm:px-6">
        {SITE_FAQS.map((item, index) => (
          <FaqItem key={item.question} item={item} index={index} />
        ))}
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button to={CTA.primary.href}>{CTA.primary.label}</Button>
        <Button to={CTA.estimate.href} variant="secondary">
          {CTA.estimate.label}
        </Button>
      </div>
    </Section>
  );
}
