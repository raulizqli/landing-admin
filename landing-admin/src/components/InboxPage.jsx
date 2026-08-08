import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSwitcher } from '../i18n/LocaleContext';
import { useInboxNotifications } from '../hooks/useInboxNotifications';
import { canManageCmsTickets, canUseCmsInbox, getRoleLabel } from '../utils/permissions';

function formatWhen(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export default function InboxPage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const {
    enabled,
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
  } = useInboxNotifications({ pollMs: 45000 });

  if (!user || !canUseCmsInbox(profile, user.uid)) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F4F1EA] p-6">
        <div className="max-w-md bg-white border rounded-2xl p-6 text-center">
          <p className="text-sm text-gray-600">No tienes acceso al inbox.</p>
          <Link to="/app" className="mt-4 inline-block text-sm font-semibold text-indigo-600">Volver al CMS</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-full flex-col bg-[#F4F1EA] text-[#2A342D] overflow-hidden font-sans">
      <header className="shrink-0 border-b border-[#2A342D]/10 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#4A5D4E]/70">CMS</p>
            <h1 className="font-serif text-2xl">Inbox</h1>
            <p className="text-xs text-[#2A342D]/60 mt-0.5">
              {unreadCount > 0 ? `${unreadCount} sin leer` : 'Sin pendientes'}
              {' · '}
              {getRoleLabel(profile?.role)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LanguageSwitcher className="text-[#2A342D]" />
            {canManageCmsTickets(profile) && (
              <Link
                to="/app/tickets"
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
              >
                Tickets
              </Link>
            )}
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
        <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="rounded-lg bg-[#4A5D4E] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'Actualizando…' : 'Actualizar'}
            </button>
            <button
              type="button"
              onClick={() => markAllRead()}
              disabled={!unreadCount}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            >
              Marcar todo leído
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {!enabled && <p className="text-sm text-gray-500">Inbox no disponible para este rol.</p>}
          {enabled && !loading && notifications.length === 0 && (
            <p className="text-sm text-gray-500">No hay notificaciones.</p>
          )}

          <ul className="space-y-2">
            {notifications.map((item) => {
              const unread = item.status === 'unread';
              return (
                <li
                  key={item.id}
                  className={`rounded-xl border bg-white p-4 ${unread ? 'border-indigo-200 shadow-sm' : 'border-gray-200'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
                        {item.type || 'notice'}
                        {item.pageId ? ` · ${item.pageId}` : ''}
                      </p>
                      <h2 className="text-sm font-semibold mt-0.5">{item.title}</h2>
                      <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{item.body}</p>
                      <p className="text-[11px] text-gray-400 mt-2">{formatWhen(item.createdAt)}</p>
                    </div>
                    {unread && (
                      <span className="shrink-0 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5">
                        Nuevo
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.href && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (unread) await markRead(item.id);
                          navigate(item.href);
                        }}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Abrir
                      </button>
                    )}
                    {unread && (
                      <button
                        type="button"
                        onClick={() => markRead(item.id)}
                        className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                      >
                        Marcar leído
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    </div>
  );
}
