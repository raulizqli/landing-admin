import {
  extractMapsInput,
  CONTACT_MAP_LAYOUTS,
  mapsUrlNeedsAddressFallback,
  resolveMapsUrlsForLocation,
  shouldShowLocationMap,
} from '../utils/maps';
import {
  createEmptyLocation,
  LOCATIONS_CONTACT_MODES,
  LOCATIONS_DISPLAY_MODES,
  normalizeLocations,
  normalizeLocationsContactMode,
  normalizeLocationsDisplayMode,
  syncLegacyLocationFields,
} from '../utils/locations';
import SectionBackgroundEditor from './SectionBackgroundEditor';

export default function LocationFieldsEditor({
  formData,
  onChange,
  locationLimit = null,
  canUseMapBeside = true,
  onUpgradePlan,
  upgradeLabel = 'Upgrade',
  sharedContactFields = null,
}) {
  const locations = normalizeLocations(formData.locations, formData, { keepEmpty: true });
  const contactMode = normalizeLocationsContactMode(formData.locationsContactMode);
  const displayMode = normalizeLocationsDisplayMode(formData.locationsDisplayMode);
  // Free/Starter: locationLimit = 1 → cannot add/remove. Pro+: null → unlimited.
  const canManageLocations = locationLimit == null;
  const perLocationContact = contactMode === 'per_location';

  const commitLocations = (nextLocations, extra = {}) => {
    onChange(syncLegacyLocationFields({
      ...formData,
      ...extra,
      locations: nextLocations,
    }, { keepEmpty: true }));
  };

  const updateLocation = (index, patch) => {
    commitLocations(locations.map((item, i) => (
      i === index ? { ...item, ...patch } : item
    )));
  };

  const addLocation = () => {
    if (!canManageLocations) {
      onUpgradePlan?.();
      return;
    }
    commitLocations([...locations, createEmptyLocation()]);
  };

  const removeLocation = (index) => {
    if (!canManageLocations) {
      onUpgradePlan?.();
      return;
    }
    if (locations.length <= 1) {
      commitLocations([createEmptyLocation()]);
      return;
    }
    commitLocations(locations.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 pt-2 border-t">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-[11px] font-bold text-gray-400 uppercase">Ubicaciones y mapa</label>
        <span className="text-[10px] text-gray-400">
          {canManageLocations
            ? `${locations.length} · ilimitadas`
            : `${Math.min(locations.length, 1)} ubicación · Pro para más`}
        </span>
      </div>

      <fieldset className="space-y-2">
        <legend className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
          Teléfono y email
        </legend>
        {LOCATIONS_CONTACT_MODES.map((mode) => (
          <label key={mode.value} className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="radio"
              name="locations-contact-mode"
              checked={contactMode === mode.value}
              onChange={() => onChange(syncLegacyLocationFields({
                ...formData,
                locationsContactMode: mode.value,
              }, { keepEmpty: true }))}
              className="border-gray-300"
            />
            {mode.label}
          </label>
        ))}
        <p className="text-[10px] text-gray-400">
          {perLocationContact
            ? 'Cada ubicación tendrá su propio email y teléfono en su tarjeta.'
            : 'El email y teléfono públicos de abajo se usan para todas las ubicaciones.'}
        </p>
        {!perLocationContact && sharedContactFields ? (
          <div className="space-y-3 pt-1">
            {sharedContactFields}
          </div>
        ) : null}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
          Presentación
        </legend>
        {LOCATIONS_DISPLAY_MODES.map((mode) => (
          <label key={mode.value} className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="radio"
              name="locations-display-mode"
              checked={displayMode === mode.value}
              onChange={() => onChange(syncLegacyLocationFields({
                ...formData,
                locationsDisplayMode: mode.value,
              }, { keepEmpty: true }))}
              className="border-gray-300"
            />
            {mode.label}
          </label>
        ))}
      </fieldset>

      {locations.map((location, index) => {
        const maps = resolveMapsUrlsForLocation(location);
        return (
          <div key={location.id || index} className="space-y-2 rounded-lg border border-gray-100 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Ubicación {index + 1}
              </p>
              {canManageLocations ? (
                <button
                  type="button"
                  onClick={() => removeLocation(index)}
                  className="text-[10px] font-semibold text-rose-600 hover:underline"
                >
                  Quitar
                </button>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Nombre (opcional)</label>
              <input
                type="text"
                value={location.label || ''}
                onChange={(e) => updateLocation(index, { label: e.target.value })}
                placeholder="Consultorio Roma Norte"
                className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Dirección visible</label>
              <input
                type="text"
                value={location.address || ''}
                onChange={(e) => updateLocation(index, { address: e.target.value })}
                placeholder="Ciudad de México — Consultorio Roma Norte"
                className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            {perLocationContact && (
              <>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Email</label>
                  <input
                    type="email"
                    value={location.email || ''}
                    onChange={(e) => updateLocation(index, { email: e.target.value })}
                    placeholder="sucursal@ejemplo.com"
                    className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Teléfono</label>
                  <input
                    type="text"
                    value={location.phone || ''}
                    onChange={(e) => updateLocation(index, { phone: e.target.value })}
                    placeholder="55 1234 5678"
                    className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={Boolean(location.phoneIsWhatsapp)}
                      onChange={(e) => updateLocation(index, { phoneIsWhatsapp: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    Abrir WhatsApp en lugar de llamada
                  </label>
                  {location.phoneIsWhatsapp && (
                    <p className="text-[10px] text-gray-400">
                      Usa el país configurado en Teléfono / WhatsApp de la página para armar el enlace.
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Google Maps</label>
              <p className="text-[10px] text-gray-400">
                Pega el enlace «Compartir» de Google Maps o el código iframe embed. Si lo dejas vacío, se usará la dirección visible.
              </p>
              <textarea
                rows="3"
                value={location.mapsUrl || ''}
                onChange={(e) => updateLocation(index, { mapsUrl: e.target.value })}
                onBlur={(e) => {
                  const cleaned = extractMapsInput(e.target.value);
                  if (cleaned !== (location.mapsUrl || '')) {
                    updateLocation(index, { mapsUrl: cleaned });
                  }
                }}
                placeholder="https://maps.google.com/... o &lt;iframe src=&quot;...&quot;&gt;"
                className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none font-mono"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={Boolean(location.showMap)}
                onChange={(e) => updateLocation(index, { showMap: e.target.checked })}
                className="rounded border-gray-300"
              />
              Mostrar mapa embebido
            </label>
            {location.showMap && !shouldShowLocationMap(location) && (
              <p className="text-[10px] text-amber-600">
                No se pudo armar el mapa. Revisa el enlace/embed de Google Maps o escribe una dirección visible.
              </p>
            )}
            {location.showMap && mapsUrlNeedsAddressFallback(location) && (
              <p className="text-[10px] text-amber-700">
                El enlace de Maps no se puede embeber solo; se usará la dirección visible para el mapa.
              </p>
            )}
            {location.showMap && shouldShowLocationMap(location) && maps.source === 'address' && location.mapsUrl && (
              <p className="text-[10px] text-gray-400">
                Mapa generado desde la dirección visible (prioridad porque el enlace no era usable).
              </p>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addLocation}
        className="w-full rounded-lg border border-dashed border-indigo-300 px-3 py-2 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50"
      >
        {canManageLocations
          ? '+ Añadir ubicación'
          : `+ Añadir ubicación — ${upgradeLabel} (Pro)`}
      </button>

      {locations.some((item) => item.showMap) && displayMode === 'list' && (
        <fieldset className="space-y-2">
          <legend className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
            Posición del mapa (primera ubicación con mapa)
          </legend>
          {CONTACT_MAP_LAYOUTS.map((layout) => (
            <label key={layout.value} className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="radio"
                name="contact-map-layout"
                checked={(formData.contactMapLayout || 'below') === layout.value}
                disabled={layout.value === 'beside' && !canUseMapBeside}
                onChange={() => onChange({ ...formData, contactMapLayout: layout.value })}
                className="border-gray-300"
              />
              {layout.label}
              {layout.value === 'beside' && !canUseMapBeside && (
                <button type="button" onClick={onUpgradePlan} className="text-[10px] font-semibold text-indigo-600">
                  {upgradeLabel}
                </button>
              )}
            </label>
          ))}
          <p className="text-[10px] text-gray-400">
            En móvil el mapa siempre queda debajo del contacto. Mapas adicionales se apilan debajo.
          </p>
        </fieldset>
      )}

      <SectionBackgroundEditor
        sectionKey="contact"
        label="Fondo de contacto"
        formData={formData}
        onChange={onChange}
      />
    </div>
  );
}
