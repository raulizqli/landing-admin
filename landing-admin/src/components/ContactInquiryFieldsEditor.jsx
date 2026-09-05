import { useEffect, useState } from 'react';
import { DEFAULT_CONTACT_FORM_PROJECT_TYPES } from '@raulizqli/landing-core/contactInquiry';
import ShowContentToggle from './ShowContentToggle';
import { listPageInquiriesRemote } from '../utils/inquiryFunctions';

export default function ContactInquiryFieldsEditor({
  formData,
  onChange,
  pageId = '',
}) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const enabled = formData?.contactFormEnabled === true;

  useEffect(() => {
    if (!enabled || !pageId) {
      setInquiries([]);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await listPageInquiriesRemote({ pageId, limit: 40 });
        if (!cancelled) setInquiries(Array.isArray(data?.inquiries) ? data.inquiries : []);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'No se pudieron cargar las consultas.');
          setInquiries([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, pageId]);

  const resetTypes = () => {
    onChange({
      ...formData,
      contactFormProjectTypes: DEFAULT_CONTACT_FORM_PROJECT_TYPES.map((item) => ({ ...item })),
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
      <ShowContentToggle
        checked={enabled}
        onChange={(contactFormEnabled) => onChange({ ...formData, contactFormEnabled })}
        label="Mostrar formulario de cotización"
        hint="Nombre, tipo de proyecto, email/WhatsApp y mensaje. Al enviar abre WhatsApp y guarda la consulta."
      />
      <ShowContentToggle
        checked={formData?.floatingWhatsappEnabled !== false}
        onChange={(floatingWhatsappEnabled) => onChange({ ...formData, floatingWhatsappEnabled })}
        label="Botón flotante de WhatsApp"
        hint="Aparece en la esquina inferior derecha del sitio público (no en el espejo)."
      />

      {enabled && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase text-gray-400">Tipos de proyecto</p>
            <button
              type="button"
              onClick={resetTypes}
              className="text-[10px] font-medium text-indigo-600 hover:underline"
            >
              Restaurar predeterminados
            </button>
          </div>
          <p className="text-[10px] text-gray-400">
            Si no configuras tipos, el sitio usa la lista por defecto (grabación, mezcla, etc.).
          </p>
        </div>
      )}

      {enabled && pageId && (
        <div className="space-y-2 border-t border-gray-200 pt-3">
          <p className="text-[10px] font-bold uppercase text-gray-400">Consultas recientes</p>
          {loading && <p className="text-xs text-gray-500">Cargando…</p>}
          {error && <p className="text-xs text-amber-700">{error}</p>}
          {!loading && !error && inquiries.length === 0 && (
            <p className="text-xs text-gray-500">Aún no hay consultas guardadas.</p>
          )}
          <ul className="max-h-56 space-y-2 overflow-y-auto">
            {inquiries.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-gray-200 bg-white p-2.5 text-xs text-gray-700"
              >
                <p className="font-semibold text-gray-900">{item.name || 'Sin nombre'}</p>
                <p className="text-gray-500">{item.projectType} · {item.contact}</p>
                <p className="mt-1 line-clamp-3 text-gray-600">{item.message}</p>
                {item.createdAt ? (
                  <p className="mt-1 text-[10px] text-gray-400">{String(item.createdAt).slice(0, 19)}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
