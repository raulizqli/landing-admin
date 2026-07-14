import { useEffect, useId, useRef } from 'react';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';

export default function LegalDocumentDialog({
  open,
  title,
  body,
  onClose,
  data,
}) {
  const labels = resolvePageLabels(data);
  const titleId = useId();
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const paragraphs = String(body || '')
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#2A342D]/70 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={() => onClose?.()}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl bg-[#F4F1EA] text-[#2A342D] shadow-xl border border-[#2A342D]/10"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-[#2A342D]/10">
          <h2 id={titleId} className="font-serif text-xl sm:text-2xl leading-snug pr-2">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => onClose?.()}
            className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border border-[#2A342D]/15 hover:bg-[#2A342D]/5 transition-colors"
          >
            {getLabel(labels, 'footer.legalClose')}
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 space-y-3 text-sm leading-relaxed text-[#2A342D]/85">
          {paragraphs.map((paragraph, index) => (
            <p key={`legal-p-${index}`} className="whitespace-pre-wrap">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
