
export const HOSTING_PROVIDERS = [
  {
    value: 'hub',
    label: 'Hub (Firebase Hosting del ecosistema)',
    description: 'El mismo Hosting del admin. Usa el hook/CI global si está configurado, o el hook de esta página.',
  },
  {
    value: 'webhook',
    label: 'Webhook (Vercel / Netlify / Cloudflare / custom)',
    description: 'Dispara una URL de Deploy Hook que creaste a mano en el hosting.',
  },
  {
    value: 'github',
    label: 'GitHub Actions (workflow_dispatch)',
    description: 'Lanza un workflow del repo. Requiere el secret GITHUB_DEPLOY_TOKEN en Cloud Functions.',
  },
];

const PROVIDER_SET = new Set(HOSTING_PROVIDERS.map((item) => item.value));

export function normalizeHostingProvider(value) {
  const provider = String(value ?? '').trim();
  return PROVIDER_SET.has(provider) ? provider : 'hub';
}

export function normalizeHostingDeployFields(data = {}) {
  return {
    hostingProvider: normalizeHostingProvider(data.hostingProvider),
    hostingDeployHookUrl: String(data.hostingDeployHookUrl ?? '').trim(),
    hostingGithubOwner: String(data.hostingGithubOwner ?? '').trim(),
    hostingGithubRepo: String(data.hostingGithubRepo ?? '').trim(),
    hostingGithubWorkflow: String(data.hostingGithubWorkflow ?? '').trim() || 'deploy-template-manual.yml',
    hostingGithubRef: String(data.hostingGithubRef ?? '').trim() || 'master',
    hostingPublicUrl: String(data.hostingPublicUrl ?? '').trim(),
  };
}

/**
 * Fields safe to persist on the publicly readable page document.
 * Deploy hook URL lives in pages/{id}/private/hosting (F03).
 */
export function getHostingDeployRoutingFields(pageData = {}) {
  const fields = normalizeHostingDeployFields(pageData);
  return {
    hostingProvider: fields.hostingProvider,
    hostingGithubOwner: fields.hostingGithubOwner,
    hostingGithubRepo: fields.hostingGithubRepo,
    hostingGithubWorkflow: fields.hostingGithubWorkflow,
    hostingGithubRef: fields.hostingGithubRef,
    hostingPublicUrl: fields.hostingPublicUrl,
  };
}

/** Secret hosting fields for pages/{id}/private/hosting. */
export function getPrivateHostingFields(pageData = {}) {
  const fields = normalizeHostingDeployFields(pageData);
  return {
    hostingDeployHookUrl: fields.hostingDeployHookUrl,
    updatedAt: new Date().toISOString(),
  };
}

export function getHostingProviderMeta(value) {
  const provider = normalizeHostingProvider(value);
  return HOSTING_PROVIDERS.find((item) => item.value === provider) ?? HOSTING_PROVIDERS[0];
}

export function canTriggerPageHostingDeploy(pageData = {}) {
  const fields = normalizeHostingDeployFields(pageData);
  if (fields.hostingProvider === 'webhook') {
    return Boolean(fields.hostingDeployHookUrl);
  }
  if (fields.hostingProvider === 'github') {
    return Boolean(fields.hostingGithubOwner && fields.hostingGithubRepo && fields.hostingGithubWorkflow);
  }
  // hub: hook on page or global env (checked server-side)
  return true;
}
