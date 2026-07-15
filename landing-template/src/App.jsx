import { useState, useEffect, useMemo } from 'react';
import LandingPage from './components/LandingPage';
import { generateRandomPreviewContent, withPreviewContent } from './utils/previewContent';
import { normalizePageData } from './utils/pageModel';
import { initLandingAnalytics } from './utils/analytics';
import { resolvePageContext } from './utils/domainRouting';
import { fetchPageContent } from './utils/pageContent';
import { getPageLoadErrorMessage } from './utils/pageLoadErrors';
import { PAGE_ID } from './firebase';
import { resolvePageFaviconUrl, setDocumentFavicon } from './utils/documentFavicon';

function getSearchParams() {
  return new URLSearchParams(window.location.search);
}

function isPreviewMode() {
  return import.meta.env.DEV || getSearchParams().get('preview') === 'true';
}

function isAllowedPreviewSender(origin) {
  if (import.meta.env.DEV) {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  }
  const adminOrigin = import.meta.env.VITE_ADMIN_ORIGIN;
  return adminOrigin ? origin === adminOrigin : false;
}

function useDemoContent(pageId, labelSuffix = '') {
  const demoData = generateRandomPreviewContent(pageId);
  document.title = labelSuffix
    ? `Vista previa — Psicología (${labelSuffix})`
    : 'Vista previa — Psicología';
  return demoData;
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#4A5D4E]/30 border-t-[#4A5D4E] rounded-full animate-spin mx-auto" />
        <p className="text-sm text-[#2A342D]/60 font-sans">Cargando...</p>
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center px-5">
      <div className="text-center max-w-md space-y-3">
        <p className="font-serif text-xl text-[#2A342D]">Página no disponible</p>
        <p className="text-sm text-[#2A342D]/60 font-sans leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

export default function App() {
  const previewMode = isPreviewMode();
  const [resolvedPageId, setResolvedPageId] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [pageData, setPageData] = useState(null);
  const [livePreviewData, setLivePreviewData] = useState(null);
  const [livePreviewPageId, setLivePreviewPageId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingDemoFallback, setUsingDemoFallback] = useState(false);

  useEffect(() => {
    if (!previewMode) return undefined;

    const scrollToPreviewSection = (sectionId) => {
      if (!sectionId) return;
      const escaped = typeof CSS !== 'undefined' && CSS.escape
        ? CSS.escape(sectionId)
        : String(sectionId).replace(/"/g, '\\"');
      const el = document.getElementById(sectionId)
        || document.querySelector(`[data-preview-section="${escaped}"]`)
        || (sectionId === 'custom-embeds' ? document.querySelector('.custom-embed-section') : null);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleMessage = (event) => {
      if (!isAllowedPreviewSender(event.origin)) return;

      if (event.data?.type === 'LANDING_PREVIEW_SCROLL') {
        scrollToPreviewSection(event.data.sectionId);
        return;
      }

      if (event.data?.type !== 'LANDING_PREVIEW_UPDATE') return;
      setLivePreviewData(event.data.data ?? null);
      setLivePreviewPageId(event.data.pageId ?? null);
      setUsingDemoFallback(false);
      if (event.data.scrollSectionId) {
        window.setTimeout(() => scrollToPreviewSection(event.data.scrollSectionId), 100);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [previewMode]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setLoading(true);
      setError(null);
      setUsingDemoFallback(false);

      let contextPageId = String(PAGE_ID ?? '').trim() || 'preview-demo';

      try {
        const context = await resolvePageContext({
          searchParams: getSearchParams(),
          envPageId: PAGE_ID,
        });

        if (!context?.pageId) {
          if (!cancelled) {
            if (previewMode || import.meta.env.DEV) {
              setResolvedPageId(contextPageId);
              setRouteData(null);
              setPageData(useDemoContent(contextPageId, 'sin ID'));
              setUsingDemoFallback(true);
              setLoading(false);
              return;
            }

            setResolvedPageId(null);
            setRouteData(null);
            setError(
              `No se pudo identificar la landing en "${window.location.hostname}". Asigna customDomain en el admin, define VITE_PAGINA_ID en el build, o abre con ?pageId=ID-del-documento.`,
            );
            setLoading(false);
          }
          return;
        }

        contextPageId = context.pageId;

        if (!cancelled) {
          setResolvedPageId(context.pageId);
          setRouteData(context.routeData);
        }

        const raw = await fetchPageContent(context.pageId, context.routeData);
        if (cancelled) return;

        if (!raw) {
          if (previewMode || import.meta.env.DEV) {
            setPageData(useDemoContent(context.pageId, 'demo local'));
            setUsingDemoFallback(true);
            return;
          }
          setError(`No se encontró la página con ID "${context.pageId}". Crea el documento en Firestore (colección pages).`);
          return;
        }

        const normalized = normalizePageData(raw);
        const data = previewMode
          ? withPreviewContent(normalized, { seed: context.pageId, enabled: true })
          : normalized;

        setPageData(data);
        document.title = data.name
          ? `${data.name} — Psicología`
          : 'Psicología profesional';
      } catch (err) {
        console.error('Error al cargar la página:', err);
        if (cancelled) return;

        if (previewMode || import.meta.env.DEV) {
          setResolvedPageId(contextPageId);
          setRouteData(null);
          setPageData(useDemoContent(contextPageId, 'demo local'));
          setUsingDemoFallback(true);
          return;
        }

        setError(`${getPageLoadErrorMessage(err)}${err?.code ? ` [${err.code}]` : ''}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [previewMode]);

  const pageId = livePreviewPageId || resolvedPageId;

  const displayData = useMemo(() => {
    const source = livePreviewPageId === resolvedPageId && livePreviewData ? livePreviewData : pageData;
    if (!source) return source;
    const normalized = normalizePageData(source);
    if (!previewMode || !pageId) return normalized;
    return withPreviewContent(normalized, { seed: pageId, enabled: !usingDemoFallback });
  }, [livePreviewPageId, livePreviewData, pageData, previewMode, pageId, resolvedPageId, usingDemoFallback]);

  useEffect(() => {
    if (!displayData) return;
    document.title = displayData.name
      ? `${displayData.name} — Psicología`
      : 'Psicología profesional';
    setDocumentFavicon(resolvePageFaviconUrl(displayData));
  }, [displayData]);

  useEffect(() => {
    if (!displayData || previewMode || loading || error || !pageId || usingDemoFallback) return;
    initLandingAnalytics(displayData, {
      pageId,
      firebaseConfig: routeData?.useExternalFirebase ? routeData.externalFirebase : null,
    });
  }, [displayData, previewMode, loading, error, pageId, routeData, usingDemoFallback]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!displayData) {
    return previewMode && pageId
      ? <LandingPage data={generateRandomPreviewContent(pageId)} />
      : <ErrorState message="No hay datos disponibles para esta página." />;
  }

  return <LandingPage data={displayData} />;
}
