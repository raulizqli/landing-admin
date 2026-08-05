import { getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";

if (getApps().length === 0) {
  initializeApp();
}

const USERS_COLLECTION = "users";
const PAGES_COLLECTIONS = ["pages", "paginas"] as const;
const PRIVATE_HOSTING_DOC = "hosting";

type HostingProvider = "hub" | "webhook" | "github";

interface TriggerHostingDeployPayload extends PageHostingFields {
  pageId?: string;
}

interface PageHostingFields {
  hostingProvider?: string;
  hostingDeployHookUrl?: string;
  hostingGithubOwner?: string;
  hostingGithubRepo?: string;
  hostingGithubWorkflow?: string;
  hostingGithubRef?: string;
  hostingPublicUrl?: string;
  name?: string;
  customDomain?: string;
}

function normalizeProvider(value: unknown): HostingProvider {
  const provider = String(value ?? "").trim();
  if (provider === "webhook" || provider === "github") return provider;
  return "hub";
}

async function assertHostingCaller(request: CallableRequest) {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }

  const callerDoc = await getFirestore()
    .collection(USERS_COLLECTION)
    .doc(request.auth.uid)
    .get();

  const role = callerDoc.data()?.role;
  if (!callerDoc.exists || (role !== "root" && role !== "admin")) {
    throw new HttpsError(
      "permission-denied",
      "Solo root o admin pueden disparar un deploy de hosting.",
    );
  }

  return request.auth.uid;
}

async function loadHubPage(
  pageId: string,
): Promise<{ collectionName: string; page: PageHostingFields }> {
  const db = getFirestore();
  for (const collectionName of PAGES_COLLECTIONS) {
    const snap = await db.collection(collectionName).doc(pageId).get();
    if (snap.exists) {
      return {
        collectionName,
        page: (snap.data() ?? {}) as PageHostingFields,
      };
    }
  }
  throw new HttpsError("not-found", `No existe la página "${pageId}" en el hub.`);
}

async function loadPrivateHosting(
  collectionName: string,
  pageId: string,
): Promise<Partial<PageHostingFields>> {
  const snap = await getFirestore()
    .collection(collectionName)
    .doc(pageId)
    .collection("private")
    .doc(PRIVATE_HOSTING_DOC)
    .get();
  if (!snap.exists) return {};
  return (snap.data() ?? {}) as Partial<PageHostingFields>;
}

function resolveWebhookUrl(page: PageHostingFields, provider: HostingProvider): string {
  const fromPage = String(page.hostingDeployHookUrl ?? "").trim();
  if (fromPage) return fromPage;

  if (provider === "hub") {
    return String(process.env.DEFAULT_TEMPLATE_DEPLOY_HOOK_URL ?? "").trim();
  }

  return "";
}

async function postWebhook(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new HttpsError(
      "internal",
      `El webhook respondió ${response.status}: ${text.slice(0, 240) || response.statusText}`,
    );
  }

  return {
    status: response.status,
    body: text.slice(0, 500),
  };
}

async function dispatchGithubWorkflow(page: PageHostingFields, pageId: string, token: string) {
  const owner = String(page.hostingGithubOwner ?? "").trim();
  const repo = String(page.hostingGithubRepo ?? "").trim();
  const workflow = String(page.hostingGithubWorkflow ?? "").trim() || "deploy-template-manual.yml";
  const ref = String(page.hostingGithubRef ?? "").trim() || "master";

  if (!owner || !repo) {
    throw new HttpsError(
      "failed-precondition",
      "Configura owner y repo de GitHub en la página (o usa un Deploy Hook).",
    );
  }
  if (!token) {
    throw new HttpsError(
      "failed-precondition",
      "Falta el secret GITHUB_DEPLOY_TOKEN en Cloud Functions.",
    );
  }

  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/workflows/${encodeURIComponent(workflow)}/dispatches`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ref,
      inputs: {
        page_id: pageId,
      },
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new HttpsError(
      "internal",
      `GitHub Actions respondió ${response.status}: ${text.slice(0, 240) || response.statusText}`,
    );
  }

  return {
    status: response.status,
    owner,
    repo,
    workflow,
    ref,
  };
}

const callableOptions = {
  cors: true,
  invoker: "public" as const,
};

export const triggerHostingDeploy = onCall(
  callableOptions,
  async (request: CallableRequest<TriggerHostingDeployPayload>) => {
    await assertHostingCaller(request);

    const pageId = String(request.data?.pageId ?? "").trim();
    if (!pageId) {
      throw new HttpsError("invalid-argument", "El pageId es obligatorio.");
    }

    const { collectionName, page } = await loadHubPage(pageId);
    const privateHosting = await loadPrivateHosting(collectionName, pageId);
    const overrides = (request.data ?? {}) as PageHostingFields;

    // Prefer private/hosting secrets; fall back to legacy public page field (migration).
    // Never trust client-supplied hostingDeployHookUrl (SSRF / secret exfil mitigation).
    const storedHook = String(
      privateHosting.hostingDeployHookUrl
        ?? page.hostingDeployHookUrl
        ?? "",
    ).trim();

    const effective: PageHostingFields = {
      ...page,
      hostingProvider: overrides.hostingProvider || page.hostingProvider || privateHosting.hostingProvider,
      hostingDeployHookUrl: storedHook,
      hostingGithubOwner:
        overrides.hostingGithubOwner
        ?? privateHosting.hostingGithubOwner
        ?? page.hostingGithubOwner,
      hostingGithubRepo:
        overrides.hostingGithubRepo
        ?? privateHosting.hostingGithubRepo
        ?? page.hostingGithubRepo,
      hostingGithubWorkflow:
        overrides.hostingGithubWorkflow
        ?? privateHosting.hostingGithubWorkflow
        ?? page.hostingGithubWorkflow,
      hostingGithubRef:
        overrides.hostingGithubRef
        ?? privateHosting.hostingGithubRef
        ?? page.hostingGithubRef,
      hostingPublicUrl:
        overrides.hostingPublicUrl
        ?? privateHosting.hostingPublicUrl
        ?? page.hostingPublicUrl,
    };
    const provider = normalizeProvider(effective.hostingProvider);
    const payload = {
      pageId,
      name: page.name || "",
      customDomain: page.customDomain || "",
      source: "landing-admin",
      triggeredAt: new Date().toISOString(),
    };

    if (provider === "github") {
      const token = String(process.env.GITHUB_DEPLOY_TOKEN ?? "").trim();
      const result = await dispatchGithubWorkflow(effective, pageId, token);
      return {
        ok: true,
        provider,
        pageId,
        message: `Workflow ${result.workflow} disparado en ${result.owner}/${result.repo}@${result.ref}.`,
        publicUrl: String(effective.hostingPublicUrl ?? "").trim() || null,
        detail: result,
      };
    }

    const webhookUrl = resolveWebhookUrl(effective, provider);
    if (!webhookUrl) {
      throw new HttpsError(
        "failed-precondition",
        provider === "hub"
          ? "Configura un Deploy Hook en esta página o el env DEFAULT_TEMPLATE_DEPLOY_HOOK_URL en Cloud Functions."
          : "Pegá la URL del Deploy Hook (Vercel/Netlify/Cloudflare) en esta página.",
      );
    }

    const result = await postWebhook(webhookUrl, payload);
    return {
      ok: true,
      provider,
      pageId,
      message: "Deploy Hook disparado correctamente.",
      publicUrl: String(effective.hostingPublicUrl ?? "").trim() || null,
      detail: result,
    };
  },
);
