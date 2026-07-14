import { useState } from 'react';
import { normalizeHostname } from '../utils/domainRouting';
import { EMPTY_EXTERNAL_FIREBASE } from '../utils/externalFirebase';
import {
  getHostingProviderMeta,
  HOSTING_PROVIDERS,
} from '../utils/hostingDeploy';
import { triggerHostingDeploy } from '../utils/hostingFunctions';

const EXTERNAL_FIELDS = [
  { key: 'apiKey', label: 'API Key' },
  { key: 'authDomain', label: 'Auth domain' },
  { key: 'projectId', label: 'Project ID' },
  { key: 'storageBucket', label: 'Storage bucket' },
  { key: 'messagingSenderId', label: 'Messaging sender ID' },
  { key: 'appId', label: 'App ID' },
];

export default function SiteHostingFieldsEditor({ formData, onChange, pageId }) {
  const useExternal = Boolean(formData.useExternalFirebase);
  const externalFirebase = formData.externalFirebase || EMPTY_EXTERNAL_FIREBASE;
  const provider = formData.hostingProvider || 'hub';
  const providerMeta = getHostingProviderMeta(provider);
  const [deploying, setDeploying] = useState(false);
  const [deployMessage, setDeployMessage] = useState('');

  const updateExternalField = (key, value) => {
    onChange({
      ...formData,
      externalFirebase: {
        ...externalFirebase,
        [key]: value,
      },
    });
  };

  const handleDeploy = async () => {
    if (!pageId || pageId === 'preview-demo') {
      alert('Guarda / selecciona una landing real antes de publicar hosting.');
      return;
    }

    if (provider === 'webhook' && !String(formData.hostingDeployHookUrl || '').trim()) {
      alert('Pega primero la URL del Deploy Hook.');
      return;
    }

    if (provider === 'github') {
      if (!formData.hostingGithubOwner || !formData.hostingGithubRepo) {
        alert('Completa owner y repo de GitHub, o usa un Deploy Hook.');
        return;
      }
    }

    setDeploying(true);
    setDeployMessage('');
    try {
      const result = await triggerHostingDeploy(pageId, formData);
      const msg = result?.message || 'Deploy disparado.';
      setDeployMessage(msg);
      alert(msg);
    } catch (error) {
      console.error(error);
      alert(error?.message || 'No se pudo disparar el deploy.');
    } finally {
      setDeploying(false);
    }
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
          En un deploy multi-tenant, la app resuelve el
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
            <li>Crea el proyecto en la cuenta Firebase del cliente (manual).</li>
            <li>Activa Firestore + Storage y copia las credenciales web aquí.</li>
            <li>Aplica reglas de lectura pública en <code className="bg-white px-1 rounded">pages</code> (y Storage).</li>
            <li>Pulsa <strong>Guardar y Publicar</strong>: el contenido se copia al externo.</li>
          </ol>
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

      <fieldset className="space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
        <legend className="px-1 text-[10px] font-bold text-indigo-700 uppercase">
          Hosting del template (cuenta manual)
        </legend>
        <p className="text-[10px] text-indigo-900/80 leading-relaxed">
          Crea el sitio en Vercel/Netlify/Cloudflare/Firebase a mano. Aquí solo guardas la
          configuración y disparas el deploy. El admin no crea cuentas de hosting.
        </p>

        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-gray-500 uppercase">Proveedor</label>
          <select
            value={provider}
            onChange={(e) => onChange({ ...formData, hostingProvider: e.target.value })}
            className="w-full border p-2.5 text-xs rounded-lg bg-white"
          >
            {HOSTING_PROVIDERS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <p className="text-[10px] text-gray-500">{providerMeta.description}</p>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-gray-500 uppercase">URL pública (opcional)</label>
          <input
            type="url"
            value={formData.hostingPublicUrl || ''}
            onChange={(e) => onChange({ ...formData, hostingPublicUrl: e.target.value.trim() })}
            placeholder="https://dra-maria.com"
            className="w-full border p-2 text-xs rounded-lg font-mono"
          />
        </div>

        {(provider === 'hub' || provider === 'webhook') && (
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-500 uppercase">
              Deploy Hook URL
              {provider === 'hub' ? ' (opcional si hay hook global en Functions)' : ''}
            </label>
            <input
              type="url"
              value={formData.hostingDeployHookUrl || ''}
              onChange={(e) => onChange({ ...formData, hostingDeployHookUrl: e.target.value.trim() })}
              placeholder="https://api.vercel.com/v1/integrations/deploy/..."
              className="w-full border p-2 text-xs rounded-lg font-mono"
            />
            <p className="text-[10px] text-gray-500">
              Vercel: Project → Settings → Git → Deploy Hooks.
              Netlify: Site settings → Build & deploy → Build hooks.
            </p>
          </div>
        )}

        {provider === 'github' && (
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-500 uppercase">Owner</label>
              <input
                type="text"
                value={formData.hostingGithubOwner || ''}
                onChange={(e) => onChange({ ...formData, hostingGithubOwner: e.target.value.trim() })}
                placeholder="raulizqli"
                className="w-full border p-2 text-xs rounded-lg font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-500 uppercase">Repo</label>
              <input
                type="text"
                value={formData.hostingGithubRepo || ''}
                onChange={(e) => onChange({ ...formData, hostingGithubRepo: e.target.value.trim() })}
                placeholder="landing-admin"
                className="w-full border p-2 text-xs rounded-lg font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-500 uppercase">Workflow file</label>
              <input
                type="text"
                value={formData.hostingGithubWorkflow || 'deploy-template-manual.yml'}
                onChange={(e) => onChange({ ...formData, hostingGithubWorkflow: e.target.value.trim() })}
                placeholder="deploy-template-manual.yml"
                className="w-full border p-2 text-xs rounded-lg font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-500 uppercase">Branch / ref</label>
              <input
                type="text"
                value={formData.hostingGithubRef || 'master'}
                onChange={(e) => onChange({ ...formData, hostingGithubRef: e.target.value.trim() })}
                placeholder="master"
                className="w-full border p-2 text-xs rounded-lg font-mono"
              />
            </div>
            <p className="sm:col-span-2 text-[10px] text-gray-500">
              En Cloud Functions define <code className="bg-white px-1 rounded">GITHUB_DEPLOY_TOKEN</code>
              {' '}
              (PAT con <code className="bg-white px-1 rounded">actions:write</code>).
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleDeploy}
            disabled={deploying || !pageId}
            className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {deploying ? 'Disparando…' : 'Publicar hosting'}
          </button>
          <span className="text-[10px] text-gray-500">
            Guarda la página para persistir estos campos; el botón también envía la config actual.
          </span>
        </div>
        {deployMessage && (
          <p className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1.5">
            {deployMessage}
          </p>
        )}
      </fieldset>
    </div>
  );
}
