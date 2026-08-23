import { useId, useState } from 'react';
import { useLang } from '../../hooks/useLang';
import Section from '../ui/Section';
import Button from '../ui/Button';

function FaqItem({ item, index }) {
  const panelId = useId();
  const [open, setOpen] = useState(index < 2);

  return (
    <div className="border-b border-[var(--line)]">
      <h3 className="text-base font-semibold text-[var(--text)]">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-4 py-4 text-left"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <span>{item.question}</span>
          <span className="text-[var(--text-purple)]" aria-hidden="true">
            {open ? '−' : '+'}
          </span>
        </button>
      </h3>
      <div id={panelId} hidden={!open} className="pb-4 text-sm leading-relaxed text-[var(--mute)]">
        {item.answer}
      </div>
    </div>
  );
}

export default function FaqTeaser({ limit = 4, showAllLink = true }) {
  const { path, t } = useLang();
  const block = t.home.faqTeaser;
  const items = t.faq.items.slice(0, limit);

  return (
    <Section eyebrow={block.eyebrow} title={block.title}>
      <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 sm:px-6">
        {items.map((item, index) => (
          <FaqItem key={item.question} item={item} index={index} />
        ))}
      </div>
      {showAllLink && (
        <div className="mt-8">
          <Button to={path('/faq')} variant="secondary">
            {block.cta}
          </Button>
        </div>
      )}
    </Section>
  );
}
