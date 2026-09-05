import ImageUrlField from './ImageUrlField';
import QrCodeCard from './QrCodeCard';
import {
  buildExpeditionPublicUrl,
  createEmptyExpeditionDocument,
  slugifyExpeditionSegment,
} from '../utils/expeditionDocuments';

export default function ExpeditionDocumentsFieldsEditor({
  formData,
  onChange,
  pageId,
  pageOpenUrl = '',
}) {
  const items = Array.isArray(formData.expeditionDocuments) ? formData.expeditionDocuments : [];
  const ownerName = String(formData.name ?? '').trim();

  const updateItems = (nextItems) => {
    onChange({ ...formData, expeditionDocuments: nextItems });
  };

  const updateItem = (index, field, value) => {
    updateItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => {
    updateItems([...items, createEmptyExpeditionDocument()]);
  };

  const removeItem = (index) => {
    updateItems(items.filter((_, i) => i !== index));
  };

  const moveItem = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    updateItems(next);
  };

  return (
    <div className="space-y-3 pt-2 border-t">
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase">
          Documentos de expedición
        </label>
        <p className="text-[10px] text-gray-400 mt-1 leading-snug">
          Datos del profesional (compartidos) y un certificado por documento, con imagen y QR en /expedicion.
          Solo se publican ítems con imagen. Guarda y publica para que el QR funcione.
        </p>
      </div>

      <fieldset className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
        <legend className="px-1 text-[10px] font-bold text-gray-400 uppercase">Datos generales</legend>
        <p className="text-[10px] text-gray-400 leading-snug">
          Aplican a todos los documentos. El nombre vacío usa el de la landing.
        </p>
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">Profesional que lo emite</label>
          <input
            type="text"
            value={formData.expeditionIssuerName || ''}
            onChange={(e) => onChange({ ...formData, expeditionIssuerName: e.target.value })}
            placeholder={ownerName || 'Nombre del profesional'}
            className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">Cédula profesional</label>
          <input
            type="text"
            value={formData.expeditionLicenseNumber || ''}
            onChange={(e) => onChange({ ...formData, expeditionLicenseNumber: e.target.value })}
            placeholder="12345678"
            className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
          />
        </div>
      </fieldset>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase">Cada documento</p>
        <button
          type="button"
          onClick={addItem}
          className="shrink-0 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
        >
          + Añadir documento
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 p-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Aún no hay documentos. Añade constancia, informe u otro certificado con su escaneo.
          </p>
        </div>
      ) : null}

      {items.map((item, index) => {
        const slug = slugifyExpeditionSegment(
          item.slug || item.documentType || item.folio || item.id,
          `documento-${index + 1}`,
        );
        const publicUrl = item.imageUrl ? buildExpeditionPublicUrl(pageOpenUrl, slug) : '';
        return (
          <div key={item.id || `expedition-editor-${index}`} className="border rounded-lg p-4 space-y-3 bg-gray-50/80">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gray-700">Documento {index + 1}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  className="text-[11px] text-gray-500 hover:text-gray-700 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, 1)}
                  disabled={index === items.length - 1}
                  className="text-[11px] text-gray-500 hover:text-gray-700 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-[11px] text-red-500 hover:text-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Tipo de documento</label>
                <input
                  type="text"
                  value={item.documentType || ''}
                  onChange={(e) => updateItem(index, 'documentType', e.target.value)}
                  placeholder="Constancia, informe, receta…"
                  className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Folio</label>
                <input
                  type="text"
                  value={item.folio || ''}
                  onChange={(e) => updateItem(index, 'folio', e.target.value)}
                  placeholder="A-1024"
                  className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Fecha de emisión</label>
                <input
                  type="date"
                  value={item.issuedAt || ''}
                  onChange={(e) => updateItem(index, 'issuedAt', e.target.value)}
                  className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Slug de la URL</label>
                <input
                  type="text"
                  value={item.slug || ''}
                  onChange={(e) => updateItem(index, 'slug', e.target.value)}
                  placeholder={slug}
                  className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                />
                <p className="text-[10px] text-gray-400">
                  Vacío = se genera del tipo o folio. El QR apunta a /expedicion/{slug}
                </p>
              </div>
            </div>

            <ImageUrlField
              label="Imagen del documento"
              value={item.imageUrl || ''}
              onChange={(imageUrl) => updateItem(index, 'imageUrl', imageUrl)}
              pageId={pageId}
              pageData={formData}
              uploadFolder={`expedition-${index + 1}`}
              placeholder="https://ejemplo.com/documento.jpg"
              previewClassName="h-24 w-20 object-contain border bg-white rounded"
              previewAlt={`Vista previa documento ${index + 1}`}
              helperText="Sube un escaneo nítido (JPG, PNG o WebP)."
            />

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto alternativo (opcional)</label>
              <input
                type="text"
                value={item.alt || ''}
                onChange={(e) => updateItem(index, 'alt', e.target.value)}
                placeholder="Escaneo del certificado"
                className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
              />
            </div>

            <QrCodeCard
              key={publicUrl || item.id || `expedition-qr-${index}`}
              title={item.documentType || item.folio || `Documento ${index + 1}`}
              subtitle={publicUrl || 'Falta imagen o URL pública del sitio'}
              url={publicUrl}
              filename={`qr-expedicion-${slug}.png`}
            />
          </div>
        );
      })}
    </div>
  );
}
