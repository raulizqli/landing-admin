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
const PREVIEW_SOURCE_HELP = [
  'Espejo: muestra al instante los cambios del formulario, incluso antes de guardar, sin nuevas lecturas de Firestore.',
  'Local: carga el template real configurado para comprobar su comportamiento antes de publicar.',
].join('\n\n');

const PREVIEW_SOURCE_DESCRIPTION = {
  mirror: 'Espejo: vista instantánea con los cambios aún no guardados. No genera lecturas adicionales de Firestore.',
  local: 'Local: abre el template real configurado. Úsalo para validar rutas, estilos y comportamiento antes de publicar.',
};

function useCompactViewport() {
  const [matches, setMatches] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
  ));

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return matches;
}

function useScaledPhoneFrame(enabled, fitWidth) {
  const hostRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!enabled) return undefined;

    const host = hostRef.current;
    if (!host || typeof ResizeObserver === 'undefined') return undefined;

    const update = () => {
      const { clientWidth, clientHeight } = host;
      if (!clientWidth || !clientHeight) return;
      const next = Math.min(
        1,
        clientHeight / (MOBILE_FRAME.height + 24),
        fitWidth ? clientWidth / (MOBILE_FRAME.width + 24) : 1,
      );
      setScale(Number.isFinite(next) && next > 0 ? next : 1);
    };

    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, [enabled, fitWidth]);

  const resolvedScale = enabled ? scale : 1;
  return { hostRef, scale: resolvedScale };
}

export default function DevicePreviewPanel({
  formData,
  selectedId,
  editingLanguage,
  previewScrollSectionId,
  activeMarketingRouteId,
  deviceView = 'desktop',
  onDeviceViewChange,
}) {
  const [previewSource, setPreviewSource] = useState('mirror');
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);
  const [layoutTransitioning, setLayoutTransitioning] = useState(false);
  const previewIframeRef = useRef(null);
  const layoutTimerRef = useRef(null);
  const isMobile = deviceView === 'mobile';
  const compactViewport = useCompactViewport();
  const { hostRef: phoneHostRef, scale: phoneScale } = useScaledPhoneFrame(
    isMobile,
    compactViewport,
  );
  const mobilePanelWidth = Math.ceil((MOBILE_FRAME.width * phoneScale) + 40);

  useEffect(() => () => {
    if (layoutTimerRef.current) window.clearTimeout(layoutTimerRef.current);
  }, []);

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

  const requestPreviewSource = (nextSource) => {
    if (nextSource === previewSource) return;
    if (nextSource === 'local' && !TEMPLATE_PREVIEW_URL) return;
    const description = PREVIEW_SOURCE_DESCRIPTION[nextSource];
    const confirmed = window.confirm(`${description}\n\n¿Quieres cambiar a esta vista?`);
    if (confirmed) setPreviewSource(nextSource);
  };

  const requestDeviceView = (nextView) => {
    if (nextView === deviceView) return;
    setLayoutTransitioning(true);
    onDeviceViewChange?.(nextView);
    if (layoutTimerRef.current) window.clearTimeout(layoutTimerRef.current);
    layoutTimerRef.current = window.setTimeout(() => {
      setLayoutTransitioning(false);
      layoutTimerRef.current = null;
    }, 500);
  };

  const iframeSrc = previewSource === 'mirror' ? mirrorPreviewUrl : localPreviewUrl;
  const iframeKey = previewSource === 'mirror'
    ? `mirror:${mirrorPreviewUrl}`
    : `local:${localPreviewUrl}`;

  const previewSurface = (() => {
    if (!formData) {
      return (
        <div className="h-full flex items-center justify-center text-gray-400 text-xs bg-white">
          Ningún sitio seleccionado para previsualización.
        </div>
      );
    }
    if (previewSource === 'local' && !TEMPLATE_PREVIEW_URL) {
      return (
        <div className="h-full flex items-center justify-center text-gray-400 text-xs bg-white p-6 text-center">
          Configura <code className="mx-1 text-[10px] bg-gray-100 px-1 rounded">VITE_TEMPLATE_PREVIEW_URL</code> en <code className="mx-1 text-[10px] bg-gray-100 px-1 rounded">.env.local</code> para usar la vista local.
        </div>
      );
    }
    if (!iframeSrc) {
      return (
        <div className="h-full flex items-center justify-center text-gray-400 text-xs bg-white">
          Ningún sitio seleccionado para previsualización.
        </div>
      );
    }
    return (
      <iframe
        ref={previewIframeRef}
        key={iframeKey}
        title={`Vista previa ${previewSource === 'mirror' ? 'espejo' : 'local'} de ${selectedId}`}
        src={iframeSrc}
        onLoad={postPreviewUpdate}
        className="w-full h-full border-0 bg-white"
      />
    );
  })();

  return (
    <div
      style={!compactViewport
        ? {
            flexGrow: isMobile ? 0 : 1,
            flexShrink: isMobile ? 0 : 1,
            flexBasis: isMobile ? `${mobilePanelWidth}px` : '0px',
            maxWidth: isMobile ? `${mobilePanelWidth}px` : '100%',
          }
        : undefined}
      className={`min-h-0 min-w-0 bg-[#E8E6E1] p-4 sm:p-5 flex flex-col overflow-hidden transition-[flex-grow,flex-shrink,flex-basis,max-width,height] duration-500 ease-in-out
        max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-50 max-lg:w-full max-lg:max-w-none max-lg:flex-none max-lg:p-0 max-lg:border-t max-lg:border-gray-300 max-lg:shadow-[0_-12px_30px_rgba(0,0,0,0.18)]
        ${previewDrawerOpen ? 'max-lg:h-[82dvh] max-lg:max-h-[760px]' : 'max-lg:h-11'}`}
    >
      <button
        type="button"
        onClick={() => setPreviewDrawerOpen((value) => !value)}
        className="hidden max-lg:grid h-11 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 bg-gray-900 px-4 text-white"
        aria-expanded={previewDrawerOpen}
        aria-controls="responsive-live-preview"
      >
        <span className="text-[11px] font-bold uppercase tracking-wide justify-self-start">
          Vista previa en vivo
        </span>
        <span className="flex flex-col items-center gap-0.5 text-gray-400" aria-hidden="true">
          <span className="h-0.5 w-5 rounded-full bg-gray-400" />
          <span className="h-0.5 w-5 rounded-full bg-gray-400" />
          <span className="h-0.5 w-5 rounded-full bg-gray-400" />
        </span>
        <span
          className={`justify-self-end text-base transition-transform duration-300 ${previewDrawerOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          ↑
        </span>
      </button>

      <div
        id="responsive-live-preview"
        className={`w-full min-w-0 flex mb-3 shrink-0 max-lg:px-3 max-lg:pt-2 ${
          previewDrawerOpen ? '' : 'max-lg:hidden'
        } ${
          isMobile
            ? 'flex-col items-stretch gap-1.5'
            : 'justify-between items-center gap-3 overflow-x-auto'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-bold text-gray-500 uppercase tracking-wide`}
            title={PREVIEW_SOURCE_HELP}
          >
            Monitor de Aspecto en Vivo
          </span>
          <button
            type="button"
            onClick={() => window.alert(PREVIEW_SOURCE_HELP)}
            className="h-5 w-5 shrink-0 rounded-full border border-gray-300 bg-white text-[10px] font-bold text-gray-500 hover:bg-gray-50"
            title="¿Por qué existen Espejo y Local?"
            aria-label="Explicar las vistas Espejo y Local"
          >
            ?
          </button>
        </div>
        <div className={`flex ${isMobile ? 'flex-wrap gap-1.5' : 'items-center gap-2'}`}>
          <div className={`bg-white p-1 rounded-lg shadow-sm border font-medium space-x-1 ${isMobile ? 'text-[10px]' : 'text-[11px]'}`}>
            <button
              type="button"
              onClick={() => requestPreviewSource('mirror')}
              title={PREVIEW_SOURCE_DESCRIPTION.mirror}
              className={`${isMobile ? 'px-1.5' : 'px-2.5'} py-1 rounded-md transition ${previewSource === 'mirror' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-400 hover:bg-indigo-100'}`}
            >
              Espejo
            </button>
            <button
              type="button"
              onClick={() => requestPreviewSource('local')}
              disabled={!TEMPLATE_PREVIEW_URL}
              title={TEMPLATE_PREVIEW_URL ? PREVIEW_SOURCE_DESCRIPTION.local : 'Configura VITE_TEMPLATE_PREVIEW_URL para activar esta vista.'}
              className={`${isMobile ? 'px-1.5' : 'px-2.5'} py-1 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed ${previewSource === 'local' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-400 hover:bg-indigo-100'}`}
            >
              Local
            </button>
          </div>
          <div className={`bg-white p-1 rounded-lg shadow-sm border font-medium space-x-1 ${isMobile ? 'text-[10px]' : 'text-[11px]'}`}>
            <button
              type="button"
              onClick={() => requestDeviceView('desktop')}
              title="Mostrar el preview con el ancho de una pantalla de escritorio."
              className={`${isMobile ? 'px-1.5' : 'px-2.5'} py-1 rounded-md transition ${deviceView === 'desktop' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-400 hover:bg-indigo-100'}`}
            >
              Escritorio
            </button>
            <button
              type="button"
              onClick={() => requestDeviceView('mobile')}
              title="Mostrar el preview dentro de un viewport móvil de 390 × 844 px."
              className={`${isMobile ? 'px-1.5' : 'px-2.5'} py-1 rounded-md transition ${deviceView === 'mobile' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-400 hover:bg-indigo-100'}`}
            >
              Móvil
            </button>
          </div>
          {previewSource === 'local' && (
            <button
              type="button"
              onClick={openLocalPreviewTab}
              disabled={!localPreviewUrl}
              title="Abrir el template local en una pestaña completa."
              className={`bg-white border shadow-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed ${
                isMobile ? 'text-[10px] px-1.5 py-1' : 'text-[11px] px-2.5 py-1.5'
              }`}
            >
              {isMobile ? 'Abrir ↗' : 'Abrir pestaña ↗'}
            </button>
          )}
        </div>
      </div>

      <div
        ref={isMobile ? phoneHostRef : undefined}
        className={`relative flex-1 min-h-0 min-w-0 items-center justify-center overflow-hidden max-lg:px-3 max-lg:pb-3 ${
          previewDrawerOpen ? 'flex' : 'flex max-lg:hidden'
        }`}
      >
        {layoutTransitioning && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-[#E8E6E1]/95 text-gray-600">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Ajustando vista…</span>
          </div>
        )}
        {isMobile ? (
          <div
            className="relative shrink-0 transition-[width,height] duration-300"
            style={{
              width: MOBILE_FRAME.width * phoneScale,
              height: MOBILE_FRAME.height * phoneScale,
            }}
          >
            <div
              className="absolute left-0 top-0 transition-transform duration-300"
              style={{
                width: MOBILE_FRAME.width,
                height: MOBILE_FRAME.height,
                transform: `scale(${phoneScale})`,
                transformOrigin: 'top left',
              }}
            >
              <div className="h-full w-full rounded-[2rem] border border-gray-700/80 bg-[#1c1c1e] p-2.5 shadow-xl shadow-black/20">
                <div className="relative h-full w-full overflow-hidden rounded-[1.35rem] bg-white">
                  <div className="pointer-events-none absolute left-1/2 top-1.5 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black/90" />
                  {previewSurface}
                </div>
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
