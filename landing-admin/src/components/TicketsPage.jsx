import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSwitcher } from '../i18n/LocaleContext';
import { db } from '../firebase';
import { listPageDocuments } from '../utils/firestoreAccess';
import {
  canManageCmsTickets,
  filterAccessiblePages,
  getAccessiblePageIds,
  getRoleLabel,
} from '../utils/permissions';
import {
  createCmsTicketRemote,
  listCmsTicketsRemote,
  updateCmsTicketRemote,
} from '../utils/inboxFunctions';

const CATEGORIES = [
  { value: 'support', label: 'Soporte' },
  { value: 'deploy', label: 'Deploy' },
  { value: 'billing', label: 'Billing' },
  { value: 'content', label: 'Contenido' },
  { value: 'other', label: 'Otro' },
];

const STATUSES = [
  { value: 'open', label: 'Abierto' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'resolved', label: 'Resuelto' },
  { value: 'closed', label: 'Cerrado' },
];

function formatWhen(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export default function TicketsPage() {
  const { user, profile, signOut } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusTicketId = searchParams.get('ticketId') || '';

  const [pages, setPages] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({
    pageId: '',
    category: 'support',
    subject: '',
    body: '',
  });

  const accessiblePages = useMemo(
    () => (profile ? filterAccessiblePages(pages, profile) : []),
    [pages, profile],
  );

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    setError('');
    try {
      const allowedIds = getAccessiblePageIds(profile);
      const list = allowedIds === null
        ? await listPageDocuments(db)
        : await listPageDocuments(db, { pageIds: allowedIds });
      setPages(list);
      const ticketList = await listCmsTicketsRemote({
        status: statusFilter || undefined,
        limit: 80,
      });
      setTickets(ticketList);
      if (!draft.pageId && list[0]?.id) {
        setDraft((current) => ({ ...current, pageId: list[0].id }));
      }
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !canManageCmsTickets(profile)) return;
    load();
  }, [user, profile, statusFilter]);

  if (!user || !canManageCmsTickets(profile)) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F4F1EA] p-6">
        <div className="max-w-md bg-white border rounded-2xl p-6 text-center">
          <p className="text-sm text-gray-600">Solo root o admin pueden gestionar tickets.</p>
          <Link to="/app/inbox" className="mt-4 inline-block text-sm font-semibold text-indigo-600">Ir al inbox</Link>
        </div>
      </div>
    );
  }

  const handleCreate = async (event) => {
    event.preventDefault();
    setCreating(true);
    setError('');
    try {
      const result = await createCmsTicketRemote(draft);
      setDraft((current) => ({ ...current, subject: '', body: '' }));
      await load();
      if (result?.ticketId) {
        setSearchParams({ ticketId: result.ticketId });
      }
    } catch (err) {
      setError(err.message || 'No se pudo crear el ticket.');
    } finally {
      setCreating(false);
    }
  };

  const handleStatus = async (ticketId, status) => {
    setError('');
    try {
      await updateCmsTicketRemote({ ticketId, status });
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el ticket.');
    }
  };

  return (
    <div className="flex h-dvh w-full flex-col bg-[#F4F1EA] text-[#2A342D] overflow-hidden font-sans">
      <header className="shrink-0 border-b border-[#2A342D]/10 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#4A5D4E]/70">CMS</p>
            <h1 className="font-serif text-2xl">Tickets / incidencias</h1>
            <p className="text-xs text-[#2A342D]/60 mt-0.5">{getRoleLabel(profile?.role)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LanguageSwitcher className="text-[#2A342D]" />
            <Link to="/app/inbox" className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50">
              Inbox
            </Link>
            <Link to="/app" className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50">
              Editor
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-5 grid gap-6 lg:grid-cols-[320px_1fr]">
          <form onSubmit={handleCreate} className="rounded-2xl border bg-white p-4 space-y-3 h-fit">
            <h2 className="text-sm font-bold">Nuevo ticket</h2>
            <label className="block text-[11px]">
              <span className="font-bold uppercase text-gray-400">Página</span>
              <select
                value={draft.pageId}
                onChange={(e) => setDraft({ ...draft, pageId: e.target.value })}
                className="mt-1 w-full rounded-lg border p-2 text-xs"
                required
              >
                <option value="">Selecciona…</option>
                {accessiblePages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.name || page.id} ({page.id})
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[11px]">
              <span className="font-bold uppercase text-gray-400">Categoría</span>
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                className="mt-1 w-full rounded-lg border p-2 text-xs"
              >
                {CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="block text-[11px]">
              <span className="font-bold uppercase text-gray-400">Asunto</span>
              <input
                value={draft.subject}
                onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                className="mt-1 w-full rounded-lg border p-2 text-xs"
                required
              />
            </label>
            <label className="block text-[11px]">
              <span className="font-bold uppercase text-gray-400">Detalle</span>
              <textarea
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                rows={4}
                className="mt-1 w-full rounded-lg border p-2 text-xs"
              />
            </label>
            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-lg bg-[#4A5D4E] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {creating ? 'Creando…' : 'Crear ticket'}
            </button>
          </form>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border bg-white px-2 py-1.5 text-xs"
              >
                <option value="">Todos los estados</option>
                {STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={load}
                className="rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold"
              >
                Actualizar
              </button>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {loading && <p className="text-sm text-gray-500">Cargando…</p>}
            {!loading && tickets.length === 0 && (
              <p className="text-sm text-gray-500">No hay tickets.</p>
            )}

            <ul className="space-y-2">
              {tickets.map((ticket) => {
                const focused = ticket.id === focusTicketId;
                return (
                  <li
                    key={ticket.id}
                    id={`ticket-${ticket.id}`}
                    className={`rounded-xl border bg-white p-4 ${focused ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200'}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
                          {ticket.category} · {ticket.pageId} · {ticket.source || 'cms'}
                        </p>
                        <h3 className="text-sm font-semibold mt-0.5">{ticket.subject}</h3>
                        <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{ticket.body}</p>
                        <p className="text-[11px] text-gray-400 mt-2">
                          {formatWhen(ticket.updatedAt || ticket.createdAt)}
                        </p>
                      </div>
                      <select
                        value={ticket.status || 'open'}
                        onChange={(e) => handleStatus(ticket.id, e.target.value)}
                        className="rounded-lg border px-2 py-1 text-xs"
                      >
                        {STATUSES.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-2">
                      <Link
                        to={`/app?pageId=${encodeURIComponent(ticket.pageId || '')}`}
                        className="text-[11px] font-semibold text-indigo-600"
                      >
                        Abrir página
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
