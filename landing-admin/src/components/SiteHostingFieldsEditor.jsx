import { normalizeHostname } from '../utils/domainRouting';
import { EMPTY_EXTERNAL_FIREBASE } from '../utils/externalFirebase';

const EXTERNAL_FIELDS = [
  { key: 'apiKey', label: 'API Key' },
  { key: 'authDomain', label: 'Auth domain' },
  { key: 'projectId', label: 'Project ID' },
  { key: 'storageBucket', label: 'Storage bucket' },
  { key: 'messagingSenderId', label: 'Messaging sender ID' },
  { key: 'appId', label: 'App ID' },
];

export default function SiteHostingFieldsEditor({ formData, onChange }) {
  const useExternal = Boolean(formData.useExternalFirebase);
  const externalFirebase = formData.externalFirebase || EMPTY_EXTERNAL_FIREBASE;

  const updateExternalField = (key, value) => {
    onChange({
      ...formData,
      externalFirebase: {
        ...externalFirebase,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-4 pt-2 border-t">
      <label className="block text-[11px] font-bold text-gray-400 uppercase">
        Dominio y proyecto Firebase
      </label>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-400 uppercase">Dominio personalizado</label>
        <input
          type="text"
          value={formData.customDomain || ''}
          onChange={(e) => onChange({
            ...formData,
            customDomain: normalizeHostname(e.target.value),
          })}
          placeholder="dra-maria.com"
          className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
        />
        <p className="text-[10px] text-gray-400">
          En un deploy multi-tenant (un solo sitio de Firebase Hosting), la app resuelve el
          {' '}
          <code className="bg-gray-100 px-1 rounded">pageId</code>
          {' '}
          por este dominio. Sin
          {' '}
          <code className="bg-gray-100 px-1 rounded">www.</code>
          .
        </p>
      </div>

      <label className="flex items-center gap-2 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={useExternal}
          onChange={(e) => onChange({ ...formData, useExternalFirebase: e.target.checked })}
          className="rounded border-gray-300"
        />
        Los datos de esta landing viven en otro proyecto Firebase (otra cuenta)
      </label>

      {useExternal && (
        <fieldset className="space-y-3 rounded-lg border border-amber-100 bg-amber-50/60 p-3">
          <legend className="px-1 text-[10px] font-bold text-amber-700 uppercase">
            Proyecto Firebase externo
          </legend>
          <p className="text-[10px] text-amber-800 leading-relaxed">
            Flujo demo → producción:
          </p>
          <ol className="list-decimal list-inside text-[10px] text-amber-900/90 space-y-1 leading-relaxed">
            <li>Crea el proyecto en la cuenta Firebase del cliente.</li>
            <li>Activa Firestore + Storage y copia las credenciales web aquí.</li>
            <li>Aplica reglas de lectura pública en <code className="bg-white px-1 rounded">pages</code> (y Storage) en esa cuenta.</li>
            <li>Pulsa <strong>Guardar y Publicar</strong>: el contenido se copia al proyecto externo y el hub solo guarda dominio + credenciales.</li>
          </ol>
          <p className="text-[10px] text-amber-800">
            Mientras está desactivado, todo vive en el hub (ideal para la demo).
          </p>
          {EXTERNAL_FIELDS.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-500 uppercase">{label}</label>
              <input
                type="text"
                value={externalFirebase[key] || ''}
                onChange={(e) => updateExternalField(key, e.target.value.trim())}
                className="w-full border p-2 text-xs rounded-lg font-mono"
              />
            </div>
          ))}
        </fieldset>
      )}
    </div>
  );
}
