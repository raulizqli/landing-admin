import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LandingMirror from './LandingMirror';
import {
  isSameOriginPreviewMessage,
  LANDING_PREVIEW_READY,
  LANDING_PREVIEW_SCROLL,
  LANDING_PREVIEW_UPDATE,
} from '../utils/mirrorPreview';

/**
 * Same-origin iframe host for Espejo preview.
 * Viewport width = device frame width, so Tailwind breakpoints match production.
 */
export default function MirrorPreviewFrame() {
  const [searchParams] = useSearchParams();
  const [previewData, setPreviewData] = useState(null);
  const [previewSeed, setPreviewSeed] = useState(searchParams.get('pageId') || '');
  const [language, setLanguage] = useState(searchParams.get('lang') || 'es');
  const [scrollSectionId, setScrollSectionId] = useState(null);
  const [activeMarketingRouteId, setActiveMarketingRouteId] = useState('');

  useEffect(() => {
    const handleMessage = (event) => {
      if (!isSameOriginPreviewMessage(event)) return;

      if (event.data?.type === LANDING_PREVIEW_SCROLL) {
        setScrollSectionId(event.data.sectionId || null);
        return;
      }

      if (event.data?.type !== LANDING_PREVIEW_UPDATE) return;

      setPreviewData(event.data.data ?? null);
      if (event.data.pageId != null) setPreviewSeed(event.data.pageId);
      if (event.data.language != null) setLanguage(event.data.language);
      if (event.data.activeMarketingRouteId != null) {
        setActiveMarketingRouteId(event.data.activeMarketingRouteId || '');
      }
      if (event.data.scrollSectionId) {
        setScrollSectionId(event.data.scrollSectionId);
      }
    };

    window.addEventListener('message', handleMessage);
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: LANDING_PREVIEW_READY }, window.location.origin);
    }
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!previewData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-400 text-xs font-sans">
        Esperando datos de vista previa…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <LandingMirror
        previewData={previewData}
        previewSeed={previewSeed}
        language={language}
        scrollSectionId={scrollSectionId}
        activeMarketingRouteId={activeMarketingRouteId}
      />
    </div>
  );
}
