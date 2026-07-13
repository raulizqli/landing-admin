import {
  createEmptyCustomEmbed,
  EMBED_PLACEMENTS,
  getPlacementLabel,
  normalizeCustomEmbeds,
} from '../utils/customEmbeds';

export default function CustomEmbedsFieldsEditor({ formData, onChange }) {
  const items = Array.isArray(formData.customEmbeds) && formData.customEmbeds.length > 0
    ? normalizeCustomEmbeds(formData.customEmbeds)
    : [createEmptyCustomEmbed()];

  const updateItems = (nextItems) => {
    onChange({ ...formData, customEmbeds: nextItems });
  };

  const updateItem = (index, field, value) => {
    updateItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => {
    updateItems([...items, createEmptyCustomEmbed({ sortOrder: items.length })]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) {
      updateItems([createEmptyCustomEmbed()]);
      return;
    }
    updateItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 pt-2 border-t">
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase">
          Código e integraciones
        </label>
        <p className="text-[10px] text-gray-400 mt-1">
          Pega HTML o scripts de Calendly, PayPal, chat en vivo, formularios u otros widgets. Elige dónde aparece en la página.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[10px] text-gray-400">Solo pega código de fuentes confiables.</p>
        <button
          type="button"
          onClick={addItem}
          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
        >
          + Añadir bloque
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id || `custom-embed-${index}`} className="border rounded-xl p-4 bg-gray-50 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={item.enabled !== false}
                  onChange={(e) => updateItem(index, 'enabled', e.target.checked)}
                  className="rounded border-gray-300"
                />
                Activo
              </label>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-[10px] text-red-600 hover:underline"
              >
                Eliminar
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Nombre interno</label>
                <input
                  type="text"
                  value={item.label || ''}
                  onChange={(e) => updateItem(index, 'label', e.target.value)}
                  placeholder="Calendly citas"
                  className="w-full border rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Posición en la página</label>
                <select
                  value={item.placement || 'after_contact'}
                  onChange={(e) => updateItem(index, 'placement', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-xs"
                >
                  {EMBED_PLACEMENTS.map((placement) => (
                    <option key={placement.value} value={placement.value}>
                      {placement.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Título visible (opcional)</label>
              <input
                type="text"
                value={item.title || ''}
                onChange={(e) => updateItem(index, 'title', e.target.value)}
                placeholder="Reserva tu cita"
                className="w-full border rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Código HTML / embed</label>
              <textarea
                rows={8}
                value={item.htmlCode || ''}
                onChange={(e) => updateItem(index, 'htmlCode', e.target.value)}
                placeholder={'<div class="calendly-inline-widget" data-url="https://calendly.com/..."></div>\n<script src="https://assets.calendly.com/assets/external/widget.js" async></script>'}
                className="w-full border rounded-lg px-3 py-2 text-xs font-mono resize-y min-h-[140px]"
              />
              <p className="text-[10px] text-gray-400">
                Insertar en: {getPlacementLabel(item.placement)}
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={item.fullWidth === true}
                onChange={(e) => updateItem(index, 'fullWidth', e.target.checked)}
                className="rounded border-gray-300"
              />
              Ancho completo (sin contenedor central)
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
