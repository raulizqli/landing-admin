import { useMemo } from 'react';
import { getSocialLinks } from '../utils/socialLinks';
import QrCodeCard from './QrCodeCard';

function slugify(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^\w]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'qr';
}

/**
 * Admin-only QR previews/downloads for the public site URL and filled socials.
 * `qrCodeLimit`: number = max codes (Pro = 2); null = unlimited (Agency+).
 */
export default function QrCodesSection({
  formData,
  pageId = '',
  pageOpenUrl = '',
  qrCodeLimit = null,
  onUpgrade,
}) {
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

  const limited = qrCodeLimit != null && Number.isFinite(qrCodeLimit);
  const visibleItems = limited ? items.slice(0, Math.max(0, Number(qrCodeLimit))) : items;
  const hiddenCount = limited ? Math.max(0, items.length - visibleItems.length) : 0;

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
        {limited ? (
          <>
            {' '}
            Plan Pro: hasta {qrCodeLimit} códigos QR
            {hiddenCount > 0 ? ` (${hiddenCount} ocultos).` : '.'}
            {hiddenCount > 0 && onUpgrade ? (
              <>
                {' '}
                <button
                  type="button"
                  onClick={onUpgrade}
                  className="font-semibold text-[#4A5D4E] underline underline-offset-2 hover:text-[#3d4d41]"
                >
                  Agency = ilimitados
                </button>
              </>
            ) : null}
          </>
        ) : null}
      </p>
      {visibleItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/80 p-4">
          <p className="text-xs text-amber-900 leading-relaxed">
            Tu plan no permite generar códigos QR en este momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visibleItems.map((item) => (
            <QrCodeCard
              key={item.url || item.id}
              title={item.title}
              subtitle={item.subtitle}
              url={item.url}
              filename={item.filename}
            />
          ))}
        </div>
      )}
    </div>
  );
}
