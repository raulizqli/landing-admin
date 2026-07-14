
import {
  createCustomSectionByType,
  createEmptyFaqItem,
  createEmptyStepItem,
  CUSTOM_SECTION_TYPES,
  EMBED_PLACEMENTS,
  getPlacementLabel,
  getSectionTypeMeta,
  normalizeCustomEmbeds,
  normalizeSectionType,
} from '../utils/customEmbeds';

function FaqItemsEditor({ items, onChange }) {
  const list = items.length > 0 ? items : [createEmptyFaqItem()];

  const updateItem = (index, field, value) => {
    onChange(list.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-bold text-gray-400 uppercase">Preguntas</label>
        <button
          type="button"
          onClick={() => onChange([...list, createEmptyFaqItem()])}
          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
        >
          + Pregunta
        </button>
      </div>
      {list.map((item, index) => (
        <div key={`faq-item-${index}`} className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
          <div className="flex justify-between gap-2">
            <span className="text-[10px] font-semibold text-gray-500">#{index + 1}</span>
            <button
              type="button"
              onClick={() => onChange(list.length <= 1 ? [createEmptyFaqItem()] : list.filter((_, i) => i !== index))}
              className="text-[10px] text-red-600 hover:underline"
            >
              Quitar
            </button>
          </div>
          <input
            type="text"
            value={item.question || ''}
            onChange={(e) => updateItem(index, 'question', e.target.value)}
            placeholder="¿Cómo es la primera sesión?"
            className="w-full border rounded-lg px-3 py-2 text-xs"
          />
          <textarea
            rows={3}
            value={item.answer || ''}
            onChange={(e) => updateItem(index, 'answer', e.target.value)}
            placeholder="Respuesta clara y calmada..."
            className="w-full border rounded-lg px-3 py-2 text-xs resize-y"
          />
        </div>
      ))}
    </div>
  );
}

function StepsEditor({ items, onChange }) {
  const list = items.length > 0 ? items : [createEmptyStepItem()];

  const updateItem = (index, field, value) => {
    onChange(list.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-bold text-gray-400 uppercase">Pasos</label>
        <button
          type="button"
          onClick={() => onChange([...list, createEmptyStepItem()])}
          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
        >
          + Paso
        </button>
      </div>
      {list.map((item, index) => (
        <div key={`step-item-${index}`} className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
          <div className="flex justify-between gap-2">
            <span className="text-[10px] font-semibold text-gray-500">Paso {index + 1}</span>
            <button
              type="button"
              onClick={() => onChange(list.length <= 1 ? [createEmptyStepItem()] : list.filter((_, i) => i !== index))}
              className="text-[10px] text-red-600 hover:underline"
            >
              Quitar
            </button>
          </div>
          <input
            type="text"
            value={item.title || ''}
            onChange={(e) => updateItem(index, 'title', e.target.value)}
            placeholder="Primera conversación"
            className="w-full border rounded-lg px-3 py-2 text-xs"
          />
          <textarea
            rows={2}
            value={item.description || ''}
            onChange={(e) => updateItem(index, 'description', e.target.value)}
            placeholder="Breve descripción del paso..."
            className="w-full border rounded-lg px-3 py-2 text-xs resize-y"
          />
        </div>
      ))}
    </div>
  );
}

function TypeFields({ item, onChange }) {
  const type = normalizeSectionType(item.type);

  if (type === 'faq') {
    return (
      <FaqItemsEditor
        items={Array.isArray(item.faqItems) ? item.faqItems : []}
        onChange={(faqItems) => onChange('faqItems', faqItems)}
      />
    );
  }

  if (type === 'steps') {
    return (
      <StepsEditor
        items={Array.isArray(item.steps) ? item.steps : []}
        onChange={(steps) => onChange('steps', steps)}
      />
    );
  }

  if (type === 'text') {
    return (
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto</label>
        <textarea
          rows={6}
          value={item.body || ''}
          onChange={(e) => onChange('body', e.target.value)}
          placeholder="Describe tu enfoque. Separa párrafos con una línea en blanco."
          className="w-full border rounded-lg px-3 py-2 text-xs resize-y"
        />
      </div>
    );
  }

  if (type === 'quote') {
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">Cita</label>
          <textarea
            rows={3}
            value={item.quoteText || ''}
            onChange={(e) => onChange('quoteText', e.target.value)}
            placeholder="Una frase que resuma tu acompañamiento..."
            className="w-full border rounded-lg px-3 py-2 text-xs resize-y"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">Atribución (opcional)</label>
          <input
            type="text"
            value={item.quoteAttribution || ''}
            onChange={(e) => onChange('quoteAttribution', e.target.value)}
            placeholder="Nombre o fuente"
            className="w-full border rounded-lg px-3 py-2 text-xs"
          />
        </div>
      </div>
    );
  }

  if (type === 'cta') {
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto de apoyo</label>
          <textarea
            rows={3}
            value={item.ctaText || ''}
            onChange={(e) => onChange('ctaText', e.target.value)}
            placeholder="Estoy aquí para acompañarte. Agenda una primera conversación."
            className="w-full border rounded-lg px-3 py-2 text-xs resize-y"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto del botón</label>
            <input
              type="text"
              value={item.ctaButtonLabel || ''}
              onChange={(e) => onChange('ctaButtonLabel', e.target.value)}
              placeholder="Reservar cita"
              className="w-full border rounded-lg px-3 py-2 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Enlace del botón</label>
            <input
              type="text"
              value={item.ctaButtonUrl || ''}
              onChange={(e) => onChange('ctaButtonUrl', e.target.value)}
              placeholder="#contact o https://..."
              className="w-full border rounded-lg px-3 py-2 text-xs"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-bold text-gray-400 uppercase">Código HTML / embed</label>
      <textarea
        rows={8}
        value={item.htmlCode || ''}
        onChange={(e) => onChange('htmlCode', e.target.value)}
        placeholder={'<div class="calendly-inline-widget" data-url="https://calendly.com/..."></div>\n<script src="https://assets.calendly.com/assets/external/widget.js" async></script>'}
        className="w-full border rounded-lg px-3 py-2 text-xs font-mono resize-y min-h-[140px]"
      />
      <p className="text-[10px] text-gray-400">Solo pega código de fuentes confiables.</p>
    </div>
  );
}

export default function CustomEmbedsFieldsEditor({ formData, onChange, canManageLayout = true }) {
  const items = Array.isArray(formData.customEmbeds)
    ? normalizeCustomEmbeds(formData.customEmbeds)
    : [];
  const visibleItems = canManageLayout
    ? items
    : items.filter((item) => item.enabled !== false);

  const updateItems = (nextItems) => {
    onChange({ ...formData, customEmbeds: nextItems });
  };

  const updateItemById = (id, field, value) => {
    updateItems(items.map((item) => {
      if (item.id !== id) return item;
      if (field === 'type') {
        const meta = getSectionTypeMeta(value);
        return {
          ...item,
          type: meta.value,
          title: item.title || meta.defaultTitle,
          placement: item.placement || meta.defaultPlacement,
        };
      }
      return { ...item, [field]: value };
    }));
  };

  const addItem = (type) => {
    updateItems([
      ...items,
      createCustomSectionByType(type, { sortOrder: items.length }),
    ]);
  };

  const removeItemById = (id) => {
    updateItems(items.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] text-gray-400">
          {canManageLayout
            ? 'Añade bloques extra a la landing. Los más útiles para psicología suelen ser FAQ, proceso, texto de enfoque, CTA y cita.'
            : 'Puedes editar el contenido de las secciones personalizadas ya configuradas. Solo root puede añadir o quitar bloques.'}
        </p>
      </div>

      {canManageLayout && (
        <div className="grid grid-cols-2 gap-2">
          {CUSTOM_SECTION_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => addItem(type.value)}
              className="text-left rounded-xl border border-indigo-100 bg-indigo-50/60 hover:bg-indigo-50 px-3 py-2.5 transition"
            >
              <span className="block text-[11px] font-semibold text-indigo-800">+ {type.label}</span>
              <span className="block text-[10px] text-indigo-700/70 mt-0.5 leading-snug">{type.description}</span>
            </button>
          ))}
        </div>
      )}

      {visibleItems.length === 0 ? (
        <p className="text-[11px] text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">
          {canManageLayout
            ? 'Aún no hay secciones personalizadas. Elige un tipo arriba.'
            : 'No hay secciones personalizadas activas en esta página.'}
        </p>
      ) : (
        <div className="space-y-4">
          {visibleItems.map((item) => {
            const typeMeta = getSectionTypeMeta(item.type);

            return (
              <div key={item.id} className="border rounded-xl p-4 bg-gray-50 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide truncate">
                      {typeMeta.label}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{getPlacementLabel(item.placement)}</p>
                  </div>
                  {canManageLayout && (
                    <div className="flex items-center gap-3 shrink-0">
                      <label className="flex items-center gap-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={item.enabled !== false}
                          onChange={(e) => updateItemById(item.id, 'enabled', e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        Activo
                      </label>
                      <button
                        type="button"
                        onClick={() => removeItemById(item.id)}
                        className="text-[10px] text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>

                {canManageLayout ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">Tipo</label>
                      <select
                        value={normalizeSectionType(item.type)}
                        onChange={(e) => updateItemById(item.id, 'type', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-xs bg-white"
                      >
                        {CUSTOM_SECTION_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">Posición</label>
                      <select
                        value={item.placement || 'after_contact'}
                        onChange={(e) => updateItemById(item.id, 'placement', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-xs bg-white"
                      >
                        {EMBED_PLACEMENTS.map((placement) => (
                          <option key={placement.value} value={placement.value}>
                            {placement.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Nombre interno</label>
                  <input
                    type="text"
                    value={item.label || ''}
                    onChange={(e) => updateItemById(item.id, 'label', e.target.value)}
                    placeholder="Solo para organizarte en el admin"
                    className="w-full border rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                {normalizeSectionType(item.type) !== 'quote' && (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Título visible</label>
                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(e) => updateItemById(item.id, 'title', e.target.value)}
                      placeholder={typeMeta.defaultTitle || 'Título de la sección'}
                      className="w-full border rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                )}

                <TypeFields item={item} onChange={(field, value) => updateItemById(item.id, field, value)} />

                {canManageLayout && (
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={item.fullWidth === true}
                      onChange={(e) => updateItemById(item.id, 'fullWidth', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Ancho completo (sin contenedor central)
                  </label>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
