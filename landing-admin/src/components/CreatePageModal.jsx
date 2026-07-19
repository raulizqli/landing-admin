import { useState } from 'react';
import { isValidPageId, slugifyPageId } from '../utils/pageId';
import {
  DEFAULT_VERTICAL,
  VERTICALS,
  getVerticalDefaultSpecialty,
  normalizeVertical,
} from '@raulizqli/landing-core/verticals';
import { generateLandingDraftRemote } from '../utils/aiAssistFunctions';
import {
  LANDING_BRIEF_TEMPLATE,
  hasMeaningfulLandingBrief,
  normalizeLandingDraft,
} from '../utils/landingDraft';
import { getAiProviderDisplayName } from '../utils/aiProviderLabel';

export default function CreatePageModal({ open, onClose, onCreate, creating = false }) {
  const [name, setName] = useState('');
  const [pageId, setPageId] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [vertical, setVertical] = useState(DEFAULT_VERTICAL);
  const [idTouched, setIdTouched] = useState(false);
  const [specialtyTouched, setSpecialtyTouched] = useState(false);
  const [error, setError] = useState('');
  const [brief, setBrief] = useState(LANDING_BRIEF_TEMPLATE);
  const [aiDraft, setAiDraft] = useState(null);
  const [aiProvider, setAiProvider] = useState('');
  const [generatingDraft, setGeneratingDraft] = useState(false);

  if (!open) return null;

  const reset = () => {
    setName('');
    setPageId('');
    setSpecialty('');
    setVertical(DEFAULT_VERTICAL);
    setIdTouched(false);
    setSpecialtyTouched(false);
    setError('');
    setBrief(LANDING_BRIEF_TEMPLATE);
    setAiDraft(null);
    setAiProvider('');
    setGeneratingDraft(false);
  };

  const handleClose = () => {
    if (creating) return;
    reset();
    onClose();
  };

  const handleNameChange = (value) => {
    setName(value);
    if (!idTouched) {
      setPageId(slugifyPageId(value));
    }
  };

  const handleVerticalChange = (nextVertical) => {
    const id = normalizeVertical(nextVertical);
    setVertical(id);
    if (!specialtyTouched) {
      setSpecialty(getVerticalDefaultSpecialty(id, 'es'));
    }
  };

  const handleGenerateDraft = async () => {
    setError('');
    if (!hasMeaningfulLandingBrief(brief)) {
      setError('Completa al menos 4 puntos de la guía con suficiente detalle para generar un buen borrador.');
      return;
    }

    setGeneratingDraft(true);
    try {
      const response = await generateLandingDraftRemote({
        brief,
        language: 'es',
        vertical,
      });
      const draft = normalizeLandingDraft(response?.result, { name, specialty, vertical });
      setAiDraft(draft);
      setAiProvider(response?.provider || '');
      if (draft.name) handleNameChange(draft.name);
      if (draft.specialty) {
        setSpecialty(draft.specialty);
        setSpecialtyTouched(true);
      }
      if (draft.vertical) setVertical(draft.vertical);
    } catch (err) {
      setError(err?.message || 'No se pudo generar el borrador con IA.');
    } finally {
      setGeneratingDraft(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const id = slugifyPageId(pageId);
    if (!isValidPageId(id)) {
      setError('Usa un ID con minúsculas, números y guiones (ej. maria-garcia).');
      return;
    }
    if (!String(name).trim()) {
      setError('El nombre es obligatorio.');
      return;
    }

    try {
      await onCreate({
        pageId: id,
        name: name.trim(),
        specialty: specialty.trim(),
        vertical: normalizeVertical(vertical),
        draft: aiDraft,
      });
      reset();
    } catch (err) {
      setError(err?.message || 'No se pudo crear la landing.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between border-b px-5 py-4 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Nueva landing</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Elige el tipo de negocio para aplicar textos por defecto. Luego puedes personalizarlos.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={creating}
            className="text-gray-400 hover:text-gray-700 text-lg leading-none px-1"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  Crear contenido con IA
                </p>
                <h3 className="mt-1 font-serif text-lg text-[#2A342D]">
                  Describe para qué necesitas la landing
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
                  Completa el borrador guía. La IA preparará identidad, hero, presentación,
                  servicios y SEO; podrás revisar todo antes de publicar.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-1 text-[9px] font-bold uppercase text-indigo-700">
                Borrador
              </span>
            </div>

            <textarea
              value={brief}
              onChange={(e) => {
                setBrief(e.target.value);
                setAiDraft(null);
                setAiProvider('');
              }}
              rows={11}
              disabled={creating || generatingDraft}
              className="w-full resize-y rounded-xl border border-indigo-200 bg-white p-3 font-mono text-[11px] leading-relaxed text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
              aria-label="Descripción completa de la landing"
              autoFocus
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setBrief(LANDING_BRIEF_TEMPLATE);
                  setAiDraft(null);
                  setAiProvider('');
                }}
                disabled={creating || generatingDraft}
                className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-50"
              >
                Restaurar guía
              </button>
              <button
                type="button"
                onClick={handleGenerateDraft}
                disabled={creating || generatingDraft}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                {generatingDraft ? 'Generando borrador...' : 'Generar borrador con IA'}
              </button>
            </div>

            {aiDraft && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <p className="text-[11px] font-bold text-emerald-800">Borrador listo para crear</p>
                <p className="mt-0.5 text-[10px] text-emerald-700">
                  Se generaron hero, presentación, {aiDraft.services?.length || 0} servicios y SEO.
                  Revisa nombre, tipo de negocio y especialidad debajo.
                </p>
                {aiProvider && (
                  <p className="mt-2 border-t border-emerald-200 pt-2 text-[10px] text-emerald-800">
                    Proveedor utilizado:
                    {' '}
                    <strong>{getAiProviderDisplayName(aiProvider, 'es')}</strong>
                  </p>
                )}
              </div>
            )}
          </section>

          <fieldset className="space-y-2">
            <legend className="block text-[10px] font-bold text-gray-400 uppercase">Tipo de negocio</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VERTICALS.map((item) => {
                const selected = vertical === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleVerticalChange(item.id)}
                    className={`text-left rounded-xl border px-3 py-2.5 transition ${
                      selected
                        ? 'border-[#4A5D4E] bg-[#4A5D4E]/8 ring-1 ring-[#4A5D4E]/30'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <p className={`text-xs font-semibold ${selected ? 'text-[#2A342D]' : 'text-gray-800'}`}>
                      {item.label.es}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{item.description.es}</p>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Nombre profesional</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="María García"
              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">ID del documento</label>
            <input
              type="text"
              value={pageId}
              onChange={(e) => {
                setIdTouched(true);
                setPageId(slugifyPageId(e.target.value));
              }}
              placeholder="maria-garcia"
              className="w-full border p-2.5 text-xs rounded-lg font-mono focus:ring-1 focus:ring-indigo-500 outline-none"
            />
            <p className="text-[10px] text-gray-400">
              Permanente. También se usa en
              {' '}
              <code className="bg-gray-100 px-1 rounded">?pageId=</code>
              {' '}
              y en Storage.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Especialidad (opcional)</label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => {
                setSpecialtyTouched(true);
                setSpecialty(e.target.value);
              }}
              placeholder={getVerticalDefaultSpecialty(vertical, 'es') || 'Ej. consultoría, clínica, despacho'}
              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          {error && (
            <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={creating}
              className="px-4 py-2 text-xs rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 text-xs rounded-lg bg-[#4A5D4E] text-white font-semibold hover:bg-[#3d4d41] disabled:opacity-60"
            >
              {creating ? 'Creando...' : 'Crear landing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
