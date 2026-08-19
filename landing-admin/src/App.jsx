import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listPageDocuments } from './utils/firestoreAccess';
import { db } from './firebase';
import { createEmptySlide } from './utils/heroSlides';
import { hydratePageForm } from './utils/pageModel';
import HeroSlidesEditor from './components/HeroSlidesEditor';
import SocialFieldsEditor from './components/SocialFieldsEditor';
import QrCodesSection from './components/QrCodesSection';
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
import ShowContentToggle from './components/ShowContentToggle';
import DevicePreviewPanel from './components/DevicePreviewPanel';
import { resolvePreviewSectionId } from './utils/sectionAnchors';
import SiteHostingFieldsEditor from './components/SiteHostingFieldsEditor';
import UserManagement from './components/UserManagement';
import CreatePageModal from './components/CreatePageModal';
import MetaImportPanel, { META_IMPORT_UI_ENABLED } from './components/MetaImportPanel';
import PageStructureAssistSection from './components/PageStructureAssistSection';
import VerticalFieldsEditor from './components/VerticalFieldsEditor';
import BillingPlansPanel from './components/BillingPlansPanel';
import PlanGate from './components/PlanGate';
import SubscriptionHealthCard from './components/SubscriptionHealthCard';
import AdminFreeTierAdsBanner from './components/AdminFreeTierAdsBanner';
import SavePublishAdGate from './components/SavePublishAdGate';
import AiQuotaBadge from './components/AiQuotaBadge';
import MarketingSiteFieldsEditor from './components/MarketingSiteFieldsEditor';
import MarketingRoutesEditor from './components/MarketingRoutesEditor';
import { hydrateFormSocial } from './utils/socialLinks';
import { loadPageForEditor, savePageFromEditor } from './utils/pageRepository';
import { resolvePageOpenUrl } from './utils/pageOpenUrl';
import { createCmsPageRemote } from './utils/aiAssistFunctions';
import { recordPageAuditRemote } from './utils/inboxFunctions';
import { useAuth } from './contexts/AuthContext';
import { useLocale, LanguageSwitcher } from './i18n/LocaleContext';
import { useEntitlements } from './hooks/useEntitlements';
import { useInboxNotifications } from './hooks/useInboxNotifications';
import {
  canCreatePages,
  canEditPage,
  canManageCmsTickets,
  canManagePageLayout,
  canManageUsers,
  canUseCmsInbox,
  canViewPagesOverview,
  filterAccessiblePages,
  getAccessiblePageIds,
  getRoleLabel,
  isSinglePageUser,
} from './utils/permissions';
import { applyLockedPageLayout } from './utils/layoutLock';
import { isFlagEnabled } from './utils/sectionVisibility';
import { normalizeCustomEmbeds } from './utils/customEmbeds';
import { getEditorSectionFill } from './utils/editorSectionFill';
import PageAuditSection from './components/PageAuditSection';
import {
  normalizePageLanguage,
  resolvePageLanguage,
  updatePageTranslation,
} from '@raulizqli/landing-core/pageTranslations';
import { isMarketingSite, normalizeMarketingRoutes } from '@raulizqli/landing-core/marketingSite';
import { applyMetaDraftToPage } from '@raulizqli/landing-core/metaImport';
import { buildPageAuditSnapshot } from '@raulizqli/landing-core/pageAudit';
import { syncDomainIndexesRemote } from './utils/domainFunctions';
const DEMO_PREVIEW_ID = 'preview-demo';
const SIDEBAR_COLLAPSED_KEY = 'landing-admin:pages-sidebar-collapsed';
const PREVIEW_HIDDEN_KEY = 'landing-admin:preview-panel-hidden';

function readStoredFlag(key, fallback) {
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === '0' || stored === 'false') return false;
    if (stored === '1' || stored === 'true') return true;
  } catch {
    // ignore
  }
  return fallback;
}

function persistStoredFlag(key, value) {
  try {
    window.localStorage.setItem(key, value ? '1' : '0');
  } catch {
    // ignore
  }
}

function readSidebarCollapsedDefault() {
  // Start minimized so editor/preview get more room (especially single-page users).
  return readStoredFlag(SIDEBAR_COLLAPSED_KEY, true);
}

function hydrateForm(landing) {
  return hydrateFormSocial(hydratePageForm(landing));
}

export default function App() {
  const {
    user,
    profile,
    loading: authLoading,
    signOut,
    hasAccess,
    authError,
    refreshProfile,
    refreshBillingAccount,
  } = useAuth();
  const { t } = useLocale();
  const entitlements = useEntitlements();
  const { unreadCount: inboxUnreadCount } = useInboxNotifications({ pollMs: 90000 });
  const [searchParams, setSearchParams] = useSearchParams();
  const [landings, setLandings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState(null);
  const [editingLanguage, setEditingLanguage] = useState('es');
  const [layoutBaseline, setLayoutBaseline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewSectionKey, setPreviewSectionKey] = useState('identity');
  const [heroEditorOpen, setHeroEditorOpen] = useState(false);
  const [heroPreviewSlideIndex, setHeroPreviewSlideIndex] = useState(0);
  const [previewDeviceView, setPreviewDeviceView] = useState('desktop');
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [showSaveAdGate, setShowSaveAdGate] = useState(false);
  const [creatingPage, setCreatingPage] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [pagesSidebarCollapsed, setPagesSidebarCollapsed] = useState(readSidebarCollapsedDefault);
  const [previewPanelHidden, setPreviewPanelHiddenState] = useState(() => (
    readStoredFlag(PREVIEW_HIDDEN_KEY, false)
  ));
  const [activeMarketingRouteId, setActiveMarketingRouteId] = useState('');

  const accessibleLandings = profile ? filterAccessiblePages(landings, profile) : [];
  const showPageList = !isSinglePageUser(profile);
  const showPagesOverviewLink = canViewPagesOverview(profile);

  const setSidebarCollapsed = (collapsed) => {
    setPagesSidebarCollapsed(collapsed);
    persistStoredFlag(SIDEBAR_COLLAPSED_KEY, collapsed);
  };

  const setPreviewPanelHidden = (hidden) => {
    setPreviewPanelHiddenState(hidden);
    persistStoredFlag(PREVIEW_HIDDEN_KEY, hidden);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      setPagesSidebarCollapsed(true);
    }
  }, []);

  const canEditSelectedPage = canEditPage(profile, selectedId);
  const canCreateNewPages = canCreatePages(profile, { user, entitlements });
  const canManageLayout = canManagePageLayout(profile, {
    user,
    billingAccount: entitlements.account,
    entitlements,
  });
  const previewScrollSectionId = resolvePreviewSectionId(previewSectionKey);
  const lockedHeroSlideIndex = heroEditorOpen && previewSectionKey === 'hero'
    ? heroPreviewSlideIndex
    : null;
  const upgradeLabel = t('common.upgrade');
  const openBilling = () => setShowBilling(true);

  const editorData = useMemo(
    () => (formData
      ? resolvePageLanguage(formData, editingLanguage, { fallback: false })
      : null),
    [formData, editingLanguage],
  );

  const pageOpenUrl = resolvePageOpenUrl({
    pageId: selectedId,
    hostingPublicUrl: formData?.hostingPublicUrl,
    customDomain: formData?.customDomain,
    language: editingLanguage,
  });

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

  const activatePreviewSection = useCallback((sectionKey, meta = {}) => {
    if (meta.open === false) {
      if (sectionKey === 'hero') setHeroEditorOpen(false);
      return;
    }
    setPreviewSectionKey(sectionKey);
    setHeroEditorOpen(sectionKey === 'hero');
  }, []);

  const selectLanding = async (landing, { syncUrl = true } = {}) => {
    if (!canEditPage(profile, landing.id)) {
      alert('No tienes permiso para editar esta página.');
      return;
    }

    setSelectedId(landing.id);
    setHeroPreviewSlideIndex(0);
    setHeroEditorOpen(false);
    if (syncUrl && landing.id !== DEMO_PREVIEW_ID) {
      setSearchParams({ pageId: landing.id }, { replace: true });
    } else if (syncUrl && landing.id === DEMO_PREVIEW_ID) {
      setSearchParams({}, { replace: true });
    }

    if (landing.id === DEMO_PREVIEW_ID) {
      const hydrated = hydrateForm(landing);
      setFormData(hydrated);
      setEditingLanguage(normalizePageLanguage(hydrated.defaultLanguage ?? hydrated.labelLanguage));
      setLayoutBaseline(hydrated);
      setActiveMarketingRouteId(normalizeMarketingRoutes(hydrated.marketingRoutes)[0]?.id || '');
      return;
    }
    try {
      const data = await loadPageForEditor(landing.id, landing);
      const hydrated = hydrateForm({ id: landing.id, ...data });
      setFormData(hydrated);
      setEditingLanguage(normalizePageLanguage(hydrated.defaultLanguage ?? hydrated.labelLanguage));
      setLayoutBaseline(hydrated);
      setActiveMarketingRouteId(normalizeMarketingRoutes(hydrated.marketingRoutes)[0]?.id || '');
    } catch (error) {
      console.error('Error al cargar la landing:', error);
      const hydrated = hydrateForm(landing);
      setFormData(hydrated);
      setEditingLanguage(normalizePageLanguage(hydrated.defaultLanguage ?? hydrated.labelLanguage));
      setLayoutBaseline(hydrated);
      setActiveMarketingRouteId(normalizeMarketingRoutes(hydrated.marketingRoutes)[0]?.id || '');
    }
  };

  const selectDemoPreview = () => {
    selectLanding({ id: DEMO_PREVIEW_ID });
  };

  const reloadSelectedFromCloud = async () => {
    if (!selectedId || selectedId === DEMO_PREVIEW_ID || !formData) return;
    if (!window.confirm(t('common.reloadFromCloudConfirm'))) return;
    try {
      const meta = landings.find((page) => page.id === selectedId) || { id: selectedId };
      const loaded = await loadPageForEditor(selectedId, meta);
      const hydrated = hydrateForm({ id: selectedId, ...loaded });
      setFormData(hydrated);
      setEditingLanguage(normalizePageLanguage(hydrated.defaultLanguage ?? hydrated.labelLanguage));
      setLayoutBaseline(hydrated);
      setActiveMarketingRouteId(normalizeMarketingRoutes(hydrated.marketingRoutes)[0]?.id || '');
      setLandings((current) => current.map((landing) => (
        landing.id === selectedId ? { id: selectedId, ...hydrated } : landing
      )));
    } catch (error) {
      console.error('Error al recargar la landing:', error);
      alert(t('common.reloadFromCloudError'));
    }
  };

  useEffect(() => {
    if (authLoading || !user || !profile) return;

    const loadLandings = async () => {
      setLoading(true);
      setAccessError('');

      try {
        const allowedIds = getAccessiblePageIds(profile);
        const list = allowedIds === null
          ? await listPageDocuments(db)
          : await listPageDocuments(db, { pageIds: allowedIds });
        setLandings(list);

        // Root: heal domainIndex after F03 Step B so custom domains keep resolving.
        if (allowedIds === null) {
          void syncDomainIndexesRemote().catch((error) => {
            console.warn('domainIndex sync skipped:', error?.message || error);
          });
        }

        const allowed = filterAccessiblePages(list, profile);
        const requestedId = String(searchParams.get('pageId') ?? '').trim();
        const requested = requestedId
          ? allowed.find((page) => page.id === requestedId)
          : null;

        if (requested) {
          setSelectedId(requested.id);
          const loaded = await loadPageForEditor(requested.id, requested);
          const hydrated = hydrateForm({ id: requested.id, ...loaded });
          setFormData(hydrated);
          setEditingLanguage(normalizePageLanguage(hydrated.defaultLanguage ?? hydrated.labelLanguage));
          setLayoutBaseline(hydrated);
          setActiveMarketingRouteId(normalizeMarketingRoutes(hydrated.marketingRoutes)[0]?.id || '');
        } else if (allowed.length > 0) {
          const first = allowed[0];
          setSelectedId(first.id);
          if (requestedId && requestedId !== first.id) {
            setSearchParams({ pageId: first.id }, { replace: true });
          } else if (!requestedId) {
            setSearchParams({ pageId: first.id }, { replace: true });
          }
          const loaded = await loadPageForEditor(first.id, first);
          const hydrated = hydrateForm({ id: first.id, ...loaded });
          setFormData(hydrated);
          setEditingLanguage(normalizePageLanguage(hydrated.defaultLanguage ?? hydrated.labelLanguage));
          setLayoutBaseline(hydrated);
          setActiveMarketingRouteId(normalizeMarketingRoutes(hydrated.marketingRoutes)[0]?.id || '');
        } else if (canCreatePages(profile, { user, entitlements })) {
          // Owner/root with empty list: stay in the editor shell and create the first landing.
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
        if (canCreatePages(profile, { user, entitlements })) {
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
    // Only re-run on auth/profile; pageId deep-link is read once at load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, authLoading]);

  const handleSelectLanding = async (landing) => {
    await selectLanding(landing);
  };

  const isDemoPreview = selectedId === DEMO_PREVIEW_ID;

  const performSaveChanges = async () => {
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
      const beforeSnapshot = buildPageAuditSnapshot(layoutBaseline || formData || {});
      let dataToSave = canManageLayout || !layoutBaseline
        ? formData
        : applyLockedPageLayout(formData, layoutBaseline);
      if (isMarketingSite(dataToSave) && !entitlements.canUseMarketingSite) {
        alert('Marketing Site requiere Enterprise o el add-on Agency. Se guardará como landing clásica.');
        dataToSave = { ...dataToSave, siteMode: 'landing' };
      }
      const result = await savePageFromEditor(selectedId, dataToSave);
      try {
        await recordPageAuditRemote({
          pageId: selectedId,
          before: beforeSnapshot,
          action: 'page_update',
          notify: true,
        });
      } catch (auditError) {
        console.warn('page audit skipped:', auditError?.message || auditError);
      }
      const hydrated = hydrateForm({
        id: selectedId,
        ...dataToSave,
        marketingRoutes: result?.marketingRoutes || dataToSave.marketingRoutes,
        seoArtifacts: result?.seoArtifacts || dataToSave.seoArtifacts,
      });
      setFormData(hydrated);
      setLayoutBaseline(hydrated);
      setLandings((current) => current.map((landing) => (
        landing.id === selectedId
          ? { id: selectedId, ...hydrated }
          : landing
      )));
      const seoNote = result?.seoArtifacts?.baseUrl
        ? `\nSEO: ${result.seoArtifacts.baseUrl}/sitemap.xml · /rss.xml · /robots.txt`
        : '';
      if (result?.migratedToExternal) {
        alert(`Contenido publicado en el Firebase externo. El hub solo guarda dominio y credenciales de [${selectedId}].${seoNote}`);
      } else {
        alert(`¡Cambios guardados con éxito en la nube para [${selectedId}]!${seoNote}`);
      }
    } catch (error) {
      console.error(error);
      alert('No se pudieron guardar los cambios. Revisa la consola y las reglas de Firestore.');
    } finally {
      setSaving(false);
    }
  };

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
    if (entitlements.freeTier && !entitlements.bypass) {
      setShowSaveAdGate(true);
      return;
    }
    await performSaveChanges();
  };

  const handleSaveAdComplete = async () => {
    setShowSaveAdGate(false);
    await performSaveChanges();
  };

  const handleCreatePage = async ({ pageId, name, specialty, vertical, draft = null }) => {
    setCreatingPage(true);
    try {
      const response = await createCmsPageRemote({
        pageId,
        name,
        specialty,
        vertical,
        draft,
      });
      const created = response?.page || { id: pageId, name, specialty, vertical };
      setLandings((current) => {
        const next = [{ id: pageId, ...created }, ...current.filter((item) => item.id !== pageId)];
        return next;
      });
      setAccessError('');
      setSelectedId(pageId);
      setSearchParams({ pageId }, { replace: true });
      const loaded = await loadPageForEditor(pageId, created);
      const hydrated = hydrateForm({ id: pageId, ...loaded });
      setFormData(hydrated);
      setEditingLanguage(normalizePageLanguage(hydrated.defaultLanguage ?? hydrated.labelLanguage));
      setLayoutBaseline(hydrated);
      setShowCreatePage(false);
      try {
        // Profile must refresh so assignedPageIds/pageId unlock list + Guardar (Agency first page).
        await refreshProfile?.();
      } catch (error) {
        console.warn('Could not refresh profile after create:', error);
        try {
          await refreshBillingAccount?.();
        } catch (billingError) {
          console.warn('Could not refresh billing after create:', billingError);
        }
      }
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
    <div className="relative flex h-dvh w-full max-w-full flex-col bg-gray-100 text-gray-800 overflow-hidden font-sans">
      {entitlements.freeTier ? (
        <AdminFreeTierAdsBanner onUpgrade={openBilling} />
      ) : null}
      <div className="relative flex min-h-0 flex-1 max-lg:pb-11">
      {/* 1. BARRA LATERAL */}
      <div
        className={`bg-gray-950 text-white flex flex-col border-r border-gray-800 shrink-0 min-h-0 overflow-hidden transition-[width] duration-200 ease-out ${
          pagesSidebarCollapsed ? 'w-0 border-r-0' : 'w-64'
        }`}
        aria-hidden={pagesSidebarCollapsed}
      >
        {!pagesSidebarCollapsed ? (
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
                <AiQuotaBadge>
                  <p className="text-[10px] text-gray-400 truncate" title={user.email}>{user.email}</p>
                  <p className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wide">{getRoleLabel(profile.role)}</p>
                </AiQuotaBadge>
                <SubscriptionHealthCard
                  health={entitlements.health}
                  planName={t(`billing.plans.${entitlements.planId}.name`)}
                  onOpenBilling={openBilling}
                />
                <LanguageSwitcher className="text-gray-300" />
                <div className="flex flex-wrap gap-2">
                  {showPagesOverviewLink && (
                    <Link
                      to="/app/pages"
                      className="flex-1 text-center text-[10px] px-2 py-1.5 rounded bg-gray-900 text-indigo-200 hover:bg-gray-800 border border-indigo-500/40 font-semibold"
                    >
                      {t('pagesOverview.navLabel')}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={openBilling}
                    className={`flex-1 text-[10px] px-2 py-1.5 rounded text-white border font-semibold ${
                      entitlements.freeTier
                        ? 'bg-amber-700/90 hover:bg-amber-600 border-amber-600'
                        : 'bg-emerald-700/80 hover:bg-emerald-600 border-emerald-600'
                    }`}
                  >
                    {t('common.billing')}
                  </button>
                  {canCreateNewPages && (
                    <button
                      type="button"
                      onClick={() => setShowCreatePage(true)}
                      className="flex-1 text-[10px] px-2 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-500 font-semibold"
                      title={entitlements.pageLimit == null
                        ? undefined
                        : `${entitlements.pageCount} / ${entitlements.pageLimit}`}
                    >
                      {t('common.newLanding')}
                      {entitlements.pageLimit != null && (
                        <span className="ml-1 opacity-80">
                          ({entitlements.pageCount}/{entitlements.pageLimit})
                        </span>
                      )}
                    </button>
                  )}
                  {canUseCmsInbox(profile, user?.uid) && (
                    <Link
                      to="/app/inbox"
                      className="flex-1 text-[10px] px-2 py-1.5 rounded bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-700 text-center font-semibold relative"
                    >
                      Inbox
                      {inboxUnreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center">
                          {inboxUnreadCount > 99 ? '99+' : inboxUnreadCount}
                        </span>
                      )}
                    </Link>
                  )}
                  {canManageCmsTickets(profile) && (
                    <Link
                      to="/app/tickets"
                      className="flex-1 text-[10px] px-2 py-1.5 rounded bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-700 text-center font-semibold"
                    >
                      Tickets
                    </Link>
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
                  <span className="min-w-0 truncate">
                    {isMarketingSite(landing) ? '◈ ' : '👤 '}
                    {landing.name || landing.id}
                  </span>
                  <span className="text-[9px] bg-black/40 px-1 rounded font-mono shrink-0">{landing.id}</span>
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
        ) : null}
      </div>

      {pagesSidebarCollapsed ? (
        <button
          type="button"
          onClick={() => setSidebarCollapsed(false)}
          className="absolute left-0 top-1/2 z-30 -translate-y-1/2 flex h-16 w-6 items-center justify-center rounded-r-lg border border-l-0 border-indigo-500/50 bg-gray-950 text-indigo-200 shadow-lg hover:bg-indigo-900/80 hover:text-white transition"
          title={t('shell.expandSidebar')}
          aria-label={t('shell.expandSidebar')}
          aria-expanded={false}
        >
          <span className="text-xs font-bold" aria-hidden>»</span>
        </button>
      ) : null}

      {/* 2. FORMULARIO */}
      <div className={`min-w-0 min-h-0 flex flex-col overflow-hidden bg-white border-r border-gray-200 shadow-inner max-lg:!grow max-lg:!shrink max-lg:!basis-0 transition-[flex-grow,flex-basis] duration-500 ease-in-out ${
        previewPanelHidden || previewDeviceView === 'mobile'
          ? 'grow shrink basis-0'
          : 'grow-0 shrink-0 basis-[41.666667%]'
      }`}>
        {editorData ? (
          <form onSubmit={handleSaveChanges} className="flex flex-col h-full min-h-0">
            <div className="shrink-0 z-20 px-6 pt-4 pb-3 max-sm:px-3 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900">Editor Editorial</h2>
                <p className="text-xs text-gray-500 truncate">
                  ID del Documento: {selectedId}
                  {isDemoPreview && ' · modo demo'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                {pageOpenUrl && !isDemoPreview && (
                  <a
                    href={pageOpenUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t('common.openPageTitle')}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    {t('common.openPage')} ↗
                  </a>
                )}
                {!isDemoPreview && (
                  <button
                    type="button"
                    disabled={saving || !canEditSelectedPage}
                    onClick={reloadSelectedFromCloud}
                    title={t('common.reloadFromCloudTitle')}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('common.reloadFromCloud')}
                  </button>
                )}
                {previewPanelHidden ? (
                  <button
                    type="button"
                    onClick={() => setPreviewPanelHidden(false)}
                    title={t('shell.showLivePreview')}
                    className="hidden lg:inline-flex items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    {t('shell.showLivePreview')}
                  </button>
                ) : null}
                <button type="submit" disabled={saving || isDemoPreview || !canEditSelectedPage} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto shrink-0">
                  {saving ? t('common.saving') : isDemoPreview ? t('common.demoNoSave') : !canEditSelectedPage ? t('common.noPermission') : t('common.savePublish')}
                </button>
              </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-6 py-4 max-sm:px-3 space-y-4">
            <EditorSection
              sectionKey="structure-ai"
              title={t('ai.structure.sectionTitle')}
              description={t('ai.structure.sectionDescription')}
              onActivate={activatePreviewSection}
            >
              <PageStructureAssistSection
                formData={editorData}
                onChange={handleEditorChange}
                pageId={selectedId}
              />
            </EditorSection>

            {META_IMPORT_UI_ENABLED ? (
            <EditorSection
              sectionKey="metaImport"
              fillStatus={getEditorSectionFill('metaImport', editorData)}
              title="Facebook / Instagram"
              description="Importa o recarga nombre, fotos y datos públicos de tu Página de Facebook o Instagram profesional."
              onActivate={activatePreviewSection}
            >
              <PlanGate
                allowed={entitlements.canUseMetaImport}
                label={upgradeLabel}
                onUpgrade={openBilling}
                lockedTitle={t('billing.features.metaImport')}
                lockedDescription={t('billing.features.metaImportLocked')}
                lockedBenefits={[
                  'Importa nombre, fotos y datos públicos de tu Página',
                  'Recarga cuando cambies algo en Facebook o Instagram',
                  'Disponible desde el plan Pro',
                ]}
              >
                <MetaImportPanel
                  connectedSource={editorData.metaSource}
                  disabled={saving || isDemoPreview || !canEditSelectedPage}
                  onImported={({ draft, source }) => {
                    handleEditorChange(applyMetaDraftToPage(editorData, { draft, source }));
                  }}
                />
              </PlanGate>
            </EditorSection>
            ) : null}

            <EditorSection
              sectionKey="identity"
              fillStatus={getEditorSectionFill('identity', editorData)}
              title="Identidad y apariencia"
              description="Quién eres en la página: nombre, tipo de negocio, idioma y el estilo visual general."
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
              <VerticalFieldsEditor formData={editorData} onChange={handleEditorChange} language={editingLanguage} />
              <PageAppearanceEditor formData={editorData} onChange={handleEditorChange} sections={['page']} />
              <LabelsFieldsEditor
                key={`labels-placeholders-${editingLanguage}`}
                formData={editorData}
                onChange={handleEditorChange}
                groupIds={['placeholders']}
                showLanguagePicker={false}
                compact
                language={editingLanguage}
              />
            </EditorSection>

            <EditorSection
              sectionKey="marketing-site"
              fillStatus={isMarketingSite(editorData) ? 'complete' : 'empty'}
              title="Marketing Site (Enterprise)"
              description="Sitio de varias páginas (inicio, servicios, contacto). La vista previa muestra cada ruta en el monitor."
              onActivate={activatePreviewSection}
            >
              <MarketingSiteFieldsEditor
                formData={formData}
                onChange={setFormData}
                canUseMarketingSite={entitlements.canUseMarketingSite}
                onUpgrade={() => setShowBilling(true)}
                pageId={selectedId}
              />
              {isMarketingSite(formData) && (
                <div className="mt-4">
                  <MarketingRoutesEditor
                    formData={formData}
                    onChange={setFormData}
                    activeRouteId={activeMarketingRouteId}
                    onSelectRoute={setActiveMarketingRouteId}
                  />
                </div>
              )}
            </EditorSection>

            <EditorSection
              sectionKey="nav"
              fillStatus={getEditorSectionFill('nav', editorData)}
              title="Navegación"
              description="Barra superior de la landing: logo o foto, menú y el botón de contacto."
              onActivate={activatePreviewSection}
            >
              <NavFieldsEditor
                formData={editorData}
                onChange={handleEditorChange}
                pageId={selectedId}
                onUpgradePlan={openBilling}
                upgradeLabel={upgradeLabel}
              />
              <LabelsFieldsEditor key={`labels-navigation-${editingLanguage}`} formData={editorData} onChange={handleEditorChange} groupIds={['navigation']} showLanguagePicker={false} compact language={editingLanguage} />
            </EditorSection>

            {canManageLayout && (
              <EditorSection
                sectionKey="visibility"
                fillStatus={getEditorSectionFill('visibility', editorData)}
                title="Visibilidad de secciones"
                description="Activa o desactiva qué bloques se ven en la landing. La barra de navegación siempre queda."
                onActivate={activatePreviewSection}
              >
                <SectionVisibilityFieldsEditor formData={editorData} onChange={handleEditorChange} />
              </EditorSection>
            )}

            {showEditorSection('preHeroEnabled', false) && (
              <EditorSection
                sectionKey="preHero"
                fillStatus={getEditorSectionFill('preHero', editorData)}
                title="Sección principal"
                description="Primera impresión al entrar: una imagen o foto con título y texto, encima del carrusel."
                onActivate={activatePreviewSection}
              >
                <PreHeroFieldsEditor
                  formData={editorData}
                  onChange={handleEditorChange}
                  pageId={selectedId}
                  canToggleSection={canManageLayout}
                />
                <LabelsFieldsEditor key={`labels-preHero-${editingLanguage}`} formData={editorData} onChange={handleEditorChange} groupIds={['preHero']} showLanguagePicker={false} compact language={editingLanguage} />
              </EditorSection>
            )}

            {showEditorSection('heroSectionEnabled', true) && (
              <EditorSection
                sectionKey="hero"
                fillStatus={getEditorSectionFill('hero', editorData)}
                title="Diapositivas carrusel"
                description="Carrusel de fotos o videos con texto y botones. Puedes añadir varias diapositivas."
                onActivate={activatePreviewSection}
              >
                <HeroSlidesEditor
                  slides={editorData.heroSlides || [createEmptySlide()]}
                  onChange={(heroSlides) => handleEditorChange({ ...editorData, heroSlides })}
                  pageId={selectedId}
                  formData={editorData}
                  onFormChange={handleEditorChange}
                  onActiveSlideChange={setHeroPreviewSlideIndex}
                />
                <LabelsFieldsEditor key={`labels-hero-${editingLanguage}`} formData={editorData} onChange={handleEditorChange} groupIds={['hero']} showLanguagePicker={false} compact language={editingLanguage} />
              </EditorSection>
            )}

            {showEditorSection('aboutSectionEnabled', true) && (
              <EditorSection
                sectionKey="about"
                fillStatus={getEditorSectionFill('about', editorData)}
                title="Acerca de"
                description="Preséntate: una frase corta y un texto más largo sobre ti o el negocio."
                onActivate={activatePreviewSection}
              >
                <AboutFieldsEditor
                  formData={editorData}
                  onChange={handleEditorChange}
                  language={editingLanguage}
                  pageId={selectedId}
                />
              </EditorSection>
            )}

            {showEditorSection('servicesSectionEnabled', false) && (
              <EditorSection
                sectionKey="services"
                fillStatus={getEditorSectionFill('services', editorData)}
                title="Servicios"
                description="Lo que ofreces: consultas, tratamientos, paquetes u otros servicios."
                onActivate={activatePreviewSection}
              >
                <ServicesFieldsEditor
                  formData={editorData}
                  onChange={handleEditorChange}
                  pageId={selectedId}
                  canToggleSection={canManageLayout}
                  canUseCarouselAutoplay={entitlements.canUseServicesCarouselAutoplay}
                  canUseCustomVisualStyle={entitlements.canUseCustomSectionVisualStyle}
                  onUpgradePlan={openBilling}
                  upgradeLabel={upgradeLabel}
                />
                <LabelsFieldsEditor key={`labels-services-${editingLanguage}`} formData={editorData} onChange={handleEditorChange} groupIds={['services']} showLanguagePicker={false} compact language={editingLanguage} />
              </EditorSection>
            )}

            {showEditorSection('catalogSectionEnabled', false) && (
              <EditorSection
                sectionKey="catalog"
                fillStatus={getEditorSectionFill('catalog', editorData)}
                title="Catálogo"
                description="Productos o recursos con precio o detalle, si vendes o promocionas ítems."
                onActivate={activatePreviewSection}
              >
                <CatalogFieldsEditor
                  formData={editorData}
                  onChange={handleEditorChange}
                  pageId={selectedId}
                  canToggleSection={canManageLayout}
                  canUseCustomVisualStyle={entitlements.canUseCustomSectionVisualStyle}
                  onUpgradePlan={openBilling}
                  upgradeLabel={upgradeLabel}
                />
                <LabelsFieldsEditor key={`labels-catalog-${editingLanguage}`} formData={editorData} onChange={handleEditorChange} groupIds={['catalog']} showLanguagePicker={false} compact language={editingLanguage} />
              </EditorSection>
            )}

            {showEditorSection('gallerySectionEnabled', false) && (
              <EditorSection
                sectionKey="gallery"
                fillStatus={getEditorSectionFill('gallery', editorData)}
                title="Galería"
                description="Fotos del espacio, trabajos o resultados para mostrar en la landing."
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
                <LabelsFieldsEditor key={`labels-gallery-${editingLanguage}`} formData={editorData} onChange={handleEditorChange} groupIds={['gallery']} showLanguagePicker={false} compact language={editingLanguage} />
              </EditorSection>
            )}

            {showEditorSection('videoSectionEnabled', false) && (
              <EditorSection
                sectionKey="video"
                fillStatus={getEditorSectionFill('video', editorData)}
                title="Video"
                description="Un video de presentación (YouTube, Vimeo o un archivo)."
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
                description="Opiniones de clientes o pacientes para generar confianza."
                onActivate={activatePreviewSection}
              >
                <TestimonialsFieldsEditor
                  formData={editorData}
                  onChange={handleEditorChange}
                  pageId={selectedId}
                  canToggleSection={canManageLayout}
                />
                <LabelsFieldsEditor key={`labels-testimonials-${editingLanguage}`} formData={editorData} onChange={handleEditorChange} groupIds={['testimonials']} showLanguagePicker={false} compact language={editingLanguage} />
              </EditorSection>
            )}

            {showEditorSection('blogSectionEnabled', false) && (
              <EditorSection
                sectionKey="blog"
                fillStatus={getEditorSectionFill('blog', editorData)}
                title="Blog / noticias"
                description="Noticias, artículos o novedades que quieras publicar en la página."
                onActivate={activatePreviewSection}
              >
                <PlanGate
                  allowed={entitlements.canUseBlog}
                  label={upgradeLabel}
                  onUpgrade={openBilling}
                >
                  <BlogFieldsEditor
                    formData={editorData}
                    onChange={handleEditorChange}
                    pageId={selectedId}
                    canToggleSection={canManageLayout}
                  />
                  <LabelsFieldsEditor key={`labels-blog-${editingLanguage}`} formData={editorData} onChange={handleEditorChange} groupIds={['blog']} showLanguagePicker={false} compact language={editingLanguage} />
                </PlanGate>
              </EditorSection>
            )}

            {showEditorSection('contactSectionEnabled', true) && (
              <EditorSection
                sectionKey="contact"
                fillStatus={getEditorSectionFill('contact', editorData)}
                title="Contacto"
                description="Cómo encontrarte: dirección, mapa, email y teléfono."
                onActivate={activatePreviewSection}
              >
                <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
                  <ShowContentToggle
                    checked={editorData.contactShowTitle !== false}
                    onChange={(contactShowTitle) => handleEditorChange({ ...editorData, contactShowTitle })}
                    label="Mostrar título de contacto"
                    hint="Desactivado = se omite el título (no usa el valor por defecto)."
                  />
                  <ShowContentToggle
                    checked={editorData.contactShowSubtitle !== false}
                    onChange={(contactShowSubtitle) => handleEditorChange({ ...editorData, contactShowSubtitle })}
                    label="Mostrar subtítulo de contacto"
                    hint="Desactivado = se omite el subtítulo (no usa el valor por defecto)."
                  />
                </div>
                <LocationFieldsEditor
                  formData={editorData}
                  onChange={handleEditorChange}
                  locationLimit={entitlements.bypass ? null : entitlements.locationLimit}
                  canUseMapBeside={entitlements.canUseContactMapBeside}
                  onUpgradePlan={openBilling}
                  upgradeLabel={upgradeLabel}
                  sharedContactFields={(
                    <>
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-gray-400 uppercase">Email Público</label>
                        <input type="email" value={editorData.email || ''} onChange={e => handleEditorChange({...editorData, email: e.target.value})} className="w-full border p-2.5 text-xs rounded-lg" />
                      </div>
                      <PhoneFieldsEditor formData={editorData} onChange={handleEditorChange} />
                    </>
                  )}
                />
                <LabelsFieldsEditor key={`labels-contact-messages-${editingLanguage}`} formData={editorData} onChange={handleEditorChange} groupIds={['contact', 'messages']} showLanguagePicker={false} compact language={editingLanguage} />
              </EditorSection>
            )}

            {showEditorSection('socialSectionEnabled', true) && (
              <EditorSection
                sectionKey="social"
                fillStatus={getEditorSectionFill('social', editorData)}
                title="Redes sociales"
                description="Enlaces a Instagram, Facebook, WhatsApp y otras redes."
                onActivate={activatePreviewSection}
              >
                <SocialFieldsEditor formData={editorData} onChange={handleEditorChange} />
                <LabelsFieldsEditor key={`labels-social-${editingLanguage}`} formData={editorData} onChange={handleEditorChange} groupIds={['social']} showLanguagePicker={false} compact language={editingLanguage} />
              </EditorSection>
            )}

            <EditorSection
              sectionKey="qrCodes"
              title="Códigos QR"
              description="Códigos QR del sitio y redes para imprimir o compartir. Solo se ven en el admin."
              onActivate={activatePreviewSection}
            >
              <PlanGate
                allowed={entitlements.canUseQrCodes}
                label={upgradeLabel}
                onUpgrade={openBilling}
                lockedTitle={t('billing.features.qrCodes')}
                lockedDescription="Genera y descarga códigos QR del sitio y redes (Pro: máx. 2 · Agency: ilimitados)."
              >
                <QrCodesSection
                  formData={editorData}
                  pageId={selectedId}
                  pageOpenUrl={pageOpenUrl}
                  qrCodeLimit={entitlements.bypass ? null : entitlements.qrCodeLimit}
                  onUpgrade={openBilling}
                />
              </PlanGate>
            </EditorSection>

            {(canManageLayout || hasActiveCustomEmbeds) && (
              <EditorSection
                sectionKey="embeds"
                fillStatus={getEditorSectionFill('embeds', editorData)}
                title="Secciones personalizadas"
                description="Bloques extra: preguntas frecuentes, formulario, llamada a la acción o HTML."
                onActivate={activatePreviewSection}
              >
                <PlanGate
                  allowed={entitlements.canUseCustomEmbeds}
                  label={upgradeLabel}
                  onUpgrade={openBilling}
                >
                  <CustomEmbedsFieldsEditor
                    formData={editorData}
                    onChange={handleEditorChange}
                    canManageLayout={canManageLayout}
                    pageId={selectedId}
                    canUseCustomVisualStyle={entitlements.canUseCustomSectionVisualStyle}
                    onUpgradePlan={openBilling}
                    upgradeLabel={upgradeLabel}
                  />
                </PlanGate>
              </EditorSection>
            )}

            <EditorSection
              sectionKey="footer"
              fillStatus={getEditorSectionFill('footer', editorData)}
              title="Hosting, analytics y pie"
              description="Dominio, publicación del sitio, analítica, textos legales y el pie de página."
              onActivate={activatePreviewSection}
            >
              <PlanGate
                allowed={entitlements.canUseHostingDeploy || entitlements.bypass}
                label={upgradeLabel}
                onUpgrade={openBilling}
                lockedTitle="Hosting y analytics (Pro+)"
                lockedDescription="Publica tu landing en un dominio propio, dispara deploys y mide el tráfico con Google Analytics. Disponible desde el plan Pro."
                lockedBenefits={[
                  'Dominio personalizado y URL pública del sitio',
                  'Deploy a Vercel, Netlify, Cloudflare, Firebase o GitHub Actions',
                  'Google Analytics (GA4) por landing',
                  'Firebase externo del cliente (Agency+)',
                ]}
              >
                <SiteHostingFieldsEditor
                  formData={editorData}
                  onChange={handleEditorChange}
                  pageId={selectedId}
                  canUseExternalFirebase={entitlements.canUseExternalFirebase || entitlements.bypass}
                  canUseHostingDeploy={entitlements.canUseHostingDeploy || entitlements.bypass}
                  onUpgradePlan={openBilling}
                  upgradeLabel={upgradeLabel}
                />
              </PlanGate>
              <LegalDocumentsFieldsEditor formData={editorData} onChange={handleEditorChange} language={editingLanguage} />
              <PageAppearanceEditor formData={editorData} onChange={handleEditorChange} sections={['footer']} />
              <LabelsFieldsEditor key={`labels-footer-${editingLanguage}`} formData={editorData} onChange={handleEditorChange} groupIds={['footer']} showLanguagePicker={false} compact language={editingLanguage} />
            </EditorSection>

            <EditorSection
              sectionKey="audit"
              fillStatus={{ filled: true, label: 'Historial' }}
              title="Historial de cambios"
              description="Quién guardó y qué campos se modificaron. Útil para revisar el trabajo en equipo."
              onActivate={activatePreviewSection}
            >
              <PageAuditSection pageId={selectedId} />
            </EditorSection>
            </div>
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
      <DevicePreviewPanel
        formData={formData}
        selectedId={selectedId}
        editingLanguage={editingLanguage}
        previewScrollSectionId={previewScrollSectionId}
        lockedHeroSlideIndex={lockedHeroSlideIndex}
        activeMarketingRouteId={activeMarketingRouteId}
        deviceView={previewDeviceView}
        onDeviceViewChange={setPreviewDeviceView}
        hiddenOnDesktop={previewPanelHidden}
        onHiddenOnDesktopChange={setPreviewPanelHidden}
        hideLabel={t('shell.hideLivePreview')}
        showLabel={t('shell.showLivePreview')}
      />

      {showUserManagement && (
        <UserManagement
          pageOptions={landings}
          onClose={() => setShowUserManagement(false)}
        />
      )}

      <CreatePageModal
        open={showCreatePage}
        creating={creatingPage}
        pageCount={entitlements.pageCount}
        pageLimit={entitlements.bypass ? null : entitlements.pageLimit}
        onClose={() => setShowCreatePage(false)}
        onCreate={handleCreatePage}
        onUpgradePlan={openBilling}
      />

      <BillingPlansPanel open={showBilling} onClose={() => setShowBilling(false)} />
      <SavePublishAdGate
        open={showSaveAdGate}
        onCancel={() => setShowSaveAdGate(false)}
        onComplete={handleSaveAdComplete}
        onUpgrade={() => {
          setShowSaveAdGate(false);
          openBilling();
        }}
      />
    </div>
    </div>
  );
}
