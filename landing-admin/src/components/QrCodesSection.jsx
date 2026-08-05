import { useEffect, useMemo, useState } from 'react';
import { getSocialLinks } from '../utils/socialLinks';
import { downloadPng, toDataUrl } from '../utils/qrCode';

function slugify(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^\w]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'qr';
}

function QrCard({ title, subtitle, url, filename }) {
  const [dataUrl, setDataUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDataUrl('');
    setError('');
    if (!url) return undefined;

    (async () => {
      try {
        const next = await toDataUrl(url, { width: 256 });
        if (!cancelled) setDataUrl(next);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'No se pudo generar el QR');
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
        {dataUrl ? (
          <img src={dataUrl} alt={`QR ${title}`} className="w-28 h-28" />
        ) : error ? (
          <p className="text-[10px] text-red-600 text-center px-2">{error}</p>
        ) : (
          <p className="text-[10px] text-gray-400">Generando…</p>
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

/**
 * Admin-only QR previews/downloads for the public site URL and filled socials.
 */
export default function QrCodesSection({ formData, pageId = '', pageOpenUrl = '' }) {
  const siteUrl = String(pageOpenUrl ?? '').trim();
  const socialItems = useMemo(() => getSocialLinks(formData), [formData]);

  const items = useMemo(() => {
    const list = [];
    if (siteUrl && /^https?:\/\//i.test(siteUrl)) {
      list.push({
        id: 'site',
        title: 'Sitio',
        subtitle: siteUrl,
        url: siteUrl,
        filename: `qr-site-${slugify(pageId)}.png`,
      });
    }
    socialItems.forEach((link) => {
      list.push({
        id: link.key,
        title: link.label,
        subtitle: link.href,
        url: link.href,
        filename: `qr-${slugify(link.key)}-${slugify(pageId)}.png`,
      });
    });
    return list;
  }, [siteUrl, socialItems, pageId]);

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 p-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          Configura la URL pública del sitio (hosting o dominio) o al menos una red social para generar códigos QR.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-gray-500 leading-relaxed">
        Vista previa y descarga PNG. Los QR no se muestran en la landing pública.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <QrCard
            key={item.id}
            title={item.title}
            subtitle={item.subtitle}
            url={item.url}
            filename={item.filename}
          />
        ))}
      </div>
    </div>
  );
}
