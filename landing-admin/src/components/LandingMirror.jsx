
import { useEffect, useRef } from 'react';
import { LandingPage } from '@raulizqli/landing-ui';
import { withPreviewContent } from '@raulizqli/landing-core/previewContent';

export default function LandingMirror({ previewData, previewSeed, scrollSectionId }) {
  const rootRef = useRef(null);
  const data = withPreviewContent(previewData, { seed: previewSeed, enabled: true });

  useEffect(() => {
    if (!scrollSectionId || !rootRef.current) return undefined;

    const timer = window.setTimeout(() => {
      const root = rootRef.current;
      if (!root) return;
      const escaped = typeof CSS !== 'undefined' && CSS.escape
        ? CSS.escape(scrollSectionId)
        : String(scrollSectionId).replace(/"/g, '\\"');
      const el = root.querySelector(`#${escaped}`)
        || root.querySelector(`[data-preview-section="${escaped}"]`);
      if (scrollSectionId === 'custom-embeds' && !el) {
        root.querySelector('.custom-embed-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [scrollSectionId, data]);

  return (
    <div ref={rootRef} className="min-h-full">
      <LandingPage
        data={data}
        interactive={false}
        className="pointer-events-none select-none"
      />
    </div>
  );
}
