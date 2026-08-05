
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
 * Deploy hook + GitHub workflow targets live in pages/{id}/private/hosting (F03).
 */
export function getHostingDeployRoutingFields(pageData = {}) {
  const fields = normalizeHostingDeployFields(pageData);
  return {
    hostingProvider: fields.hostingProvider,
    hostingPublicUrl: fields.hostingPublicUrl,
    // Cleared on public docs — real values under private/hosting (migration).
    hostingGithubOwner: '',
    hostingGithubRepo: '',
    hostingGithubWorkflow: '',
    hostingGithubRef: '',
  };
}

/** Secret / ops hosting fields for pages/{id}/private/hosting. */
export function getPrivateHostingFields(pageData = {}) {
  const fields = normalizeHostingDeployFields(pageData);
  return {
    hostingDeployHookUrl: fields.hostingDeployHookUrl,
    hostingGithubOwner: fields.hostingGithubOwner,
    hostingGithubRepo: fields.hostingGithubRepo,
    hostingGithubWorkflow: fields.hostingGithubWorkflow,
    hostingGithubRef: fields.hostingGithubRef,
    updatedAt: new Date().toISOString(),
  };
}

/** Merge private hosting into editor form (legacy public fields as fallback). */
export function mergePrivateHostingIntoPage(pageData = {}, privateHosting = {}) {
  const legacy = normalizeHostingDeployFields(pageData);
  const priv = privateHosting && typeof privateHosting === 'object' ? privateHosting : {};
  return {
    ...pageData,
    hostingDeployHookUrl: String(priv.hostingDeployHookUrl ?? legacy.hostingDeployHookUrl ?? '').trim(),
    hostingGithubOwner: String(priv.hostingGithubOwner ?? legacy.hostingGithubOwner ?? '').trim(),
    hostingGithubRepo: String(priv.hostingGithubRepo ?? legacy.hostingGithubRepo ?? '').trim(),
    hostingGithubWorkflow:
      String(priv.hostingGithubWorkflow ?? legacy.hostingGithubWorkflow ?? '').trim()
      || 'deploy-template-manual.yml',
    hostingGithubRef:
      String(priv.hostingGithubRef ?? legacy.hostingGithubRef ?? '').trim() || 'master',
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
