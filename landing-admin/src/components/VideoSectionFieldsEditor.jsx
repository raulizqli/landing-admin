import { createEmptyVideoItem, syncVideoSectionUrlFromItems } from '../utils/videoSection';
import PlanGate from './PlanGate';
import SectionBackgroundEditor from './SectionBackgroundEditor';

export default function VideoSectionFieldsEditor({
  formData,
  onChange,
  canToggleSection = true,
  canUseVideoCarousel = false,
  onUpgradePlan,
  upgradeLabel = 'Upgrade',
}) {
  const enabled = Boolean(formData.videoSectionEnabled);
  const items = Array.isArray(formData.videoSectionItems) && formData.videoSectionItems.length > 0
    ? formData.videoSectionItems
    : [createEmptyVideoItem({ url: formData.videoSectionUrl || '' })];

  const commitItems = (nextItems) => {
    onChange({
      ...formData,
      videoSectionItems: nextItems,
      videoSectionUrl: syncVideoSectionUrlFromItems(nextItems),
    });
  };

  const updateItem = (index, field, value) => {
    commitItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => {
    if (!canUseVideoCarousel) {
      onUpgradePlan?.();
      return;
    }
    commitItems([...items, createEmptyVideoItem()]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) {
      commitItems([createEmptyVideoItem()]);
      return;
    }
    commitItems(items.filter((_, i) => i !== index));
  };

  const moveItem = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    commitItems(next);
  };

  return (
    <div className="space-y-3 pt-2 border-t">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-[11px] font-bold text-gray-400 uppercase">
          Sección de video
        </label>
        {canToggleSection && (
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onChange({ ...formData, videoSectionEnabled: e.target.checked })}
              className="rounded border-gray-300"
            />
            Mostrar sección
          </label>
        )}
      </div>

      {enabled && (
        <>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Título (opcional)</label>
            <input
              type="text"
              value={formData.videoSectionTitle || ''}
              onChange={(e) => onChange({ ...formData, videoSectionTitle: e.target.value })}
              placeholder="Conoce mi enfoque terapéutico"
              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto (opcional)</label>
            <textarea
              rows="4"
              value={formData.videoSectionText || ''}
              onChange={(e) => onChange({ ...formData, videoSectionText: e.target.value })}
              placeholder="Breve introducción a los videos. Separa párrafos con una línea en blanco."
              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          {!canUseVideoCarousel && (
            <PlanGate
              allowed={false}
              label={upgradeLabel}
              onUpgrade={onUpgradePlan}
              lockedTitle="Carrusel de videos (Pro)"
              lockedDescription="En Starter publicas un video. Con Pro puedes añadir varios (YouTube, Vimeo o MP4) y mostrarlos en un carrusel."
              lockedBenefits={[
                'Varios videos en la misma sección',
                'Controles anterior / siguiente y puntos de navegación',
                'Avance automático opcional',
              ]}
            />
          )}

          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] text-gray-400">
              YouTube, Vimeo o archivo directo (.mp4). El reproductor incluye controles para el visitante.
            </p>
            {canUseVideoCarousel ? (
              <button
                type="button"
                onClick={addItem}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 shrink-0"
              >
                + Añadir video
              </button>
            ) : null}
          </div>

          {items.map((item, index) => {
            const lockedExtra = !canUseVideoCarousel && index > 0;

            return (
              <div
                key={`video-editor-${index}`}
                className={`border rounded-lg p-4 space-y-3 bg-gray-50/80 ${lockedExtra ? 'opacity-70' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-gray-700">
                    Video {index + 1}
                    {items.length > 1 ? ' · carrusel' : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    {canUseVideoCarousel && items.length > 1 && (
                      <>
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
                      </>
                    )}
                    {(canUseVideoCarousel || items.length > 1) && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-[11px] text-red-500 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Enlace del video</label>
                  <input
                    type="url"
                    value={item.url || ''}
                    onChange={(e) => updateItem(index, 'url', e.target.value)}
                    placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
                    className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Leyenda (opcional)</label>
                  <input
                    type="text"
                    value={item.caption || ''}
                    onChange={(e) => updateItem(index, 'caption', e.target.value)}
                    placeholder="Presentación del consultorio"
                    className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            );
          })}

          {canUseVideoCarousel && items.length > 1 && (
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={formData.videoSectionCarouselAutoplay === true}
                onChange={(e) => onChange({
                  ...formData,
                  videoSectionCarouselAutoplay: e.target.checked,
                })}
                className="rounded border-gray-300"
              />
              Avanzar el carrusel automáticamente
            </label>
          )}
        </>
      )}

      <SectionBackgroundEditor
        sectionKey="video"
        label="Fondo de la sección de video"
        formData={formData}
        onChange={onChange}
      />
    </div>
  );
}
