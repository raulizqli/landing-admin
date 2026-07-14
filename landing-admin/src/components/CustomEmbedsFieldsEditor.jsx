
import {
  createCustomSectionByType,
  createEmptyFaqItem,
  createEmptyStepItem,
  CUSTOM_SECTION_TYPES,
  EMBED_PLACEMENTS,
  getPlacementLabel,
  getSectionTypeMeta,
  normalizeSectionType,
  PORTFOLIO_PROVIDERS,
} from '../utils/customEmbeds';
import {
  createEmptyService,
  getServiceLayoutMeta,
  normalizeServiceLayout,
  SERVICE_ITEM_LAYOUTS,
  SERVICES_CAROUSEL_MOTION_MODES,
  SERVICES_CAROUSEL_PER_VIEW_OPTIONS,
  SERVICES_DISPLAY_MODES,
  serviceListItemsToText,
} from '../utils/services';
import ImageUrlField from './ImageUrlField';

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

function TypeFields({ item, onChange, pageId, pageData }) {
  const type = normalizeSectionType(item.type);

  if (type === 'pre_hero') {
    const splitMode = item.preHeroMode === 'split';
    return (
      <div className="space-y-3">
        <fieldset className="space-y-2">
          <legend className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tipo</legend>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="radio"
              name={`pre-hero-mode-${item.id}`}
              checked={!splitMode}
              onChange={() => onChange('preHeroMode', 'banner')}
              className="border-gray-300"
            />
            Imagen completa
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="radio"
              name={`pre-hero-mode-${item.id}`}
              checked={splitMode}
              onChange={() => onChange('preHeroMode', 'split')}
              className="border-gray-300"
            />
            Foto + título y texto
          </label>
        </fieldset>

        {splitMode && (
          <fieldset className="space-y-2">
            <legend className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Posición de la imagen</legend>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="radio"
                name={`pre-hero-side-${item.id}`}
                checked={(item.preHeroImageSide || 'left') !== 'right'}
                onChange={() => onChange('preHeroImageSide', 'left')}
                className="border-gray-300"
              />
              Imagen a la izquierda
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="radio"
                name={`pre-hero-side-${item.id}`}
                checked={item.preHeroImageSide === 'right'}
                onChange={() => onChange('preHeroImageSide', 'right')}
                className="border-gray-300"
              />
              Imagen a la derecha
            </label>
          </fieldset>
        )}

        <ImageUrlField
          label={splitMode ? 'Foto' : 'Imagen completa'}
          value={item.imageUrl || ''}
          onChange={(imageUrl) => onChange('imageUrl', imageUrl)}
          pageId={pageId}
          pageData={pageData}
          uploadFolder={`custom-pre-hero-${item.id || 'new'}`}
          placeholder="https://ejemplo.com/imagen.jpg"
          previewClassName={splitMode ? 'h-20 w-16 object-cover border bg-white rounded' : 'h-16 max-w-full object-contain border bg-white rounded'}
          previewAlt="Vista previa pre-hero"
          helperText="Pega una URL o sube la imagen."
        />

        {splitMode && (
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto</label>
            <textarea
              rows={5}
              value={item.body || ''}
              onChange={(e) => onChange('body', e.target.value)}
              placeholder="Texto del bloque. Separa párrafos con una línea en blanco."
              className="w-full border rounded-lg px-3 py-2 text-xs resize-y"
            />
          </div>
        )}
      </div>
    );
  }

  if (type === 'services') {
    const displayMode = item.servicesDisplayMode === 'carousel' ? 'carousel' : 'stack';
    const serviceItems = Array.isArray(item.serviceItems) && item.serviceItems.length > 0
      ? item.serviceItems
      : [createEmptyService()];

    const updateServiceItems = (nextItems) => onChange('serviceItems', nextItems);
    const updateServiceItem = (index, field, value) => {
      updateServiceItems(serviceItems.map((service, i) => (
        i === index ? { ...service, [field]: value } : service
      )));
    };

    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto introductorio (opcional)</label>
          <textarea
            rows={3}
            value={item.body || ''}
            onChange={(e) => onChange('body', e.target.value)}
            placeholder="Breve descripción de los servicios."
            className="w-full border rounded-lg px-3 py-2 text-xs resize-y"
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Presentación</legend>
          {SERVICES_DISPLAY_MODES.map((mode) => (
            <label key={mode.value} className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="radio"
                name={`services-mode-${item.id}`}
                checked={displayMode === mode.value}
                onChange={() => onChange('servicesDisplayMode', mode.value)}
                className="border-gray-300"
              />
              {mode.label}
            </label>
          ))}
        </fieldset>

        {displayMode === 'carousel' && (
          <>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">
                Elementos visibles en el carrusel
              </label>
              <select
                value={item.servicesCarouselPerView || 3}
                onChange={(e) => onChange('servicesCarouselPerView', Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-xs bg-white"
              >
                {SERVICES_CAROUSEL_PER_VIEW_OPTIONS.map((count) => (
                  <option key={count} value={count}>
                    De {count} en {count}
                  </option>
                ))}
              </select>
            </div>

            <fieldset className="space-y-2">
              <legend className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                Movimiento del carrusel
              </legend>
              {SERVICES_CAROUSEL_MOTION_MODES.map((motion) => (
                <label key={motion.value} className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="radio"
                    name={`services-carousel-motion-${item.id}`}
                    checked={(item.servicesCarouselAutoplay === true) === (motion.value === 'auto')}
                    onChange={() => onChange('servicesCarouselAutoplay', motion.value === 'auto')}
                    className="border-gray-300"
                  />
                  {motion.label}
                </label>
              ))}
            </fieldset>
          </>
        )}

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-gray-400">Ítems del bloque</p>
          <button
            type="button"
            onClick={() => updateServiceItems([...serviceItems, createEmptyService()])}
            className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
          >
            + Servicio
          </button>
        </div>

        {serviceItems.map((service, index) => {
          const layout = normalizeServiceLayout(service.layout);
          const meta = getServiceLayoutMeta(layout);

          return (
            <div key={`service-item-${index}`} className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
              <div className="flex justify-between gap-2">
                <span className="text-[10px] font-semibold text-gray-500">#{index + 1}</span>
                <button
                  type="button"
                  onClick={() => updateServiceItems(
                    serviceItems.length <= 1 ? [createEmptyService()] : serviceItems.filter((_, i) => i !== index),
                  )}
                  className="text-[10px] text-red-600 hover:underline"
                >
                  Quitar
                </button>
              </div>

              <fieldset className="space-y-1.5">
                <legend className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tipo</legend>
                {SERVICE_ITEM_LAYOUTS.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="radio"
                      name={`custom-service-layout-${item.id}-${index}`}
                      checked={layout === option.value}
                      onChange={() => updateServiceItem(index, 'layout', option.value)}
                      className="border-gray-300"
                    />
                    {option.label}
                  </label>
                ))}
              </fieldset>

              <input
                type="text"
                value={service.title || ''}
                onChange={(e) => updateServiceItem(index, 'title', e.target.value)}
                placeholder="Título del servicio"
                className="w-full border rounded-lg px-3 py-2 text-xs"
              />

              {meta.fields.description && (
                <textarea
                  rows={2}
                  value={service.description || ''}
                  onChange={(e) => updateServiceItem(index, 'description', e.target.value)}
                  placeholder="Descripción breve..."
                  className="w-full border rounded-lg px-3 py-2 text-xs resize-y"
                />
              )}

              {meta.fields.list && (
                <div className="space-y-1">
                  <textarea
                    rows={3}
                    value={serviceListItemsToText(service.listItems)}
                    onChange={(e) => updateServiceItem(index, 'listItems', e.target.value.split('\n'))}
                    placeholder={'Ítem uno\nÍtem dos\nÍtem tres'}
                    className="w-full border rounded-lg px-3 py-2 text-xs resize-y"
                  />
                  <p className="text-[10px] text-gray-400">Una línea por elemento.</p>
                </div>
              )}

              <ImageUrlField
                label="Imagen (opcional)"
                value={service.imageUrl || ''}
                onChange={(imageUrl) => updateServiceItem(index, 'imageUrl', imageUrl)}
                pageId={pageId}
                pageData={pageData}
                uploadFolder={`custom-service-${item.id || 'new'}-${index + 1}`}
                placeholder="https://ejemplo.com/servicio.jpg"
                previewClassName="h-16 w-full max-w-xs object-cover border bg-white rounded-lg"
                previewAlt={`Servicio ${index + 1}`}
                helperText="Opcional en todos los tipos."
              />
            </div>
          );
        })}
      </div>
    );
  }

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

  if (type === 'portfolio') {
    return (
      <div className="space-y-3">
        <p className="text-[10px] text-gray-400 leading-snug">
          Enlace a un portafolio alojado fuera (Pixieset, SmugMug, Format, Adobe…) y, si el proveedor lo permite, pega su código embed.
        </p>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">Proveedor</label>
          <select
            value={item.portfolioProvider || 'custom'}
            onChange={(e) => onChange('portfolioProvider', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-xs bg-white"
          >
            {PORTFOLIO_PROVIDERS.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">URL del portafolio</label>
          <input
            type="url"
            value={item.portfolioUrl || ''}
            onChange={(e) => onChange('portfolioUrl', e.target.value)}
            placeholder="https://cliente.pixieset.com/galeria"
            className="w-full border rounded-lg px-3 py-2 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto introductorio (opcional)</label>
          <textarea
            rows={3}
            value={item.body || ''}
            onChange={(e) => onChange('body', e.target.value)}
            placeholder="Explora el trabajo completo en el portafolio externo."
            className="w-full border rounded-lg px-3 py-2 text-xs resize-y"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto del botón</label>
          <input
            type="text"
            value={item.ctaButtonLabel || ''}
            onChange={(e) => onChange('ctaButtonLabel', e.target.value)}
            placeholder="Ver portafolio completo"
            className="w-full border rounded-lg px-3 py-2 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">Embed HTML (opcional)</label>
          <textarea
            rows={6}
            value={item.htmlCode || ''}
            onChange={(e) => onChange('htmlCode', e.target.value)}
            placeholder="Pega aquí el iframe o widget que te da el proveedor (si lo tienes)."
            className="w-full border rounded-lg px-3 py-2 text-xs font-mono resize-y min-h-[120px]"
          />
          <p className="text-[10px] text-gray-400">Si el proveedor no ofrece embed, deja esto vacío y usa solo el enlace.</p>
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

export default function CustomEmbedsFieldsEditor({ formData, onChange, canManageLayout = true, pageId }) {
  // Do not normalize/trim on every render — that strips trailing spaces while typing.
  const items = Array.isArray(formData.customEmbeds) ? formData.customEmbeds : [];
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
        const next = {
          ...item,
          type: meta.value,
          title: item.title || meta.defaultTitle,
          placement: item.placement || meta.defaultPlacement,
        };
        if (meta.value === 'portfolio') {
          next.ctaButtonLabel = item.ctaButtonLabel && item.ctaButtonLabel !== 'Reservar cita'
            ? item.ctaButtonLabel
            : 'Ver portafolio completo';
          next.portfolioProvider = item.portfolioProvider || 'custom';
        }
        return next;
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

                <TypeFields
                  item={item}
                  onChange={(field, value) => updateItemById(item.id, field, value)}
                  pageId={pageId}
                  pageData={formData}
                />

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
