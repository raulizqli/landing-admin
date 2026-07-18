import {
  createEmptyService,
  getServiceLayoutMeta,
  normalizeServiceLayout,
  normalizeServicesCarouselTransition,
  normalizeServicesVisualStyle,
  SERVICE_ITEM_LAYOUTS,
  SERVICES_CAROUSEL_MOTION_MODES,
  SERVICES_CAROUSEL_PER_VIEW_OPTIONS,
  SERVICES_CAROUSEL_TRANSITIONS,
  SERVICES_DISPLAY_MODES,
  SERVICES_VISUAL_STYLES,
  serviceListItemsToText,
} from '../utils/services';
import ImageUrlField from './ImageUrlField';
import SectionBackgroundEditor from './SectionBackgroundEditor';
import AiAssistButton from './AiAssistButton';
import VisualOptionPicker, {
  CAROUSEL_TRANSITION_PREVIEW_MAP,
  SERVICE_LAYOUT_PREVIEW_MAP,
  VISUAL_STYLE_PREVIEW_MAP,
} from './VisualOptionPicker';
import { getDefaultLabelForPage } from '../utils/labels';

export default function ServicesFieldsEditor({
  formData,
  onChange,
  pageId,
  canToggleSection = true,
  canUseCarouselAutoplay = true,
  onUpgradePlan,
  upgradeLabel = 'Upgrade',
}) {
  const enabled = Boolean(formData.servicesSectionEnabled);
  const items = Array.isArray(formData.services) && formData.services.length > 0
    ? formData.services
    : [createEmptyService()];
  const displayMode = formData.servicesDisplayMode === 'carousel' ? 'carousel' : 'stack';
  const visualStyle = normalizeServicesVisualStyle(formData.servicesVisualStyle);
  const carouselTransition = normalizeServicesCarouselTransition(formData.servicesCarouselTransition);
  const titlePlaceholder = getDefaultLabelForPage(formData, 'services.defaultTitle');
  const introPlaceholder = getDefaultLabelForPage(formData, 'services.defaultIntro');

  const updateItems = (nextItems) => {
    onChange({ ...formData, services: nextItems });
  };

  const updateItem = (index, field, value) => {
    updateItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => {
    updateItems([...items, createEmptyService()]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) {
      updateItems([createEmptyService()]);
      return;
    }
    updateItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 pt-2 border-t">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-[11px] font-bold text-gray-400 uppercase">
          Servicios y temas
        </label>
        {canToggleSection && (
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onChange({ ...formData, servicesSectionEnabled: e.target.checked })}
              className="rounded border-gray-300"
            />
            Mostrar sección
          </label>
        )}
      </div>

      {enabled && (
        <>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Título de la sección</label>
            <input
              type="text"
              value={formData.servicesSectionTitle || ''}
              onChange={(e) => onChange({ ...formData, servicesSectionTitle: e.target.value })}
              placeholder={titlePlaceholder}
              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto introductorio (opcional)</label>
            <textarea
              rows="3"
              value={formData.servicesSectionText || ''}
              onChange={(e) => onChange({ ...formData, servicesSectionText: e.target.value })}
              placeholder={introPlaceholder}
              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Estilo visual</label>
            <VisualOptionPicker
              name="services-visual-style"
              options={SERVICES_VISUAL_STYLES}
              value={visualStyle}
              onChange={(next) => onChange({ ...formData, servicesVisualStyle: next })}
              previewMap={VISUAL_STYLE_PREVIEW_MAP}
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Presentación</legend>
            {SERVICES_DISPLAY_MODES.map((mode) => (
              <label key={mode.value} className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="radio"
                  name="services-display-mode"
                  checked={displayMode === mode.value}
                  onChange={() => onChange({ ...formData, servicesDisplayMode: mode.value })}
                  className="border-gray-300"
                />
                {mode.label}
              </label>
            ))}
          </fieldset>

          {displayMode === 'carousel' && (
            <>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  Elementos visibles en el carrusel
                </label>
                <select
                  value={formData.servicesCarouselPerView || 3}
                  onChange={(e) => onChange({
                    ...formData,
                    servicesCarouselPerView: Number(e.target.value),
                  })}
                  className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
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
                {!canUseCarouselAutoplay && (
                  <button
                    type="button"
                    onClick={onUpgradePlan}
                    className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 mb-1"
                  >
                    {upgradeLabel}
                  </button>
                )}
                {SERVICES_CAROUSEL_MOTION_MODES.map((motion) => (
                  <label key={motion.value} className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="radio"
                      name="services-carousel-motion"
                      checked={(formData.servicesCarouselAutoplay === true) === (motion.value === 'auto')}
                      disabled={motion.value === 'auto' && !canUseCarouselAutoplay}
                      onChange={() => onChange({
                        ...formData,
                        servicesCarouselAutoplay: motion.value === 'auto',
                      })}
                      className="border-gray-300"
                    />
                    {motion.label}
                  </label>
                ))}
              </fieldset>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  Transición del carrusel
                </label>
                <VisualOptionPicker
                  name="services-carousel-transition"
                  options={SERVICES_CAROUSEL_TRANSITIONS}
                  value={carouselTransition}
                  onChange={(next) => onChange({ ...formData, servicesCarouselTransition: next })}
                  previewMap={CAROUSEL_TRANSITION_PREVIEW_MAP}
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-400">
              Tres tipos: solo título, con descripción o con lista. La imagen es opcional en todos.
            </p>
            <button
              type="button"
              onClick={addItem}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
            >
              + Añadir servicio o tema
            </button>
          </div>

          {items.map((item, index) => {
            const layout = normalizeServiceLayout(item.layout);
            const meta = getServiceLayoutMeta(layout);

            return (
              <div key={`service-editor-${index}`} className="border rounded-lg p-4 space-y-3 bg-gray-50/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Ítem {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-[11px] text-red-500 hover:text-red-700"
                  >
                    Eliminar
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Tipo de ítem</label>
                  <VisualOptionPicker
                    name={`service-layout-${index}`}
                    options={SERVICE_ITEM_LAYOUTS.map((option) => ({
                      ...option,
                      description: option.value === 'title'
                        ? 'Solo el título (imagen opcional)'
                        : option.value === 'title_list'
                          ? 'Título con lista de puntos'
                          : 'Título con texto descriptivo',
                    }))}
                    value={layout}
                    onChange={(next) => updateItem(index, 'layout', next)}
                    previewMap={SERVICE_LAYOUT_PREVIEW_MAP}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Título</label>
                  <input
                    type="text"
                    value={item.title || ''}
                    onChange={(e) => updateItem(index, 'title', e.target.value)}
                    placeholder={layout === 'title' ? 'Sesión de fotos familiares' : 'Ansiedad y estrés'}
                    className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {meta.fields.description && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">Descripción</label>
                      <AiAssistButton
                        formData={formData}
                        onChange={onChange}
                        pageId={pageId}
                        action="service_blurb"
                        showLiteMenu={false}
                        currentValue={item.description || item.title || ''}
                        resultPatch={{ index }}
                        brief={item.title || ''}
                        fullActions={[{ action: 'service_blurb', tone: 'empathetic', labelKey: 'ai.serviceBlurb' }]}
                      />
                    </div>
                    <textarea
                      rows="3"
                      value={item.description || ''}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Acompañamiento para identificar desencadenantes y desarrollar estrategias de regulación emocional."
                      className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                    />
                  </div>
                )}

                {meta.fields.list && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Lista</label>
                    <textarea
                      rows="4"
                      value={serviceListItemsToText(item.listItems)}
                      onChange={(e) => updateItem(index, 'listItems', e.target.value.split('\n'))}
                      placeholder={'Primera sesión de evaluación\nPlan de trabajo personalizado\nSeguimiento semanal'}
                      className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-y"
                    />
                    <p className="text-[10px] text-gray-400">Una línea por elemento de la lista.</p>
                  </div>
                )}

                <ImageUrlField
                  label="Imagen (opcional)"
                  value={item.imageUrl || ''}
                  onChange={(imageUrl) => updateItem(index, 'imageUrl', imageUrl)}
                  pageId={pageId}
                  pageData={formData}
                  uploadFolder={`service-${index + 1}`}
                  placeholder="https://ejemplo.com/servicio.jpg"
                  previewClassName="h-16 w-full max-w-xs object-cover border bg-white rounded-lg"
                  previewAlt={`Vista previa servicio ${index + 1}`}
                  helperText="Opcional en todos los tipos."
                />
              </div>
            );
          })}
        </>
      )}

      <SectionBackgroundEditor
        sectionKey="services"
        label="Fondo de servicios"
        formData={formData}
        onChange={onChange}
      />
    </div>
  );
}
