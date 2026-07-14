import { useState } from 'react';

export default function EditorSection({
  sectionKey,
  title,
  description,
  defaultOpen = false,
  onActivate,
  fillStatus = null,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);

  const activate = () => {
    onActivate?.(sectionKey);
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) activate();
  };

  const showFillBadge = Boolean(fillStatus?.label) && !open;

  return (
    <section
      className={`rounded-xl border transition ${
        open ? 'border-indigo-200 bg-white shadow-sm' : 'border-gray-200 bg-gray-50/60'
      }`}
      onFocusCapture={activate}
      data-editor-section={sectionKey}
    >
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left min-w-0"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">{title}</h3>
            {showFillBadge && (
              <span
                className={`inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  fillStatus.filled
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}
                title={fillStatus.filled ? 'Sección con información capturada' : 'Sección sin contenido todavía'}
              >
                {fillStatus.filled ? '● ' : '○ '}
                {fillStatus.label}
              </span>
            )}
          </div>
          {description && (
            <p className={`text-[10px] text-gray-400 mt-0.5 truncate ${!open && showFillBadge ? 'sr-only' : ''}`}>
              {description}
            </p>
          )}
        </div>
        <span className="text-gray-400 text-sm shrink-0" aria-hidden>
          {open ? '▾' : '▸'}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
          {children}
        </div>
      )}
    </section>
  );
}
