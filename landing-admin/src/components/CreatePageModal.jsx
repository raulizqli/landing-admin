import { useState } from 'react';
import { isValidPageId, slugifyPageId } from '../utils/pageId';

export default function CreatePageModal({ open, onClose, onCreate, creating = false }) {
  const [name, setName] = useState('');
  const [pageId, setPageId] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [idTouched, setIdTouched] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const reset = () => {
    setName('');
    setPageId('');
    setSpecialty('');
    setIdTouched(false);
    setError('');
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
      await onCreate({ pageId: id, name: name.trim(), specialty: specialty.trim() });
      reset();
    } catch (err) {
      setError(err?.message || 'No se pudo crear la landing.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Nueva landing</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Se guarda en el proyecto hub. Más adelante puedes migrarla a la cuenta Firebase del cliente.
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
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Psicología clínica"
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
              className="px-3 py-2 text-xs rounded-lg border text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-3 py-2 text-xs rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {creating ? 'Creando...' : 'Crear y abrir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
