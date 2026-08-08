import { useEffect, useState } from 'react';
import { listPageAuditsRemote } from '../utils/inboxFunctions';

function formatWhen(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export default function PageAuditSection({ pageId }) {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState('');

  useEffect(() => {
    const id = String(pageId ?? '').trim();
    if (!id || id === 'preview-demo') {
      setAudits([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const list = await listPageAuditsRemote({ pageId: id, limit: 30 });
        if (!cancelled) setAudits(list);
      } catch (err) {
        if (!cancelled) setError(err.message || 'No se pudo cargar el historial.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageId]);

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-gray-500">
        Quién guardó y qué campos cambiaron. El detalle guarda before/after de las claves tocadas.
      </p>
      {loading && <p className="text-xs text-gray-400">Cargando historial…</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!loading && !error && audits.length === 0 && (
        <p className="text-xs text-gray-400">Aún no hay cambios registrados.</p>
      )}
      <ul className="space-y-2">
        {audits.map((audit) => {
          const open = expandedId === audit.id;
          const keys = Array.isArray(audit.changedKeys) ? audit.changedKeys : [];
          return (
            <li key={audit.id} className="rounded-lg border border-gray-200 bg-white">
              <button
                type="button"
                onClick={() => setExpandedId(open ? '' : audit.id)}
                className="w-full text-left px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {audit.actorEmail || audit.actorUid || 'Usuario'}
                      <span className="ml-1 font-normal text-gray-400 uppercase text-[10px]">
                        {audit.actorRole}
                      </span>
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {formatWhen(audit.createdAt)}
                      {keys.length > 0 && (
                        <span className="ml-1">· {keys.slice(0, 6).join(', ')}{keys.length > 6 ? '…' : ''}</span>
                      )}
                    </p>
                  </div>
                  <span className="text-[10px] text-indigo-600 shrink-0">{open ? 'Ocultar' : 'Detalle'}</span>
                </div>
              </button>
              {open && (
                <div className="border-t border-gray-100 px-3 py-2 grid gap-2 sm:grid-cols-2 text-[10px] font-mono">
                  <div>
                    <p className="font-sans font-bold uppercase text-gray-400 mb-1">Antes</p>
                    <pre className="whitespace-pre-wrap break-all bg-gray-50 rounded p-2 max-h-48 overflow-auto">
                      {JSON.stringify(audit.before || {}, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="font-sans font-bold uppercase text-gray-400 mb-1">Después</p>
                    <pre className="whitespace-pre-wrap break-all bg-gray-50 rounded p-2 max-h-48 overflow-auto">
                      {JSON.stringify(audit.after || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
