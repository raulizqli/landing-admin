
import { useState } from 'react';

export default function EditorSection({
  sectionKey,
  title,
  description,
  defaultOpen = false,
  onActivate,
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
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">{title}</h3>
          {description && (
            <p className="text-[10px] text-gray-400 mt-0.5 truncate">{description}</p>
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
