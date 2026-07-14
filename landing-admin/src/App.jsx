import { useState, useEffect, useRef, useCallback } from 'react';
import { listPageDocuments } from './utils/firestoreAccess';
import { db } from './firebase';
import { createEmptySlide } from './utils/heroSlides';
import { hydratePageForm, normalizePageData } from './utils/pageModel';
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
import LocationFieldsEditor from './components/LocationFieldsEditor';
import PhoneFieldsEditor from './components/PhoneFieldsEditor';
import LegalDocumentsFieldsEditor from './components/LegalDocumentsFieldsEditor';
import EditorSection from './components/EditorSection';
import LandingMirror from './components/LandingMirror';
import { resolvePreviewSectionId } from './utils/sectionAnchors';
import SiteHostingFieldsEditor from './components/SiteHostingFieldsEditor';
import LoginScreen from './components/LoginScreen';
import UserManagement from './components/UserManagement';
import CreatePageModal from './components/CreatePageModal';
import VerticalFieldsEditor from './components/VerticalFieldsEditor';
import { hydrateFormSocial } from './utils/socialLinks';
import { createPageInHub, loadPageForEditor, savePageFromEditor } from './utils/pageRepository';
import { useAuth } from './contexts/AuthContext';
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

const TEMPLATE_PREVIEW_URL = (
  import.meta.env.VITE_TEMPLATE_PREVIEW_URL?.replace(/\/$/, '')
  || (import.meta.env.DEV ? 'http://localhost:5174' : '')
);

const DEMO_PREVIEW_ID = 'preview-demo';

function hydrateForm(landing) {
  return hydrateFormSocial(hydratePageForm(landing));
}

export default function App() {
  const { user, profile, loading: authLoading, signOut, hasAccess } = useAuth();
  const [landings, setLandings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState(null);
  const [layoutBaseline, setLayoutBaseline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deviceView, setDeviceView] = useState('desktop');
  const [previewSource, setPreviewSource] = useState('mirror');
  const [previewSectionKey, setPreviewSectionKey] = useState('identity');
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [creatingPage, setCreatingPage] = useState(false);
  const [accessError, setAccessError] = useState('');
  const previewIframeRef = useRef(null);

  const accessibleLandings = profile ? filterAccessiblePages(landings, profile) : [];
  const showPageList = !isSinglePageUser(profile);
  const canEditSelectedPage = canEditPage(profile, selectedId);
  const canManageHosting = canAccessHostingSettings(profile);
  const canCreateNewPages = canCreatePages(profile);
  const canManageLayout = canManagePageLayout(profile);
  const previewScrollSectionId = resolvePreviewSectionId(previewSectionKey);

  const hasActiveCustomEmbeds = normalizeCustomEmbeds(formData?.customEmbeds)
    .some((embed) => embed.enabled !== false);

  const showEditorSection = (flag, defaultEnabled = true) => (
    canManageLayout || isFlagEnabled(formData, flag, defaultEnabled)
  );

  const localPreviewUrl = selectedId && TEMPLATE_PREVIEW_URL
    ? `${TEMPLATE_PREVIEW_URL}?pageId=${encodeURIComponent(selectedId)}&preview=true`
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
        scrollSectionId: previewScrollSectionId,
      },
      TEMPLATE_PREVIEW_URL
    );
  }, [formData, selectedId, previewScrollSectionId]);

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
      setLayoutBaseline(hydrated);
      return;
    }
    try {
      const data = await loadPageForEditor(landing.id, landing);
      const hydrated = hydrateForm({ id: landing.id, ...data });
      setFormData(hydrated);
      setLayoutBaseline(hydrated);
    } catch (error) {
      console.error('Error al cargar la landing:', error);
      const hydrated = hydrateForm(landing);
      setFormData(hydrated);
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
      setLayoutBaseline(hydrated);
      setShowCreatePage(false);
    } finally {
      setCreatingPage(false);
    }
  };

  if (authLoading) {
    return <div className="h-screen flex items-center justify-center bg-gray-900 text-white font-sans text-sm tracking-widest uppercase animate-pulse">Verificando acceso...</div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!hasAccess) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F4F1EA] p-6 font-sans">
        <div className="max-w-md bg-white border border-[#2A342D]/10 rounded-2xl shadow-xl p-8 text-center">
          <h1 className="font-serif text-2xl text-[#2A342D] mb-2">Acceso no autorizado</h1>
          <p className="text-sm text-[#2A342D]/70 mb-6">
            Tu cuenta no tiene un perfil de acceso configurado. Pide a un administrador root que te asigne rol y páginas.
          </p>
          <button
            type="button"
            onClick={signOut}
            className="bg-[#4A5D4E] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#3d4d41]"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-900 text-white font-sans text-sm tracking-widest uppercase animate-pulse">Cargando Sistema...</div>;

  if (accessError && !formData && !canCreateNewPages) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F4F1EA] p-6 font-sans">
        <div className="max-w-md bg-white border border-[#2A342D]/10 rounded-2xl shadow-xl p-8 text-center">
          <h1 className="font-serif text-2xl text-[#2A342D] mb-2">Sin páginas asignadas</h1>
          <p className="text-sm text-[#2A342D]/70 mb-6">{accessError}</p>
          <button
            type="button"
            onClick={signOut}
            className="bg-[#4A5D4E] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#3d4d41]"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-full max-w-full bg-gray-100 text-gray-800 overflow-hidden font-sans">
      {/* 1. BARRA LATERAL */}
      <div className="w-64 bg-gray-950 text-white flex flex-col border-r border-gray-800 shrink-0 min-h-0">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-base font-bold tracking-tight text-indigo-400">Multi-Landing CMS</h1>
          <p className="text-[11px] text-gray-500">Vista Previa Integrada</p>
          <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
            <p className="text-[10px] text-gray-400 truncate" title={user.email}>{user.email}</p>
            <p className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wide">{getRoleLabel(profile.role)}</p>
            <div className="flex gap-2">
              {canCreateNewPages && (
                <button
                  type="button"
                  onClick={() => setShowCreatePage(true)}
                  className="flex-1 text-[10px] px-2 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-500 font-semibold"
                >
                  + Landing
                </button>
              )}
              {canManageUsers(profile) && (
                <button
                  type="button"
                  onClick={() => setShowUserManagement(true)}
                  className="flex-1 text-[10px] px-2 py-1.5 rounded bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-700"
                >
                  Usuarios
                </button>
              )}
              <button
                type="button"
                onClick={signOut}
                className="flex-1 text-[10px] px-2 py-1.5 rounded bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-700"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {canCreateNewPages && accessibleLandings.length === 0 && (
            <div className="mb-3 rounded-lg border border-indigo-500/30 bg-indigo-600/10 px-3 py-3">
              <p className="text-[11px] text-indigo-100 mb-2">Aún no hay landings. Crea la primera para la demo.</p>
              <button
                type="button"
                onClick={() => setShowCreatePage(true)}
                className="w-full text-[11px] font-semibold px-2 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-500"
              >
                + Nueva landing
              </button>
            </div>
          )}
          {accessibleLandings.length === 0 && import.meta.env.DEV && canManageUsers(profile) && (
            <button
              type="button"
              onClick={selectDemoPreview}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${selectedId === DEMO_PREVIEW_ID ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-900'}`}
            >
              <span>✨ Vista previa demo</span>
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
              <p className="text-[10px] text-indigo-200 uppercase tracking-wide mb-1">Tu página</p>
              <p className="text-xs font-medium text-white">{accessibleLandings[0].name || accessibleLandings[0].id}</p>
              <p className="text-[9px] text-indigo-200/80 font-mono mt-1">{accessibleLandings[0].id}</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. FORMULARIO */}
      <div className="w-5/12 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain p-6 bg-white border-r border-gray-200 shadow-inner">
        {formData ? (
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
                {saving ? 'Guardando...' : isDemoPreview ? 'Demo (sin guardar)' : !canEditSelectedPage ? 'Sin permiso' : 'Guardar y Publicar'}
              </button>
            </div>

            <EditorSection
              sectionKey="identity"
              fillStatus={getEditorSectionFill('identity', formData)}
              title="Identidad y apariencia"
              description="Nombre, tipo de negocio, idioma, fondo y textos de respaldo"
              defaultOpen
              onActivate={activatePreviewSection}
            >
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase">Nombre Profesional</label>
                <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none" />
              </div>
              <VerticalFieldsEditor formData={formData} onChange={setFormData} />
              <PageAppearanceEditor formData={formData} onChange={setFormData} sections={['page']} />
              <LabelsFieldsEditor
                formData={formData}
                onChange={setFormData}
                groupIds={['placeholders']}
                showLanguagePicker
                compact
              />
            </EditorSection>

            <EditorSection
              sectionKey="nav"
              fillStatus={getEditorSectionFill('nav', formData)}
              title="Navegación"
              description="Layout, menú, CTA y colores"
              onActivate={activatePreviewSection}
            >
              <NavFieldsEditor formData={formData} onChange={setFormData} pageId={selectedId} />
              <LabelsFieldsEditor formData={formData} onChange={setFormData} groupIds={['navigation']} showLanguagePicker={false} compact />
            </EditorSection>

            {canManageLayout && (
              <EditorSection
                sectionKey="visibility"
                fillStatus={getEditorSectionFill('visibility', formData)}
                title="Visibilidad de secciones"
                description="Activa o desactiva bloques (el navbar siempre queda)"
                onActivate={activatePreviewSection}
              >
                <SectionVisibilityFieldsEditor formData={formData} onChange={setFormData} />
              </EditorSection>
            )}

            {showEditorSection('preHeroEnabled', false) && (
              <EditorSection
                sectionKey="preHero"
                fillStatus={getEditorSectionFill('preHero', formData)}
                title="Pre-hero"
                description="Bloque editorial antes del carrusel"
                onActivate={activatePreviewSection}
              >
                <PreHeroFieldsEditor
                  formData={formData}
                  onChange={setFormData}
                  pageId={selectedId}
                  canToggleSection={canManageLayout}
                />
                <LabelsFieldsEditor formData={formData} onChange={setFormData} groupIds={['preHero']} showLanguagePicker={false} compact />
              </EditorSection>
            )}

            {showEditorSection('heroSectionEnabled', true) && (
              <EditorSection
                sectionKey="hero"
                fillStatus={getEditorSectionFill('hero', formData)}
                title="Hero"
                description="Especialidad, diapositivas, colores y botones"
                defaultOpen={false}
                onActivate={activatePreviewSection}
              >
                <HeroSlidesEditor
                  slides={formData.heroSlides || [createEmptySlide()]}
                  onChange={(heroSlides) => setFormData({ ...formData, heroSlides })}
                  pageId={selectedId}
                  formData={formData}
                  onFormChange={setFormData}
                />
                <LabelsFieldsEditor formData={formData} onChange={setFormData} groupIds={['hero']} showLanguagePicker={false} compact />
              </EditorSection>
            )}

            {showEditorSection('aboutSectionEnabled', true) && (
              <EditorSection
                sectionKey="about"
                fillStatus={getEditorSectionFill('about', formData)}
                title="Acerca de"
                description="Título, frase, texto descriptivo y colores"
                onActivate={activatePreviewSection}
              >
                <AboutFieldsEditor formData={formData} onChange={setFormData} />
              </EditorSection>
            )}

            {showEditorSection('servicesSectionEnabled', false) && (
              <EditorSection
                sectionKey="services"
                fillStatus={getEditorSectionFill('services', formData)}
                title="Servicios"
                description="Áreas de atención, colores y etiquetas"
                onActivate={activatePreviewSection}
              >
                <ServicesFieldsEditor
                  formData={formData}
                  onChange={setFormData}
                  pageId={selectedId}
                  canToggleSection={canManageLayout}
                />
                <LabelsFieldsEditor formData={formData} onChange={setFormData} groupIds={['services']} showLanguagePicker={false} compact />
              </EditorSection>
            )}

            {showEditorSection('catalogSectionEnabled', false) && (
              <EditorSection
                sectionKey="catalog"
                fillStatus={getEditorSectionFill('catalog', formData)}
                title="Catálogo"
                description="Productos o recursos, colores y etiquetas"
                onActivate={activatePreviewSection}
              >
                <CatalogFieldsEditor
                  formData={formData}
                  onChange={setFormData}
                  pageId={selectedId}
                  canToggleSection={canManageLayout}
                />
                <LabelsFieldsEditor formData={formData} onChange={setFormData} groupIds={['catalog']} showLanguagePicker={false} compact />
              </EditorSection>
            )}

            {showEditorSection('gallerySectionEnabled', false) && (
              <EditorSection
                sectionKey="gallery"
                fillStatus={getEditorSectionFill('gallery', formData)}
                title="Galería"
                description="Imágenes del espacio, colores y etiquetas"
                onActivate={activatePreviewSection}
              >
                <GalleryFieldsEditor
                  formData={formData}
                  onChange={setFormData}
                  pageId={selectedId}
                  canToggleSection={canManageLayout}
                />
                <LabelsFieldsEditor formData={formData} onChange={setFormData} groupIds={['gallery']} showLanguagePicker={false} compact />
              </EditorSection>
            )}

            {showEditorSection('videoSectionEnabled', false) && (
              <EditorSection
                sectionKey="video"
                fillStatus={getEditorSectionFill('video', formData)}
                title="Video"
                description="Sección de video y colores"
                onActivate={activatePreviewSection}
              >
                <VideoSectionFieldsEditor
                  formData={formData}
                  onChange={setFormData}
                  canToggleSection={canManageLayout}
                />
              </EditorSection>
            )}

            {showEditorSection('testimonialsEnabled', false) && (
              <EditorSection
                sectionKey="testimonials"
                fillStatus={getEditorSectionFill('testimonials', formData)}
                title="Testimonios"
                description="Citas, colores y etiquetas"
                onActivate={activatePreviewSection}
              >
                <TestimonialsFieldsEditor
                  formData={formData}
                  onChange={setFormData}
                  pageId={selectedId}
                  canToggleSection={canManageLayout}
                />
                <LabelsFieldsEditor formData={formData} onChange={setFormData} groupIds={['testimonials']} showLanguagePicker={false} compact />
              </EditorSection>
            )}

            {showEditorSection('blogSectionEnabled', false) && (
              <EditorSection
                sectionKey="blog"
                fillStatus={getEditorSectionFill('blog', formData)}
                title="Blog / noticias"
                description="Entradas con layouts, colores y etiquetas"
                onActivate={activatePreviewSection}
              >
                <BlogFieldsEditor
                  formData={formData}
                  onChange={setFormData}
                  pageId={selectedId}
                  canToggleSection={canManageLayout}
                />
                <LabelsFieldsEditor formData={formData} onChange={setFormData} groupIds={['blog']} showLanguagePicker={false} compact />
              </EditorSection>
            )}

            {showEditorSection('contactSectionEnabled', true) && (
              <EditorSection
                sectionKey="contact"
                fillStatus={getEditorSectionFill('contact', formData)}
                title="Contacto"
                description="Ubicación, email, teléfono y etiquetas"
                onActivate={activatePreviewSection}
              >
                <LocationFieldsEditor formData={formData} onChange={setFormData} />
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase">Email Público</label>
                  <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border p-2.5 text-xs rounded-lg" />
                </div>
                <PhoneFieldsEditor formData={formData} onChange={setFormData} />
                <LabelsFieldsEditor formData={formData} onChange={setFormData} groupIds={['contact', 'messages']} showLanguagePicker={false} compact />
              </EditorSection>
            )}

            {showEditorSection('socialSectionEnabled', true) && (
              <EditorSection
                sectionKey="social"
                fillStatus={getEditorSectionFill('social', formData)}
                title="Redes sociales"
                description="Enlaces, colores y etiquetas"
                onActivate={activatePreviewSection}
              >
                <SocialFieldsEditor formData={formData} onChange={setFormData} />
                <LabelsFieldsEditor formData={formData} onChange={setFormData} groupIds={['social']} showLanguagePicker={false} compact />
              </EditorSection>
            )}

            {(canManageLayout || hasActiveCustomEmbeds) && (
              <EditorSection
                sectionKey="embeds"
                fillStatus={getEditorSectionFill('embeds', formData)}
                title="Secciones personalizadas"
                description="FAQ, proceso, CTA, texto, cita o código HTML"
                onActivate={activatePreviewSection}
              >
                <CustomEmbedsFieldsEditor
                  formData={formData}
                  onChange={setFormData}
                  canManageLayout={canManageLayout}
                  pageId={selectedId}
                />
              </EditorSection>
            )}

            <EditorSection
              sectionKey="footer"
              fillStatus={getEditorSectionFill('footer', formData)}
              title="Hosting, analytics y pie"
              description="Dominio, Firebase externo, GA4, documentos legales y colores del footer"
              onActivate={activatePreviewSection}
            >
              {canManageHosting && (
                <SiteHostingFieldsEditor
                  formData={formData}
                  onChange={setFormData}
                  pageId={selectedId}
                />
              )}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase">Google Analytics (GA4)</label>
                <p className="text-[10px] text-gray-400">
                  ID de medición (ej. G-XXXXXXXX). Si lo dejas vacío, se usará el de <code className="bg-gray-100 px-1 rounded">VITE_FIREBASE_MEASUREMENT_ID</code> del deploy.
                </p>
                <input
                  type="text"
                  value={formData.analyticsMeasurementId || ''}
                  onChange={(e) => setFormData({ ...formData, analyticsMeasurementId: e.target.value.trim() })}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>
              <LegalDocumentsFieldsEditor formData={formData} onChange={setFormData} />
              <PageAppearanceEditor formData={formData} onChange={setFormData} sections={['footer']} />
              <LabelsFieldsEditor formData={formData} onChange={setFormData} groupIds={['footer']} showLanguagePicker={false} compact />
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
    </div>
  );
}
