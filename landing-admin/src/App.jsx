import { useState, useEffect, useRef, useCallback } from 'react';
import { listPageDocuments } from './utils/firestoreAccess';
import { db } from './firebase';
import { createEmptySlide } from './utils/heroSlides';
import { hydratePageForm, normalizePageData } from './utils/pageModel';
import HeroSlidesEditor from './components/HeroSlidesEditor';
import SocialFieldsEditor from './components/SocialFieldsEditor';
import CustomEmbedsFieldsEditor from './components/CustomEmbedsFieldsEditor';
import NavFieldsEditor from './components/NavFieldsEditor';
import PreHeroFieldsEditor from './components/PreHeroFieldsEditor';
import ServicesFieldsEditor from './components/ServicesFieldsEditor';
import CatalogFieldsEditor from './components/CatalogFieldsEditor';
import VideoSectionFieldsEditor from './components/VideoSectionFieldsEditor';
import TestimonialsFieldsEditor from './components/TestimonialsFieldsEditor';
import AboutFieldsEditor from './components/AboutFieldsEditor';
import PageAppearanceEditor from './components/PageAppearanceEditor';
import LabelsFieldsEditor from './components/LabelsFieldsEditor';
import LocationFieldsEditor from './components/LocationFieldsEditor';
import PhoneFieldsEditor from './components/PhoneFieldsEditor';
import LandingMirror from './components/LandingMirror';
import SiteHostingFieldsEditor from './components/SiteHostingFieldsEditor';
import LoginScreen from './components/LoginScreen';
import UserManagement from './components/UserManagement';
import { hydrateFormSocial } from './utils/socialLinks';
import { loadPageForEditor, savePageFromEditor } from './utils/pageRepository';
import { useAuth } from './contexts/AuthContext';
import {
  canAccessHostingSettings,
  canEditPage,
  canManageUsers,
  filterAccessiblePages,
  getRoleLabel,
  isSinglePageUser,
} from './utils/permissions';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deviceView, setDeviceView] = useState('desktop');
  const [previewSource, setPreviewSource] = useState('mirror');
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [accessError, setAccessError] = useState('');
  const previewIframeRef = useRef(null);

  const accessibleLandings = profile ? filterAccessiblePages(landings, profile) : [];
  const showPageList = !isSinglePageUser(profile);
  const canEditSelectedPage = canEditPage(profile, selectedId);
  const canManageHosting = canAccessHostingSettings(profile);

  const localPreviewUrl = selectedId && TEMPLATE_PREVIEW_URL
    ? `${TEMPLATE_PREVIEW_URL}?pageId=${encodeURIComponent(selectedId)}&preview=true`
    : null;

  const postPreviewUpdate = useCallback(() => {
    if (!formData || !previewIframeRef.current?.contentWindow || !TEMPLATE_PREVIEW_URL) return;

    previewIframeRef.current.contentWindow.postMessage(
      { type: 'LANDING_PREVIEW_UPDATE', data: formData, pageId: selectedId },
      TEMPLATE_PREVIEW_URL
    );
  }, [formData, selectedId]);

  useEffect(() => {
    if (previewSource !== 'local') return;
    postPreviewUpdate();
  }, [formData, previewSource, postPreviewUpdate]);

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
      setFormData(hydrateForm(landing));
      return;
    }
    try {
      const data = await loadPageForEditor(landing.id, landing);
      setFormData(hydrateForm({ id: landing.id, ...data }));
    } catch (error) {
      console.error('Error al cargar la landing:', error);
      setFormData(hydrateForm(landing));
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
          setFormData(hydrateForm({ id: first.id, ...loaded }));
        } else if (import.meta.env.DEV && canManageUsers(profile)) {
          setSelectedId(DEMO_PREVIEW_ID);
          setFormData(hydrateForm({ id: DEMO_PREVIEW_ID }));
        } else {
          setSelectedId(null);
          setFormData(null);
          setAccessError('No tienes páginas asignadas. Contacta al administrador.');
        }
      } catch (error) {
        console.error('Error al leer Firestore:', error);
        if (import.meta.env.DEV && canManageUsers(profile)) {
          setSelectedId(DEMO_PREVIEW_ID);
          setFormData(hydrateForm({ id: DEMO_PREVIEW_ID }));
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
      alert('Modo demo: crea un documento en Firestore (colección "pages") para guardar cambios.');
      return;
    }
    if (!canEditSelectedPage) {
      alert('No tienes permiso para guardar cambios en esta página.');
      return;
    }
    setSaving(true);
    try {
      await savePageFromEditor(selectedId, formData);
      setLandings((current) => current.map((landing) => (
        landing.id === selectedId
          ? { id: selectedId, ...hydratePageForm({ ...formData, id: selectedId }) }
          : landing
      )));
      alert(`¡Cambios guardados con éxito en la nube para [${selectedId}]!`);
    } catch (error) {
      console.error(error);
      alert('No se pudieron guardar los cambios. Revisa la consola y las reglas de Firestore.');
    } finally {
      setSaving(false);
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

  if (accessError && !formData) {
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
    <div className="flex h-screen w-screen bg-gray-100 text-gray-800 overflow-hidden font-sans">
      {/* 1. BARRA LATERAL */}
      <div className="w-64 bg-gray-950 text-white flex flex-col border-r border-gray-800 shrink-0">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-base font-bold tracking-tight text-indigo-400">Multi-Landing CMS</h1>
          <p className="text-[11px] text-gray-500">Vista Previa Integrada</p>
          <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
            <p className="text-[10px] text-gray-400 truncate" title={user.email}>{user.email}</p>
            <p className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wide">{getRoleLabel(profile.role)}</p>
            <div className="flex gap-2">
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
      <div className="w-5/12 overflow-y-auto p-6 bg-white border-r border-gray-200 shadow-inner shrink-0">
        {formData ? (
          <form onSubmit={handleSaveChanges} className="space-y-6">
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

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-gray-400 uppercase">Nombre Profesional</label>
              <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-gray-400 uppercase">Especialidad</label>
              <input type="text" value={formData.specialty || ''} onChange={e => setFormData({...formData, specialty: e.target.value})} className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>

            <PageAppearanceEditor formData={formData} onChange={setFormData} />

            <LabelsFieldsEditor formData={formData} onChange={setFormData} />

            {canManageHosting && (
              <SiteHostingFieldsEditor formData={formData} onChange={setFormData} />
            )}

            <NavFieldsEditor
              formData={formData}
              onChange={setFormData}
              pageId={selectedId}
            />

            <PreHeroFieldsEditor
              formData={formData}
              onChange={setFormData}
              pageId={selectedId}
            />

            <HeroSlidesEditor
              slides={formData.heroSlides || [createEmptySlide()]}
              onChange={(heroSlides) => setFormData({ ...formData, heroSlides })}
              pageId={selectedId}
              formData={formData}
            />

            <AboutFieldsEditor formData={formData} onChange={setFormData} />

            <ServicesFieldsEditor
              formData={formData}
              onChange={setFormData}
              pageId={selectedId}
            />

            <CatalogFieldsEditor
              formData={formData}
              onChange={setFormData}
              pageId={selectedId}
            />

            <VideoSectionFieldsEditor formData={formData} onChange={setFormData} />

            <TestimonialsFieldsEditor
              formData={formData}
              onChange={setFormData}
              pageId={selectedId}
            />

            <LocationFieldsEditor formData={formData} onChange={setFormData} />

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-gray-400 uppercase">Email Público</label>
              <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border p-2.5 text-xs rounded-lg" />
            </div>
            <PhoneFieldsEditor formData={formData} onChange={setFormData} />

            <SocialFieldsEditor
              formData={formData}
              onChange={setFormData}
            />

            <CustomEmbedsFieldsEditor
              formData={formData}
              onChange={setFormData}
            />

            <div className="space-y-2 pt-2 border-t">
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
          </form>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-xs">Selecciona un sitio de la izquierda para comenzar a editar.</div>
        )}
      </div>

      {/* 3. SIMULADOR DE VISTA PREVIA */}
      <div className="flex-1 min-h-0 bg-gray-200 p-6 flex flex-col overflow-hidden">
        <div className="w-full flex justify-between items-center mb-4 shrink-0 gap-3">
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
              <LandingMirror previewData={formData} previewSeed={selectedId} />
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
    </div>
  );
}
