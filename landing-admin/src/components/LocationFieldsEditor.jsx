import { extractMapsInput, CONTACT_MAP_LAYOUTS } from '../utils/maps';
import SectionBackgroundEditor from './SectionBackgroundEditor';

export default function LocationFieldsEditor({ formData, onChange }) {
  const handleMapsBlur = (rawValue) => {
    const cleaned = extractMapsInput(rawValue);
    if (cleaned !== (formData.locationMapsUrl || '')) {
      onChange({ ...formData, locationMapsUrl: cleaned });
    }
  };

  return (
    <div className="space-y-3 pt-2 border-t">
      <label className="block text-[11px] font-bold text-gray-400 uppercase">Ubicación y mapa</label>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-400 uppercase">Dirección visible</label>
        <input
          type="text"
          value={formData.location || ''}
          onChange={(e) => onChange({ ...formData, location: e.target.value })}
          placeholder="Ciudad de México — Consultorio Roma Norte"
          className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-400 uppercase">Google Maps</label>
        <p className="text-[10px] text-gray-400">
          Pega el enlace «Compartir» de Google Maps o el código iframe embed. Si lo dejas vacío, se usará la dirección visible.
        </p>
        <textarea
          rows="3"
          value={formData.locationMapsUrl || ''}
          onChange={(e) => onChange({ ...formData, locationMapsUrl: e.target.value })}
          onBlur={(e) => handleMapsBlur(e.target.value)}
          placeholder="https://maps.google.com/... o &lt;iframe src=&quot;...&quot;&gt;"
          className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none font-mono"
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={Boolean(formData.showLocationMap)}
          onChange={(e) => onChange({ ...formData, showLocationMap: e.target.checked })}
          className="rounded border-gray-300"
        />
        Mostrar mapa embebido en contacto
      </label>
      {formData.showLocationMap && !formData.locationMapsUrl && !formData.location && (
        <p className="text-[10px] text-amber-600">
          Añade una dirección o enlace de Google Maps para mostrar el mapa.
        </p>
      )}

      {formData.showLocationMap && (
        <fieldset className="space-y-2">
          <legend className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
            Posición del mapa
          </legend>
          {CONTACT_MAP_LAYOUTS.map((layout) => (
            <label key={layout.value} className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="radio"
                name="contact-map-layout"
                checked={(formData.contactMapLayout || 'below') === layout.value}
                onChange={() => onChange({ ...formData, contactMapLayout: layout.value })}
                className="border-gray-300"
              />
              {layout.label}
            </label>
          ))}
          <p className="text-[10px] text-gray-400">
            En móvil el mapa siempre queda debajo del contacto.
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
