import { useState } from 'react';
import { isValidPageId, slugifyPageId } from '../utils/pageId';
import {
  DEFAULT_VERTICAL,
  VERTICALS,
  getVerticalDefaultSpecialty,
  normalizeVertical,
} from '@raulizqli/landing-core/verticals';
import { importMetaBusinessProfileRemote } from '../utils/aiAssistFunctions';
import { isFacebookLoginConfigured, loginWithFacebookPages } from '../utils/facebookLogin';
import { PLATFORM_LEGAL_PATHS } from '../utils/platformLegal';

export default function CreatePageModal({
  open,
  onClose,
  onCreate,
  creating = false,
  pageCount = 0,
  pageLimit = null,
}) {
  const [name, setName] = useState('');
  const [pageId, setPageId] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [vertical, setVertical] = useState(DEFAULT_VERTICAL);
  const [idTouched, setIdTouched] = useState(false);
  const [specialtyTouched, setSpecialtyTouched] = useState(false);
  const [error, setError] = useState('');
  const [importingMeta, setImportingMeta] = useState(false);
  const [metaToken, setMetaToken] = useState('');
  const [metaPages, setMetaPages] = useState([]);
  const [metaDraft, setMetaDraft] = useState(null);
  const [metaSource, setMetaSource] = useState(null);

  if (!open) return null;

  const reset = () => {
    setName('');
    setPageId('');
    setSpecialty('');
    setVertical(DEFAULT_VERTICAL);
    setIdTouched(false);
    setSpecialtyTouched(false);
    setError('');
    setImportingMeta(false);
    setMetaToken('');
    setMetaPages([]);
    setMetaDraft(null);
    setMetaSource(null);
  };

  const applyMetaDraft = (draft, source) => {
    if (!draft || typeof draft !== 'object') return;
    const nextName = String(draft.name ?? '').trim();
    if (nextName) {
      setName(nextName);
      if (!idTouched) setPageId(slugifyPageId(nextName));
    }
    const nextSpecialty = String(draft.specialty ?? '').trim();
    if (nextSpecialty) {
      setSpecialty(nextSpecialty);
      setSpecialtyTouched(true);
    }
    if (draft.vertical) {
      setVertical(normalizeVertical(draft.vertical));
    }
    setMetaDraft(draft);
    setMetaSource(source || null);
  };

  const importFromMeta = async ({ token, facebookPageId } = {}) => {
    setError('');
    setImportingMeta(true);
    try {
      const userAccessToken = token || metaToken || await loginWithFacebookPages();
      setMetaToken(userAccessToken);
      const result = await importMetaBusinessProfileRemote({
        userAccessToken,
        facebookPageId: facebookPageId || '',
      });
      const pages = Array.isArray(result?.pages) ? result.pages : [];
      setMetaPages(pages);
      if (result?.needsPageChoice) {
        setMetaDraft(null);
        setMetaSource(null);
        return;
      }
      applyMetaDraft(result?.draft, result?.source);
    } catch (err) {
      setError(err?.message || 'No se pudo importar desde Facebook.');
    } finally {
      setImportingMeta(false);
    }
  };

  const handleClose = () => {
    if (creating || importingMeta) return;
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
        draft: metaDraft,
      });
      reset();
    } catch (err) {
      setError(err?.message || 'No se pudo crear la landing.');
    }
  };

  const quotaLabel = pageLimit == null
    ? null
    : `${pageCount} / ${pageLimit}`;
  const facebookReady = isFacebookLoginConfigured();
  const busy = creating || importingMeta;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between border-b px-5 py-4 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Nueva landing</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Importa una Página de Facebook o completa los datos a mano.
            </p>
            {quotaLabel && (
              <p className="mt-1 text-[10px] font-semibold text-indigo-600">
                Páginas en tu plan: {quotaLabel}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="text-gray-400 hover:text-gray-700 text-lg leading-none px-1"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <section className="rounded-2xl border border-[#1877F2]/20 bg-[#1877F2]/5 p-4 space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#1877F2]">
                Facebook / Instagram
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
                El dueño de la Página autoriza el acceso. No pedimos contraseña.
                Instagram debe ser cuenta profesional vinculada a esa Página.
              </p>
              <p className="mt-2 text-[10px] leading-relaxed text-gray-500">
                Al conectar aceptas la{' '}
                <a href={PLATFORM_LEGAL_PATHS.privacy} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#1877F2]">
                  política de privacidad
                </a>
                {', '}
                <a href={PLATFORM_LEGAL_PATHS.terms} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#1877F2]">
                  condiciones de servicio
                </a>
                {' '}y la{' '}
                <a href={PLATFORM_LEGAL_PATHS.dataDeletion} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#1877F2]">
                  eliminación de datos
                </a>
                .
              </p>
            </div>
            <button
              type="button"
              disabled={busy || !facebookReady}
              onClick={() => importFromMeta()}
              className="w-full rounded-lg bg-[#1877F2] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#166fe0] disabled:opacity-60"
            >
              {importingMeta ? 'Importando…' : 'Conectar Facebook'}
            </button>
            {!facebookReady && (
              <p className="text-[10px] text-amber-700">
                Falta configurar <code className="bg-white/80 px-1 rounded">VITE_FACEBOOK_APP_ID</code>
                {' '}y las claves Meta en Functions.
              </p>
            )}
            {metaSource?.facebookName && (
              <p className="text-[11px] text-[#2A342D]">
                Importado: <strong>{metaSource.facebookName}</strong>
                {metaSource.instagram ? ` · @${metaSource.instagram}` : ''}
              </p>
            )}
            {metaPages.length > 1 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase text-gray-400">Elige la Página</p>
                <div className="grid gap-1.5">
                  {metaPages.map((page) => (
                    <button
                      key={page.id}
                      type="button"
                      disabled={busy}
                      onClick={() => importFromMeta({ facebookPageId: page.id })}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs hover:border-[#1877F2]"
                    >
                      {page.pictureUrl ? (
                        <img src={page.pictureUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <span className="h-8 w-8 rounded-full bg-gray-100" />
                      )}
                      <span>
                        <span className="block font-semibold text-gray-800">{page.name}</span>
                        <span className="text-[10px] text-gray-400">
                          {page.category || 'Página'}
                          {page.hasInstagram ? ' · Instagram' : ''}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
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
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-indigo-100 bg-indigo-50 text-indigo-400 hover:bg-indigo-100'
                    }`}
                  >
                    <p className={`text-xs font-semibold ${selected ? 'text-white' : 'text-indigo-700'}`}>
                      {item.label.es}
                    </p>
                    <p className={`text-[10px] mt-0.5 leading-snug ${selected ? 'text-indigo-100' : 'text-indigo-400'}`}>
                      {item.description.es}
                    </p>
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
              autoFocus
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
              disabled={busy}
              className="px-4 py-2 text-xs rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 text-xs rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 disabled:opacity-60"
            >
              {creating ? 'Creando...' : 'Crear landing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
