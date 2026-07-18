import { useEffect, useRef } from 'react';
import { LandingPage } from '@raulizqli/landing-ui';
import { withPreviewContent } from '@raulizqli/landing-core/previewContent';
import { resolvePageLanguage } from '@raulizqli/landing-core/pageTranslations';

function getScrollParent(node) {
  let current = node?.parentElement;
  while (current && current !== document.body) {
    const { overflowY } = window.getComputedStyle(current);
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

/** Scroll target inside its nearest overflow parent only (avoids moving the admin form / page). */
function scrollIntoScrollParent(target, behavior = 'smooth') {
  if (!target) return;
  const parent = getScrollParent(target);
  if (!parent) return;

  const parentRect = parent.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const nextTop = parent.scrollTop + (targetRect.top - parentRect.top);
  parent.scrollTo({ top: Math.max(0, nextTop), behavior });
}

export default function LandingMirror({ previewData, previewSeed, language, scrollSectionId }) {
  const rootRef = useRef(null);
  const data = resolvePageLanguage(
    withPreviewContent(previewData, { seed: previewSeed, enabled: true }),
    language,
  );

  useEffect(() => {
    if (!scrollSectionId || !rootRef.current) return undefined;

    const timer = window.setTimeout(() => {
      const root = rootRef.current;
      if (!root) return;
      const escaped = typeof CSS !== 'undefined' && CSS.escape
        ? CSS.escape(scrollSectionId)
        : String(scrollSectionId).replace(/"/g, '\\"');
      let el = root.querySelector(`#${escaped}`)
        || root.querySelector(`[data-preview-section="${escaped}"]`);
      if (!el && scrollSectionId === 'custom-embeds') {
        el = root.querySelector('.custom-embed-section');
      }
      scrollIntoScrollParent(el, 'smooth');
    }, 80);

    return () => window.clearTimeout(timer);
  }, [scrollSectionId, data]);

  return (
    <div ref={rootRef} className="min-h-full">
      <LandingPage
        key={`mirror-${language || 'default'}`}
        data={data}
        interactive={false}
        className="pointer-events-none select-none"
      />
    </div>
  );
}
