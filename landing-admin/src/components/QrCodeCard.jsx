import { useEffect, useState } from 'react';
import { downloadPng, toDataUrl } from '../utils/qrCode';

export default function QrCodeCard({ title, subtitle, url, filename }) {
  const [dataUrl, setDataUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!url) return undefined;

    (async () => {
      try {
        const next = await toDataUrl(url, { width: 256 });
        if (!cancelled) {
          setError('');
          setDataUrl(next);
        }
      } catch (err) {
        if (!cancelled) {
          setDataUrl('');
          setError(err?.message || 'No se pudo generar el QR');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  const handleDownload = async () => {
    if (!url || busy) return;
    setBusy(true);
    setError('');
    try {
      const png = dataUrl || (await toDataUrl(url, { width: 512 }));
      downloadPng(png, filename);
    } catch (err) {
      setError(err?.message || 'No se pudo descargar el QR');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3 flex flex-col gap-2">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[#2A342D] truncate">{title}</p>
        {subtitle ? (
          <p className="text-[10px] text-gray-500 truncate mt-0.5" title={subtitle}>
            {subtitle}
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-center rounded-md bg-[#F4F1EA] p-3 min-h-[140px]">
        {url ? (
          dataUrl ? (
            <img src={dataUrl} alt={`QR ${title}`} className="w-28 h-28" />
          ) : error ? (
            <p className="text-[10px] text-red-600 text-center px-2">{error}</p>
          ) : (
            <p className="text-[10px] text-gray-400">Generando…</p>
          )
        ) : (
          <p className="text-[10px] text-gray-400 text-center px-2">
            Configura el dominio o la URL pública para generar el QR.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={!url || busy || Boolean(error && !dataUrl)}
        className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-[#4A5D4E] text-white hover:bg-[#3d4d41] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy ? 'Descargando…' : 'Descargar PNG'}
      </button>
    </div>
  );
}
