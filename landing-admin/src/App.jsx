import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { listPageDocuments } from './utils/firestoreAccess';
import { db } from './firebase';
import { createEmptySlide } from './utils/heroSlides';
import { hydratePageForm } from './utils/pageModel';
import HeroSlidesEditor from './components/HeroSlidesEditor';
import SocialFieldsEditor from './components/SocialFieldsEditor';
import CustomEmbedsFieldsEditor from './components/CustomEmbedsFieldsEditor';
import NavFieldsEditor from './components/NavFieldsEditor';
import SectionVisibilityFieldsEditor from './components/SectionVisibilityFieldsEditor';
import PreHeroFieldsEditor from './components/PreHeroFieldsEditor';
import ServicesFieldsEditor from './components/ServicesFieldsEditor';
import CatalogFieldsEditor from './components/CatalogFieldsEditor';
import GalleryFieldsEditor from './components/GalleryFieldsEditor';
import VideoSectionFieldsEditor from './components/VideoSectionFieldsEditor';
import TestimonialsFieldsEditor from './components/TestimonialsFieldsEditor';
import BlogFieldsEditor from './components/BlogFieldsEditor';
import AboutFieldsEditor from './components/AboutFieldsEditor';
import PageAppearanceEditor from './components/PageAppearanceEditor';
import LabelsFieldsEditor from './components/LabelsFieldsEditor';
import PageLanguagesEditor from './components/PageLanguagesEditor';
import LocationFieldsEditor from './components/LocationFieldsEditor';
import PhoneFieldsEditor from './components/PhoneFieldsEditor';
import LegalDocumentsFieldsEditor from './components/LegalDocumentsFieldsEditor';
import EditorSection from './components/EditorSection';
import LandingMirror from './components/LandingMirror';
import { resolvePreviewSectionId } from './utils/sectionAnchors';
import SiteHostingFieldsEditor from './components/SiteHostingFieldsEditor';
import UserManagement from './components/UserManagement';
import CreatePageModal from './components/CreatePageModal';
import VerticalFieldsEditor from './components/VerticalFieldsEditor';
import BillingPlansPanel from './components/BillingPlansPanel';
import PlanGate from './components/PlanGate';
import { hydrateFormSocial } from './utils/socialLinks';
import { createPageInHub, loadPageForEditor, savePageFromEditor } from './utils/pageRepository';
import { useAuth } from './contexts/AuthContext';
import { useLocale, LanguageSwitcher } from './i18n/LocaleContext';
import { useEntitlements } from './hooks/useEntitlements';
import {
  canAccessHostingSettings,
  canCreatePages,
  canEditPage,
  canManagePageLayout,
  canManageUsers,
  filterAccessiblePages,
  getRoleLabel,
  isSinglePageUser,
} from './utils/permissions';
import { applyLockedPageLayout } from './utils/layoutLock';
import { isFlagEnabled } from './utils/sectionVisibility';
import { normalizeCustomEmbeds } from './utils/customEmbeds';
import { getEditorSectionFill } from './utils/editorSectionFill';
import {
  normalizePageLanguage,
  resolvePageLanguage,
  updatePageTranslation,
} from '@raulizqli/landing-core/pageTranslations';

const TEMPLATE_PREVIEW_URL = (
  import.meta.env.VITE_TEMPLATE_PREVIEW_URL?.replace(/\/$/, '')
  || (import.meta.env.DEV ? 'http://localhost:5174' : '')
);

const DEMO_PREVIEW_ID = 'preview-demo';
const SIDEBAR_COLLAPSED_KEY = 'landing-admin:pages-sidebar-collapsed';

function readSidebarCollapsedDefault() {
  try {
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === '0' || stored === 'false') return false;
    if (stored === '1' || stored === 'true') return true;
  } catch {
    // ignore
  }
  // Start minimized so editor/preview get more room (especially single-page users).
  return true;
}

function hydrateForm(landing) {
  return hydrateFormSocial(hydratePageForm(landing));
}

export default function App() {
  const { user, profile, loading: authLoading, signOut, hasAccess, authError } = useAuth();
  const { t } = useLocale();
  const entitlements = useEntitlements();
  const [landings, setLandings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState(null);
  const [editingLanguage, setEditingLanguage] = useState('es');
  const [layoutBaseline, setLayoutBaseline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deviceView, setDeviceView] = useState('desktop');
  const [previewSource, setPreviewSource] = useState('mirror');
  const [previewSectionKey, setPreviewSectionKey] = useState('identity');
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [creatingPage, setCreatingPage] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [pagesSidebarCollapsed, setPagesSidebarCollapsed] = useState(readSidebarCollapsedDefault);
  const previewIframeRef = useRef(null);

  const accessibleLandings = profile ? filterAccessiblePages(landings, profile) : [];
  const showPageList = !isSinglePageUser(profile);
  const selectedLanding = accessibleLandings.find((landing) => landing.id === selectedId)
    || (selectedId === DEMO_PREVIEW_ID ? { id: DEMO_PREVIEW_ID, name: t('shell.demoPreview') } : null);
  const selectedPageLabel = selectedLanding?.name || selectedLanding?.id || selectedId || '·';
  const selectedPageInitial = String(selectedPageLabel).trim().charAt(0).toUpperCase() || '·';

  const setSidebarCollapsed = (collapsed) => {
    setPagesSidebarCollapsed(collapsed);
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch {
      // ignore
    }
  };
  const canEditSelectedPage = canEditPage(profile, selectedId);
  const canManageHosting = canAccessHostingSettings(profile);
  const canCreateNewPages = canCreatePages(profile);
  const canManageLayout = canManagePageLayout(profile);
  const previewScrollSectionId = resolvePreviewSectionId(previewSectionKey);
  const upgradeLabel = t('common.upgrade');
  const openBilling = () => setShowBilling(true);

  const editorData = useMemo(
    () => (formData
      ? resolvePageLanguage(formData, editingLanguage, { fallback: false })
      : null),
    [formData, editingLanguage],
  );

  const handleEditorChange = useCallback((nextEditorData) => {
    setFormData((current) => (
      current ? updatePageTranslation(current, nextEditorData, editingLanguage) : current
    ));
  }, [editingLanguage]);

  const hasActiveCustomEmbeds = normalizeCustomEmbeds(editorData?.customEmbeds)
    .some((embed) => embed.enabled !== false);

  const showEditorSection = (flag, defaultEnabled = true) => (
    canManageLayout || isFlagEnabled(editorData, flag, defaultEnabled)
  );

  const localPreviewUrl = selectedId && TEMPLATE_PREVIEW_URL
    ? `${TEMPLATE_PREVIEW_URL}?pageId=${encodeURIComponent(selectedId)}&preview=true&lang=${editingLanguage}`
    : null;

  const activatePreviewSection = useCallback((sectionKey) => {
    setPreviewSectionKey(sectionKey);
  }, []);

  const postPreviewUpdate = useCallback(() => {
    if (!formData || !previewIframeRef.current?.contentWindow || !TEMPLATE_PREVIEW_URL) return;

    previewIframeRef.current.contentWindow.postMessage(
      {
        type: 'LANDING_PREVIEW_UPDATE',
        data: formData,
        pageId: selectedId,
        language: editingLanguage,
        scrollSectionId: previewScrollSectionId,
      },
      TEMPLATE_PREVIEW_URL
    );
  }, [formData, selectedId, editingLanguage, previewScrollSectionId]);

  useEffect(() => {
    if (previewSource !== 'local') return;
    postPreviewUpdate();
  }, [formData, previewSource, postPreviewUpdate]);

  useEffect(() => {
    if (previewSource !== 'local' || !previewScrollSectionId) return;
    if (!previewIframeRef.current?.contentWindow || !TEMPLATE_PREVIEW_URL) return;
    previewIframeRef.current.contentWindow.postMessage(
      { type: 'LANDING_PREVIEW_SCROLL', sectionId: previewScrollSectionId },
      TEMPLATE_PREVIEW_URL
    );
  }, [previewScrollSectionId, previewSource]);

  const openLocalPreviewTab = () => {
    if (localPreviewUrl) window.open(localPreviewUrl, '_blank', 'noopener,noreferrer');
  };

  const selectLanding = async (landing) => {
    if (!canEditPage(profile, landing.id)) {
      alert('No tienes permiso para editar esta página.');
      return;
    }

    setSelectedId(landing.id);
    if (landing.id === DEMO_PREVIEW_ID) {
      const hydrated = hydrateForm(landing);
      setFormData(hydrated);
      setEditingLanguage(normalizePageLanguage(hydrated.defaultLanguage ?? hydrated.labelLanguage));
      setLayoutBaseline(hydrated);
      return;
    }
    try {
      const data = await loadPageForEditor(landing.id, landing);
      const hydrated = hydrateForm({ id: landing.id, ...data });
      setFormData(hydrated);
      setEditingLanguage(normalizePageLanguage(hydrated.defaultLanguage ?? hydrated.labelLanguage));
      setLayoutBaseline(hydrated);
    } catch (error) {
      console.error('Error al cargar la landing:', error);
      const hydrated = hydrateForm(landing);
      setFormData(hydrated);
      setEditingLanguage(normalizePageLanguage(hydrated.defaultLanguage ?? hydrated.labelLanguage));
      setLayoutBaseline(hydrated);
    }
  };

  const selectDemoPreview = () => {
    selectLanding({ id: DEMO_PREVIEW_ID });
  };

  useEffect(() => {
    if (authLoading || !user || !profile) return;

    const loadLandings = async () => {
      setLoading(true);
      setAccessError('');

      try {
        const list = await listPageDocuments(db);
        setLandings(list);

        const allowed = filterAccessiblePages(list, profile);

        if (allowed.length > 0) {
          const first = allowed[0];
          setSelectedId(first.id);
          const loaded = await loadPageForEditor(first.id, first);
          const hydrated = hydrateForm({ id: first.id, ...loaded });
          setFormData(hydrated);
          setEditingLanguage(normalizePageLanguage(hydrated.defaultLanguage ?? hydrated.labelLanguage));
          setLayoutBaseline(hydrated);
        } else if (canCreatePages(profile)) {
          // Root with an empty hub: stay in the editor shell and create the first landing.
          setSelectedId(null);
          setFormData(null);
          setLayoutBaseline(null);
          setAccessError('');
        } else if (import.meta.env.DEV && canManageUsers(profile)) {
          setSelectedId(DEMO_PREVIEW_ID);
          const hydrated = hydrateForm({ id: DEMO_PREVIEW_ID });
          setFormData(hydrated);
          setEditingLanguage(normalizePageLanguage(hydrated.defaultLanguage ?? hydrated.labelLanguage));
          setLayoutBaseline(hydrated);
        } else {
          setSelectedId(null);
          setFormData(null);
          setLayoutBaseline(null);
          setAccessError('No tienes páginas asignadas. Contacta al administrador.');
        }
      } catch (error) {
        console.error('Error al leer Firestore:', error);
        if (canCreatePages(profile)) {
          setSelectedId(null);
          setFormData(null);
          setLayoutBaseline(null);
          setAccessError('');
        } else if (import.meta.env.DEV && canManageUsers(profile)) {
          setSelectedId(DEMO_PREVIEW_ID);
          const hydrated = hydrateForm({ id: DEMO_PREVIEW_ID });
          setFormData(hydrated);
          setEditingLanguage(normalizePageLanguage(hydrated.defaultLanguage ?? hydrated.labelLanguage));
          setLayoutBaseline(hydrated);
        } else {
          setAccessError('No se pudieron cargar las páginas asignadas.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadLandings();
  }, [user, profile, authLoading]);

  const handleSelectLanding = async (landing) => {
    await selectLanding(landing);
  };

  const isDemoPreview = selectedId === DEMO_PREVIEW_ID;

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (isDemoPreview) {
      alert('Modo demo: crea una landing con “Nueva landing” para guardar en Firestore.');
      return;
    }
    if (!canEditSelectedPage) {
      alert('No tienes permiso para guardar cambios en esta página.');
      return;
    }
    setSaving(true);
    try {
      const dataToSave = canManageLayout || !layoutBaseline
        ? formData
        : applyLockedPageLayout(formData, layoutBaseline);
      const result = await savePageFromEditor(selectedId, dataToSave);
      const hydrated = hydrateForm({ id: selectedId, ...dataToSave });
      setFormData(hydrated);
      setLayoutBaseline(hydrated);
      setLandings((current) => current.map((landing) => (
        landing.id === selectedId
          ? { id: selectedId, ...hydrated }
          : landing
      )));
      if (result?.migratedToExternal) {
        alert(`Contenido publicado en el Firebase externo. El hub solo guarda dominio y credenciales de [${selectedId}].`);
      } else {
        alert(`¡Cambios guardados con éxito en la nube para [${selectedId}]!`);
      }
    } catch (error) {
      console.error(error);
      alert('No se pudieron guardar los cambios. Revisa la consola y las reglas de Firestore.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePage = async ({ pageId, name, specialty, vertical }) => {
    setCreatingPage(true);
    try {
      const created = await createPageInHub({ pageId, name, specialty, vertical });
      setLandings((current) => {
        const next = [{ id: pageId, ...created }, ...current.filter((item) => item.id !== pageId)];
        return next;
      });
      setAccessError('');
      setSelectedId(pageId);
      const hydrated = hydrateForm({ id: pageId, ...created });
      setFormData(hydrated);
      setEditingLanguage(normalizePageLanguage(hydrated.defaultLanguage ?? hydrated.labelLanguage));
      setLayoutBaseline(hydrated);
      setShowCreatePage(false);
    } finally {
      setCreatingPage(false);
    }
  };

  if (authLoading) {
    return <div className="h-screen flex items-center justify-center bg-gray-900 text-white font-sans text-sm tracking-widest uppercase animate-pulse">{t('common.verifyingAccess')}</div>;
  }

  if (!hasAccess) {
    const isOffline = authError === 'auth.offline';
    return (
      <div className="h-screen flex items-center justify-center bg-[#F4F1EA] p-6 font-sans">
        <div className="max-w-md bg-white border border-[#2A342D]/10 rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-end mb-2">
            <LanguageSwitcher className="text-[#2A342D]" />
          </div>
          <h1 className="font-serif text-2xl text-[#2A342D] mb-2">
            {isOffline ? t('common.offlineTitle') : t('common.unauthorizedTitle')}
          </h1>
          <p className="text-sm text-[#2A342D]/70 mb-6">
            {isOffline ? t('common.offlineBody') : t('common.unauthorizedBody')}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {isOffline && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="bg-[#4A5D4E] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#3d4d41]"
              >
                {t('common.retry')}
              </button>
            )}
            <button
              type="button"
              onClick={signOut}
              className={`${isOffline ? 'bg-white text-[#2A342D] border border-[#2A342D]/15' : 'bg-[#4A5D4E] text-white'} rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90`}
            >
              {t('common.signOut')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-900 text-white font-sans text-sm tracking-widest uppercase animate-pulse">{t('common.loadingSystem')}</div>;

  if (accessError && !formData && !canCreateNewPages) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F4F1EA] p-6 font-sans">
        <div className="max-w-md bg-white border border-[#2A342D]/10 rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-end mb-2">
            <LanguageSwitcher className="text-[#2A342D]" />
          </div>
          <h1 className="font-serif text-2xl text-[#2A342D] mb-2">{t('common.noPagesTitle')}</h1>
          <p className="text-sm text-[#2A342D]/70 mb-6">{accessError}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={openBilling}
              className="bg-[#4A5D4E] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#3d4d41]"
            >
              {t('common.billing')}
            </button>
            <button
              type="button"
              onClick={signOut}
              className="border border-[#2A342D]/20 text-[#2A342D] rounded-lg px-4 py-2 text-sm font-semibold hover:bg-white"
            >
              {t('common.signOut')}
            </button>
          </div>
        </div>
        <BillingPlansPanel open={showBilling} onClose={() => setShowBilling(false)} />
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-full max-w-full bg-gray-100 text-gray-800 overflow-hidden font-sans">
      {/* 1. BARRA LATERAL */}
      <div
        className={`bg-gray-950 text-white flex flex-col border-r border-gray-800 shrink-0 min-h-0 transition-[width] duration-200 ease-out ${
          pagesSidebarCollapsed ? 'w-14' : 'w-64'
        }`}
      >
        {pagesSidebarCollapsed ? (
          <div className="flex flex-col items-center gap-3 py-3 px-1.5 min-h-0 h-full">
            <button
              type="button"
              onClick={() => setSidebarCollapsed(false)}
              className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-200 hover:bg-indigo-600/40 transition flex items-center justify-center"
              title={t('shell.expandSidebar')}
              aria-label={t('shell.expandSidebar')}
              aria-expanded={false}
            >
              <span className="text-sm font-bold" aria-hidden>»</span>
            </button>
            <div
              className="w-10 h-10 rounded-full bg-indigo-600 text-white text-sm font-semibold flex items-center justify-center shrink-0"
              title={selectedPageLabel}
            >
              {selectedPageInitial}
            </div>
            <div className="flex-1" />
            <button
              type="button"
              onClick={openBilling}
              className="w-10 h-10 rounded-lg bg-emerald-700/40 text-emerald-100 hover:bg-emerald-600/60 text-[10px] font-bold"
              title={t('common.billing')}
              aria-label={t('common.billing')}
            >
              $
            </button>
            <button
              type="button"
              onClick={signOut}
              className="w-10 h-10 rounded-lg bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-700 text-[10px] font-semibold"
              title={t('common.exit')}
              aria-label={t('common.exit')}
            >
              ⎋
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="text-base font-bold tracking-tight text-indigo-400">{t('shell.title')}</h1>
                  <p className="text-[11px] text-gray-500">{t('shell.subtitle')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(true)}
                  className="shrink-0 w-8 h-8 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-900 hover:text-white transition flex items-center justify-center"
                  title={t('shell.collapseSidebar')}
                  aria-label={t('shell.collapseSidebar')}
                  aria-expanded={true}
                >
                  <span className="text-sm font-bold" aria-hidden>«</span>
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
                <p className="text-[10px] text-gray-400 truncate" title={user.email}>{user.email}</p>
                <p className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wide">{getRoleLabel(profile.role)}</p>
                {!entitlements.bypass && (
                  <p className="text-[10px] text-emerald-300/90 truncate">
                    {t('common.plan')}: {t(`billing.plans.${entitlements.planId}.name`)}
                  </p>
                )}
                <LanguageSwitcher className="text-gray-300" />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={openBilling}
                    className="flex-1 text-[10px] px-2 py-1.5 rounded bg-emerald-700/80 text-white hover:bg-emerald-600 border border-emerald-600 font-semibold"
                  >
                    {t('common.billing')}
                  </button>
                  {canCreateNewPages && (
                    <button
                      type="button"
                      onClick={() => setShowCreatePage(true)}
                      className="flex-1 text-[10px] px-2 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-500 font-semibold"
                    >
                      {t('common.newLanding')}
                    </button>
                  )}
                  {canManageUsers(profile) && (
                    <button
                      type="button"
                      onClick={() => setShowUserManagement(true)}
                      className="flex-1 text-[10px] px-2 py-1.5 rounded bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-700"
                    >
                      {t('common.users')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex-1 text-[10px] px-2 py-1.5 rounded bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-700"
                  >
                    {t('common.exit')}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="px-1 pb-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                {t('shell.pagesMenu')}
              </p>
              {canCreateNewPages && accessibleLandings.length === 0 && (
                <div className="mb-3 rounded-lg border border-indigo-500/30 bg-indigo-600/10 px-3 py-3">
                  <p className="text-[11px] text-indigo-100 mb-2">{t('shell.emptyLandings')}</p>
                  <button
                    type="button"
                    onClick={() => setShowCreatePage(true)}
                    className="w-full text-[11px] font-semibold px-2 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    {t('common.createLanding')}
                  </button>
                </div>
              )}
              {accessibleLandings.length === 0 && import.meta.env.DEV && canManageUsers(profile) && (
                <button
                  type="button"
                  onClick={selectDemoPreview}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${selectedId === DEMO_PREVIEW_ID ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-900'}`}
                >
                  <span>✨ {t('shell.demoPreview')}</span>
                  <span className="text-[9px] bg-black/40 px-1 rounded font-mono">{DEMO_PREVIEW_ID}</span>
                </button>
              )}
              {showPageList ? accessibleLandings.map(landing => (
                <button
                  key={landing.id}
                  type="button"
                  onClick={() => handleSelectLanding(landing)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${selectedId === landing.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-900'}`}
                >
                  <span>👤 {landing.name || landing.id}</span>
                  <span className="text-[9px] bg-black/40 px-1 rounded font-mono">{landing.id}</span>
                </button>
              )) : accessibleLandings[0] && (
                <div className="px-3 py-2.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30">
                  <p className="text-[10px] text-indigo-200 uppercase tracking-wide mb-1">{t('shell.yourPage')}</p>
                  <p className="text-xs font-medium text-white">{accessibleLandings[0].name || accessibleLandings[0].id}</p>
                  <p className="text-[9px] text-indigo-200/80 font-mono mt-1">{accessibleLandings[0].id}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 2. FORMULARIO */}
      <div className="w-5/12 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain p-6 bg-white border-r border-gray-200 shadow-inner">
        {editorData ? (
          <form onSubmit={handleSaveChanges} className="space-y-4">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Editor Editorial</h2>
                <p className="text-xs text-gray-500">
                  ID del Documento: {selectedId}
                  {isDemoPreview && ' · modo demo'}
                </p>
              </div>
              <button type="submit" disabled={saving || isDemoPreview || !canEditSelectedPage} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? t('common.saving') : isDemoPreview ? t('common.demoNoSave') : !canEditSelectedPage ? t('common.noPermission') : t('common.savePublish')}
              </button>
            </div>

            <EditorSection
              sectionKey="identity"
              fillStatus={getEditorSectionFill('identity', editorData)}
              title="Identidad y apariencia"
              description="Nombre, tipo de negocio, idioma, fondo y textos de respaldo"
              defaultOpen
              onActivate={activatePreviewSection}
            >
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase">Nombre Profesional</label>
                <input type="text" value={editorData.name || ''} onChange={e => handleEditorChange({...editorData, name: e.target.value})} className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none" />
              </div>
              <PageLanguagesEditor
                formData={formData}
                editingLanguage={editingLanguage}
                onEditingLanguageChange={setEditingLanguage}
                onChange={setFormData}
              />
              <VerticalFieldsEditor formData={editorData} onChange={handleEditorChange} />
              <PageAppearanceEditor formData={editorData} onChange={handleEditorChange} sections={['page']} />
              <LabelsFieldsEditor
                formData={editorData}
                onChange={handleEditorChange}
                groupIds={['placeholders']}
                showLanguagePicker={false}
                compact
                language={editingLanguage}
              />
            </EditorSection>

            <EditorSection
              sectionKey="nav"
              fillStatus={getEditorSectionFill('nav', editorData)}
              title="Navegación"
              description="Layout, menú, CTA y colores"
              onActivate={activatePreviewSection}
            >
              <NavFieldsEditor formData={editorData} onChange={handleEditorChange} pageId={selectedId} />
              <LabelsFieldsEditor formData={editorData} onChange={handleEditorChange} groupIds={['navigation']} showLanguagePicker={false} compact language={editingLanguage} />
            </EditorSection>

            {canManageLayout && (
              <EditorSection
                sectionKey="visibility"
                fillStatus={getEditorSectionFill('visibility', editorData)}
                title="Visibilidad de secciones"
                description="Activa o desactiva bloques (el navbar siempre queda)"
                onActivate={activatePreviewSection}
              >
                <SectionVisibilityFieldsEditor formData={editorData} onChange={handleEditorChange} />
              </EditorSection>
            )}

            {showEditorSection('preHeroEnabled', false) && (
              <EditorSection
                sectionKey="preHero"
                fillStatus={getEditorSectionFill('preHero', editorData)}
                title="Pre-hero"
                description="Bloque editorial antes del carrusel"
                onActivate={activatePreviewSection}
              >
                <PreHeroFieldsEditor
                  formData={editorData}
                  onChange={handleEditorChange}
                  pageId={selectedId}
                  canToggleSection={canManageLayout}
                />
                <LabelsFieldsEditor formData={editorData} onChange={handleEditorChange} groupIds={['preHero']} showLanguagePicker={false} compact language={editingLanguage} />
              </EditorSection>
            )}

            {showEditorSection('heroSectionEnabled', true) && (
              <EditorSection
                sectionKey="hero"
                fillStatus={getEditorSectionFill('hero', editorData)}
                title="Hero"
                description="Especialidad, diapositivas, colores y botones"
                defaultOpen={false}
                onActivate={activatePreviewSection}
              >
                <HeroSlidesEditor
                  slides={editorData.heroSlides || [createEmptySlide()]}
                  onChange={(heroSlides) => handleEditorChange({ ...editorData, heroSlides })}
                  pageId={selectedId}
                  formData={editorData}
                  onFormChange={handleEditorChange}
                />
                <LabelsFieldsEditor formData={editorData} onChange={handleEditorChange} groupIds={['hero']} showLanguagePicker={false} compact language={editingLanguage} />
              </EditorSection>
            )}

            {showEditorSection('aboutSectionEnabled', true) && (
              <EditorSection
                sectionKey="about"
                fillStatus={getEditorSectionFill('about', editorData)}
                title="Acerca de"
                description="Título, frase, texto descriptivo y colores"
                onActivate={activatePreviewSection}
              >
                <AboutFieldsEditor formData={editorData} onChange={handleEditorChange} />
              </EditorSection>
            )}

            {showEditorSection('servicesSectionEnabled', false) && (
              <EditorSection
                sectionKey="services"
                fillStatus={getEditorSectionFill('services', editorData)}
                title="Servicios"
                description="Áreas de atención, colores y etiquetas"
                onActivate={activatePreviewSection}
              >
                <ServicesFieldsEditor
                  formData={editorData}
                  onChange={handleEditorChange}
                  pageId={selectedId}
                  canToggleSection={canManageLayout}
                  canUseCarouselAutoplay={entitlements.canUseServicesCarouselAutoplay}
                  onUpgradePlan={openBilling}
                  upgradeLabel={upgradeLabel}
                />
                <LabelsFieldsEditor formData={editorData} onChange={handleEditorChange} groupIds={['services']} showLanguagePicker={false} compact language={editingLanguage} />
              </EditorSection>
            )}

            {showEditorSection('catalogSectionEnabled', false) && (
              <EditorSection
                sectionKey="catalog"
                fillStatus={getEditorSectionFill('catalog', editorData)}
                title="Catálogo"
                description="Productos o recursos, colores y etiquetas"
                onActivate={activatePreviewSection}
              >
                <CatalogFieldsEditor
                  formData={editorData}
                  onChange={handleEditorChange}
                  pageId={selectedId}
                  canToggleSection={canManageLayout}
                />
                <LabelsFieldsEditor formData={editorData} onChange={handleEditorChange} groupIds={['catalog']} showLanguagePicker={false} compact language={editingLanguage} />
              </EditorSection>
            )}

            {showEditorSection('gallerySectionEnabled', false) && (
              <EditorSection
                sectionKey="gallery"
                fillStatus={getEditorSectionFill('gallery', editorData)}
                title="Galería"
                description="Imágenes del espacio, colores y etiquetas"
                onActivate={activatePreviewSection}
              >
                <GalleryFieldsEditor
                  formData={editorData}
                  onChange={handleEditorChange}
                  pageId={selectedId}
                  canToggleSection={canManageLayout}
                  canUsePortfolioCta={entitlements.canUseGalleryPortfolio}
                  onUpgradePlan={openBilling}
                  upgradeLabel={upgradeLabel}
                />
                <LabelsFieldsEditor formData={editorData} onChange={handleEditorChange} groupIds={['gallery']} showLanguagePicker={false} compact language={editingLanguage} />
              </EditorSection>
            )}

            {showEditorSection('videoSectionEnabled', false) && (
              <EditorSection
                sectionKey="video"
                fillStatus={getEditorSectionFill('video', editorData)}
                title="Video"
                description="Sección de video y colores"
                onActivate={activatePreviewSection}
              >
                <VideoSectionFieldsEditor
                  formData={editorData}
                  onChange={handleEditorChange}
                  canToggleSection={canManageLayout}
                />
              </EditorSection>
            )}

            {showEditorSection('testimonialsEnabled', false) && (
              <EditorSection
                sectionKey="testimonials"
                fillStatus={getEditorSectionFill('testimonials', editorData)}
                title="Testimonios"
                description="Citas, colores y etiquetas"
                onActivate={activatePreviewSection}
              >
                <TestimonialsFieldsEditor
                  formData={editorData}
                  onChange={handleEditorChange}
                  pageId={selectedId}
                  canToggleSection={canManageLayout}
                />
                <LabelsFieldsEditor formData={editorData} onChange={handleEditorChange} groupIds={['testimonials']} showLanguagePicker={false} compact language={editingLanguage} />
              </EditorSection>
            )}

            {showEditorSection('blogSectionEnabled', false) && (
              <PlanGate
                allowed={entitlements.canUseBlog}
                label={upgradeLabel}
                onUpgrade={openBilling}
              >
                <EditorSection
                  sectionKey="blog"
                  fillStatus={getEditorSectionFill('blog', editorData)}
                  title="Blog / noticias"
                  description="Entradas con layouts, colores y etiquetas"
                  onActivate={activatePreviewSection}
                >
                  <BlogFieldsEditor
                    formData={editorData}
                    onChange={handleEditorChange}
                    pageId={selectedId}
                    canToggleSection={canManageLayout}
                  />
                  <LabelsFieldsEditor formData={editorData} onChange={handleEditorChange} groupIds={['blog']} showLanguagePicker={false} compact language={editingLanguage} />
                </EditorSection>
              </PlanGate>
            )}

            {showEditorSection('contactSectionEnabled', true) && (
              <EditorSection
                sectionKey="contact"
                fillStatus={getEditorSectionFill('contact', editorData)}
                title="Contacto"
                description="Ubicación, email, teléfono y etiquetas"
                onActivate={activatePreviewSection}
              >
                <LocationFieldsEditor
                  formData={editorData}
                  onChange={handleEditorChange}
                  canUseMapBeside={entitlements.canUseContactMapBeside}
                  onUpgradePlan={openBilling}
                  upgradeLabel={upgradeLabel}
                />
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase">Email Público</label>
                  <input type="email" value={editorData.email || ''} onChange={e => handleEditorChange({...editorData, email: e.target.value})} className="w-full border p-2.5 text-xs rounded-lg" />
                </div>
                <PhoneFieldsEditor formData={editorData} onChange={handleEditorChange} />
                <LabelsFieldsEditor formData={editorData} onChange={handleEditorChange} groupIds={['contact', 'messages']} showLanguagePicker={false} compact language={editingLanguage} />
              </EditorSection>
            )}

            {showEditorSection('socialSectionEnabled', true) && (
              <EditorSection
                sectionKey="social"
                fillStatus={getEditorSectionFill('social', editorData)}
                title="Redes sociales"
                description="Enlaces, colores y etiquetas"
                onActivate={activatePreviewSection}
              >
                <SocialFieldsEditor formData={editorData} onChange={handleEditorChange} />
                <LabelsFieldsEditor formData={editorData} onChange={handleEditorChange} groupIds={['social']} showLanguagePicker={false} compact language={editingLanguage} />
              </EditorSection>
            )}

            {(canManageLayout || hasActiveCustomEmbeds) && (
              <PlanGate
                allowed={entitlements.canUseCustomEmbeds}
                label={upgradeLabel}
                onUpgrade={openBilling}
              >
                <EditorSection
                  sectionKey="embeds"
                  fillStatus={getEditorSectionFill('embeds', editorData)}
                  title="Secciones personalizadas"
                  description="FAQ, formulario, CTA, texto, cita o código HTML"
                  onActivate={activatePreviewSection}
                >
                  <CustomEmbedsFieldsEditor
                    formData={editorData}
                    onChange={handleEditorChange}
                    canManageLayout={canManageLayout}
                    pageId={selectedId}
                  />
                </EditorSection>
              </PlanGate>
            )}

            <EditorSection
              sectionKey="footer"
              fillStatus={getEditorSectionFill('footer', editorData)}
              title="Hosting, analytics y pie"
              description="Dominio, Firebase externo, GA4, documentos legales y colores del footer"
              onActivate={activatePreviewSection}
            >
              {canManageHosting && (
                <SiteHostingFieldsEditor
                  formData={editorData}
                  onChange={handleEditorChange}
                  pageId={selectedId}
                  canUseExternalFirebase={entitlements.canUseExternalFirebase}
                  canUseHostingDeploy={entitlements.canUseHostingDeploy}
                  onUpgradePlan={openBilling}
                  upgradeLabel={upgradeLabel}
                />
              )}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase">Google Analytics (GA4)</label>
                <p className="text-[10px] text-gray-400">
                  ID de medición (ej. G-XXXXXXXX). Si lo dejas vacío, se usará el de <code className="bg-gray-100 px-1 rounded">VITE_FIREBASE_MEASUREMENT_ID</code> del deploy.
                </p>
                <input
                  type="text"
                  value={editorData.analyticsMeasurementId || ''}
                  onChange={(e) => handleEditorChange({ ...editorData, analyticsMeasurementId: e.target.value.trim() })}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>
              <LegalDocumentsFieldsEditor formData={editorData} onChange={handleEditorChange} />
              <PageAppearanceEditor formData={editorData} onChange={handleEditorChange} sections={['footer']} />
              <LabelsFieldsEditor formData={editorData} onChange={handleEditorChange} groupIds={['footer']} showLanguagePicker={false} compact language={editingLanguage} />
            </EditorSection>
          </form>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs gap-3 px-6 text-center">
            <p>Selecciona un sitio de la izquierda para comenzar a editar.</p>
            {canCreateNewPages && (
              <button
                type="button"
                onClick={() => setShowCreatePage(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700"
              >
                + Crear primera landing
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. SIMULADOR DE VISTA PREVIA */}
      <div className="flex-1 min-h-0 min-w-0 bg-gray-200 p-6 flex flex-col overflow-hidden">
        <div className="w-full min-w-0 flex justify-between items-center mb-4 shrink-0 gap-3 overflow-x-auto">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Monitor de Aspecto en Vivo</span>
          <div className="flex items-center gap-2">
            <div className="bg-white p-1 rounded-lg shadow-sm border text-[11px] font-medium space-x-1">
              <button type="button" onClick={() => setPreviewSource('mirror')} className={`px-2.5 py-1 rounded-md transition ${previewSource === 'mirror' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Espejo</button>
              <button type="button" onClick={() => setPreviewSource('local')} disabled={!TEMPLATE_PREVIEW_URL} className={`px-2.5 py-1 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed ${previewSource === 'local' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Local</button>
            </div>
            <div className="bg-white p-1 rounded-lg shadow-sm border text-[11px] font-medium space-x-1">
              <button type="button" onClick={() => setDeviceView('desktop')} className={`px-2.5 py-1 rounded-md transition ${deviceView === 'desktop' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Escritorio</button>
              <button type="button" onClick={() => setDeviceView('mobile')} className={`px-2.5 py-1 rounded-md transition ${deviceView === 'mobile' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Móvil</button>
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

        <div className={`bg-white shadow-2xl transition-all duration-300 overflow-hidden flex-1 min-h-0 rounded-xl border border-gray-300 ${deviceView === 'mobile' ? 'w-[360px] max-h-[640px] mx-auto' : 'w-full'}`}>
          {!formData ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs bg-white">Ningún sitio seleccionado para previsualización.</div>
          ) : previewSource === 'mirror' ? (
            <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
              <LandingMirror
                previewData={formData}
                previewSeed={selectedId}
                language={editingLanguage}
                scrollSectionId={previewScrollSectionId}
              />
            </div>
          ) : !TEMPLATE_PREVIEW_URL ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs bg-white p-6 text-center">
              Configura <code className="mx-1 text-[10px] bg-gray-100 px-1 rounded">VITE_TEMPLATE_PREVIEW_URL</code> en <code className="mx-1 text-[10px] bg-gray-100 px-1 rounded">.env.local</code> para usar la vista local.
            </div>
          ) : (
            <iframe
              ref={previewIframeRef}
              key={localPreviewUrl}
              title={`Vista previa local de ${selectedId}`}
              src={localPreviewUrl}
              onLoad={postPreviewUpdate}
              className="w-full h-full border-0 bg-white"
            />
          )}
        </div>
      </div>

      {showUserManagement && (
        <UserManagement
          pageOptions={landings}
          onClose={() => setShowUserManagement(false)}
        />
      )}

      <CreatePageModal
        open={showCreatePage}
        creating={creatingPage}
        onClose={() => setShowCreatePage(false)}
        onCreate={handleCreatePage}
      />

      <BillingPlansPanel open={showBilling} onClose={() => setShowBilling(false)} />
    </div>
  );
}
