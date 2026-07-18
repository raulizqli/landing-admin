import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildMirrorPreviewFrameUrl,
  isSameOriginPreviewMessage,
  LANDING_PREVIEW_READY,
  postLandingPreviewScroll,
  postLandingPreviewUpdate,
} from '../utils/mirrorPreview';

const TEMPLATE_PREVIEW_URL = (
  import.meta.env.VITE_TEMPLATE_PREVIEW_URL?.replace(/\/$/, '')
  || (import.meta.env.DEV ? 'http://localhost:5174' : '')
);

const MOBILE_FRAME = { width: 390, height: 844 };

function useScaledPhoneFrame(enabled) {
  const hostRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!enabled) {
      setScale(1);
      return undefined;
    }

    const host = hostRef.current;
    if (!host || typeof ResizeObserver === 'undefined') return undefined;

    const update = () => {
      const { clientWidth, clientHeight } = host;
      if (!clientWidth || !clientHeight) return;
      const next = Math.min(
        1,
        clientWidth / (MOBILE_FRAME.width + 24),
        clientHeight / (MOBILE_FRAME.height + 24),
      );
      setScale(Number.isFinite(next) && next > 0 ? next : 1);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, [enabled]);

  return { hostRef, scale };
}

export default function DevicePreviewPanel({
  formData,
  selectedId,
  editingLanguage,
  previewScrollSectionId,
  activeMarketingRouteId,
}) {
  const [deviceView, setDeviceView] = useState('desktop');
  const [previewSource, setPreviewSource] = useState('mirror');
  const previewIframeRef = useRef(null);
  const isMobile = deviceView === 'mobile';
  const { hostRef: phoneHostRef, scale: phoneScale } = useScaledPhoneFrame(isMobile);

  const mirrorPreviewUrl = useMemo(() => {
    if (!selectedId) return null;
    return buildMirrorPreviewFrameUrl({
      pageId: selectedId,
      language: editingLanguage,
    });
  }, [selectedId, editingLanguage]);

  const localPreviewUrl = selectedId && TEMPLATE_PREVIEW_URL
    ? `${TEMPLATE_PREVIEW_URL}?pageId=${encodeURIComponent(selectedId)}&preview=true&lang=${editingLanguage}`
    : null;

  const previewTargetOrigin = previewSource === 'mirror'
    ? window.location.origin
    : TEMPLATE_PREVIEW_URL;

  const postPreviewUpdate = useCallback(() => {
    if (!formData || !previewIframeRef.current?.contentWindow || !previewTargetOrigin) return;
    postLandingPreviewUpdate(
      previewIframeRef.current.contentWindow,
      previewTargetOrigin,
      {
        data: formData,
        pageId: selectedId,
        language: editingLanguage,
        scrollSectionId: previewScrollSectionId,
        activeMarketingRouteId,
      },
    );
  }, [
    formData,
    selectedId,
    editingLanguage,
    previewScrollSectionId,
    activeMarketingRouteId,
    previewTargetOrigin,
  ]);

  useEffect(() => {
    if (!formData) return;
    if (previewSource === 'local' && !TEMPLATE_PREVIEW_URL) return;
    if (previewSource === 'mirror' && !mirrorPreviewUrl) return;
    postPreviewUpdate();
  }, [formData, previewSource, mirrorPreviewUrl, postPreviewUpdate, activeMarketingRouteId]);

  useEffect(() => {
    if (previewSource !== 'mirror') return undefined;

    const handleReady = (event) => {
      if (!isSameOriginPreviewMessage(event)) return;
      if (event.data?.type !== LANDING_PREVIEW_READY) return;
      postPreviewUpdate();
    };

    window.addEventListener('message', handleReady);
    return () => window.removeEventListener('message', handleReady);
  }, [previewSource, postPreviewUpdate]);

  useEffect(() => {
    if (!previewScrollSectionId || !formData) return;
    if (!previewIframeRef.current?.contentWindow || !previewTargetOrigin) return;
    if (previewSource === 'local' && !TEMPLATE_PREVIEW_URL) return;
    postLandingPreviewScroll(
      previewIframeRef.current.contentWindow,
      previewTargetOrigin,
      previewScrollSectionId,
    );
  }, [previewScrollSectionId, previewSource, previewTargetOrigin, formData]);

  const openLocalPreviewTab = () => {
    if (localPreviewUrl) window.open(localPreviewUrl, '_blank', 'noopener,noreferrer');
  };

  const iframeSrc = previewSource === 'mirror' ? mirrorPreviewUrl : localPreviewUrl;
  const iframeKey = previewSource === 'mirror'
    ? `mirror:${mirrorPreviewUrl}`
    : `local:${localPreviewUrl}`;

  let previewSurface = null;
  if (!formData) {
    previewSurface = (
      <div className="h-full flex items-center justify-center text-gray-400 text-xs bg-white">
        Ningún sitio seleccionado para previsualización.
      </div>
    );
  } else if (previewSource === 'local' && !TEMPLATE_PREVIEW_URL) {
    previewSurface = (
      <div className="h-full flex items-center justify-center text-gray-400 text-xs bg-white p-6 text-center">
        Configura <code className="mx-1 text-[10px] bg-gray-100 px-1 rounded">VITE_TEMPLATE_PREVIEW_URL</code> en <code className="mx-1 text-[10px] bg-gray-100 px-1 rounded">.env.local</code> para usar la vista local.
      </div>
    );
  } else if (!iframeSrc) {
    previewSurface = (
      <div className="h-full flex items-center justify-center text-gray-400 text-xs bg-white">
        Ningún sitio seleccionado para previsualización.
      </div>
    );
  } else {
    previewSurface = (
      <iframe
        ref={previewIframeRef}
        key={iframeKey}
        title={`Vista previa ${previewSource === 'mirror' ? 'espejo' : 'local'} de ${selectedId}`}
        src={iframeSrc}
        onLoad={postPreviewUpdate}
        className="w-full h-full border-0 bg-white"
      />
    );
  }

  return (
    <div className="flex-1 min-h-0 min-w-0 bg-[#E8E6E1] p-4 sm:p-5 flex flex-col overflow-hidden">
      <div className="w-full min-w-0 flex justify-between items-center mb-3 shrink-0 gap-3 overflow-x-auto">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          Monitor de Aspecto en Vivo
        </span>
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded-lg shadow-sm border text-[11px] font-medium space-x-1">
            <button
              type="button"
              onClick={() => setPreviewSource('mirror')}
              className={`px-2.5 py-1 rounded-md transition ${previewSource === 'mirror' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Espejo
            </button>
            <button
              type="button"
              onClick={() => setPreviewSource('local')}
              disabled={!TEMPLATE_PREVIEW_URL}
              className={`px-2.5 py-1 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed ${previewSource === 'local' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Local
            </button>
          </div>
          <div className="bg-white p-1 rounded-lg shadow-sm border text-[11px] font-medium space-x-1">
            <button
              type="button"
              onClick={() => setDeviceView('desktop')}
              className={`px-2.5 py-1 rounded-md transition ${deviceView === 'desktop' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Escritorio
            </button>
            <button
              type="button"
              onClick={() => setDeviceView('mobile')}
              className={`px-2.5 py-1 rounded-md transition ${deviceView === 'mobile' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Móvil
            </button>
          </div>
          {previewSource === 'local' && (
            <button
              type="button"
              onClick={openLocalPreviewTab}
              disabled={!localPreviewUrl}
              className="bg-white border shadow-sm text-[11px] font-medium px-2.5 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Abrir pestaña ↗
            </button>
          )}
        </div>
      </div>

      <div
        ref={isMobile ? phoneHostRef : undefined}
        className="flex-1 min-h-0 min-w-0 flex items-center justify-center overflow-hidden"
      >
        {isMobile ? (
          <div
            className="shrink-0 transition-transform duration-300"
            style={{
              width: MOBILE_FRAME.width,
              height: MOBILE_FRAME.height,
              transform: `scale(${phoneScale})`,
              transformOrigin: 'center center',
            }}
          >
            <div className="h-full w-full rounded-[2rem] border border-gray-700/80 bg-[#1c1c1e] p-2.5 shadow-xl shadow-black/20">
              <div className="relative h-full w-full overflow-hidden rounded-[1.35rem] bg-white">
                <div className="pointer-events-none absolute left-1/2 top-1.5 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black/90" />
                {previewSurface}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-[1200px] h-full min-h-0 flex flex-col rounded-xl border border-gray-300/80 bg-white shadow-md shadow-black/5 overflow-hidden">
            <div className="shrink-0 flex items-center gap-3 px-3 py-2 border-b border-gray-200 bg-[#F3F2EF]">
              <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E5A39A]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#E2C98A]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#A8C3A0]" />
              </div>
              <div className="min-w-0 flex-1 rounded-md bg-white border border-gray-200 px-2.5 py-1 text-[11px] text-gray-500 truncate font-sans">
                {selectedId ? `${selectedId} · vista previa` : 'vista previa'}
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden bg-white">
              {previewSurface}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
