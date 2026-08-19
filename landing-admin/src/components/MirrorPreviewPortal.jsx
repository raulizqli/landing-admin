import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import LandingMirror from './LandingMirror';

/**
 * Espejo preview inside an about:blank iframe.
 * Keeps Tailwind breakpoints tied to the device frame width without loading
 * admin.leftsidedev.site in a nested frame (avoids frame-ancestors / CSP fights).
 */
function copyParentStyles(iframeDoc) {
  document.head.querySelectorAll('link[rel="stylesheet"], link[href*="fonts"], style').forEach((node) => {
    iframeDoc.head.appendChild(node.cloneNode(true));
  });
  iframeDoc.documentElement.classList.add('preview-frame');
  iframeDoc.documentElement.style.height = '100%';
  iframeDoc.body.style.margin = '0';
  iframeDoc.body.style.minHeight = '100%';
  iframeDoc.body.style.background = '#ffffff';
}

export default function MirrorPreviewPortal({
  formData,
  selectedId,
  language,
  scrollSectionId,
  activeMarketingRouteId,
  lockedHeroSlideIndex = null,
  title = 'Vista previa espejo',
  className = 'w-full h-full border-0 bg-white',
}) {
  const iframeRef = useRef(null);
  const [mountNode, setMountNode] = useState(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !doc) return undefined;

    doc.head.innerHTML = '<meta charset="utf-8" />';
    doc.body.innerHTML = '';
    copyParentStyles(doc);

    const root = doc.createElement('div');
    root.id = 'mirror-root';
    root.style.minHeight = '100%';
    doc.body.appendChild(root);
    setMountNode(root);

    return () => {
      setMountNode(null);
    };
  }, []);

  return (
    <>
      <iframe
        ref={iframeRef}
        title={title}
        className={className}
        src="about:blank"
      />
      {mountNode && formData
        ? createPortal(
          <LandingMirror
            previewData={formData}
            previewSeed={selectedId}
            language={language}
            scrollSectionId={scrollSectionId}
            activeMarketingRouteId={activeMarketingRouteId}
            lockedHeroSlideIndex={lockedHeroSlideIndex}
          />,
          mountNode,
        )
        : null}
    </>
  );
}
