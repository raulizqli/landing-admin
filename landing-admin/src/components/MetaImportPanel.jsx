import { useState } from 'react';
import { importMetaBusinessProfileRemote } from '../utils/aiAssistFunctions';
import { isFacebookLoginConfigured, loginWithFacebookPages } from '../utils/facebookLogin';
import { PLATFORM_LEGAL_PATHS } from '../utils/platformLegal';
import { useEntitlements } from '../hooks/useEntitlements';
import { useLocale } from '../i18n/LocaleContext';

function formatImportedAt(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
}

export default function MetaImportPanel({
  connectedSource = null,
  onImported,
  disabled = false,
  onUpgradePlan,
}) {
  const entitlements = useEntitlements();
  const { t } = useLocale();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [pages, setPages] = useState([]);

  const canImport = entitlements.bypass || entitlements.canUseMetaImport;
  const facebookReady = isFacebookLoginConfigured();
  const facebookPageId = String(connectedSource?.facebookPageId ?? '').trim();
  const connected = Boolean(facebookPageId);
  const busy = disabled || importing || !canImport;

  const importFromMeta = async ({ facebookPageId: nextPageId = '', pickAnother = false } = {}) => {
    if (!canImport) {
      setError(t('billing.features.metaImportLocked'));
      onUpgradePlan?.();
      return;
    }
    setError('');
    setImporting(true);
    try {
      const userAccessToken = token || await loginWithFacebookPages();
      setToken(userAccessToken);
      const preferredPageId = pickAnother ? '' : (nextPageId || facebookPageId);
      const result = await importMetaBusinessProfileRemote({
        userAccessToken,
        facebookPageId: preferredPageId,
      });
      const nextPages = Array.isArray(result?.pages) ? result.pages : [];
      setPages(nextPages);
      if (result?.needsPageChoice) {
        return;
      }
      onImported?.({
        draft: result?.draft,
        source: result?.source,
      });
    } catch (err) {
      setError(err?.message || 'No se pudo importar desde Facebook.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#1877F2]/20 bg-[#1877F2]/5 p-4 space-y-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#1877F2]">
          Facebook / Instagram
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
          {connected
            ? 'Recarga si cambiaste datos en tu Página. La vista previa se actualiza al instante; guarda para publicar.'
            : 'El dueño de la Página autoriza el acceso. No pedimos contraseña. Instagram debe ser cuenta profesional vinculada a esa Página.'}
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

      {connected && connectedSource?.facebookName ? (
        <p className="text-[11px] text-[#2A342D]">
          Conectado: <strong>{connectedSource.facebookName}</strong>
          {connectedSource.instagram ? ` · @${connectedSource.instagram}` : ''}
          {formatImportedAt(connectedSource.importedAt) ? (
            <span className="block text-[10px] text-gray-500 mt-0.5">
              Última recarga: {formatImportedAt(connectedSource.importedAt)}
            </span>
          ) : null}
        </p>
      ) : null}

      <div className={connected ? 'grid gap-2 sm:grid-cols-2' : ''}>
        <button
          type="button"
          disabled={busy || !facebookReady}
          onClick={() => importFromMeta({ facebookPageId })}
          className="w-full rounded-lg bg-[#1877F2] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#166fe0] disabled:opacity-60"
        >
          {importing
            ? (connected ? 'Recargando…' : 'Importando…')
            : (connected ? 'Recargar datos' : 'Conectar Facebook')}
        </button>
        {connected ? (
          <button
            type="button"
            disabled={busy || !facebookReady}
            onClick={() => importFromMeta({ pickAnother: true })}
            className="w-full rounded-lg border border-[#1877F2]/30 bg-white px-4 py-2.5 text-xs font-semibold text-[#1877F2] hover:bg-[#1877F2]/5 disabled:opacity-60"
          >
            Conectar otra Página
          </button>
        ) : null}
      </div>

      {!facebookReady && (
        <p className="text-[10px] text-amber-700">
          Falta configurar <code className="bg-white/80 px-1 rounded">VITE_FACEBOOK_APP_ID</code>
          {' '}y las claves Meta en Functions.
        </p>
      )}

      {pages.length > 1 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase text-gray-400">Elige la Página</p>
          <div className="grid gap-1.5">
            {pages.map((page) => (
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

      {error ? (
        <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      ) : null}
    </section>
  );
}
