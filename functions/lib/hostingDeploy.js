"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerHostingDeploy = void 0;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
const USERS_COLLECTION = "users";
const PAGES_COLLECTIONS = ["pages", "paginas"];
function normalizeProvider(value) {
    const provider = String(value !== null && value !== void 0 ? value : "").trim();
    if (provider === "webhook" || provider === "github")
        return provider;
    return "hub";
}
async function assertHostingCaller(request) {
    var _a, _b;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const callerDoc = await (0, firestore_1.getFirestore)()
        .collection(USERS_COLLECTION)
        .doc(request.auth.uid)
        .get();
    const role = (_b = callerDoc.data()) === null || _b === void 0 ? void 0 : _b.role;
    if (!callerDoc.exists || (role !== "root" && role !== "admin")) {
        throw new https_1.HttpsError("permission-denied", "Solo root o admin pueden disparar un deploy de hosting.");
    }
    return request.auth.uid;
}
async function loadHubPage(pageId) {
    var _a;
    const db = (0, firestore_1.getFirestore)();
    for (const collectionName of PAGES_COLLECTIONS) {
        const snap = await db.collection(collectionName).doc(pageId).get();
        if (snap.exists) {
            return ((_a = snap.data()) !== null && _a !== void 0 ? _a : {});
        }
    }
    throw new https_1.HttpsError("not-found", `No existe la página "${pageId}" en el hub.`);
}
function resolveWebhookUrl(page, provider) {
    var _a, _b;
    const fromPage = String((_a = page.hostingDeployHookUrl) !== null && _a !== void 0 ? _a : "").trim();
    if (fromPage)
        return fromPage;
    if (provider === "hub") {
        return String((_b = process.env.DEFAULT_TEMPLATE_DEPLOY_HOOK_URL) !== null && _b !== void 0 ? _b : "").trim();
    }
    return "";
}
async function postWebhook(url, body) {
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
        throw new https_1.HttpsError("internal", `El webhook respondió ${response.status}: ${text.slice(0, 240) || response.statusText}`);
    }
    return {
        status: response.status,
        body: text.slice(0, 500),
    };
}
async function dispatchGithubWorkflow(page, pageId, token) {
    var _a, _b, _c, _d;
    const owner = String((_a = page.hostingGithubOwner) !== null && _a !== void 0 ? _a : "").trim();
    const repo = String((_b = page.hostingGithubRepo) !== null && _b !== void 0 ? _b : "").trim();
    const workflow = String((_c = page.hostingGithubWorkflow) !== null && _c !== void 0 ? _c : "").trim() || "deploy-template-manual.yml";
    const ref = String((_d = page.hostingGithubRef) !== null && _d !== void 0 ? _d : "").trim() || "master";
    if (!owner || !repo) {
        throw new https_1.HttpsError("failed-precondition", "Configura owner y repo de GitHub en la página (o usa un Deploy Hook).");
    }
    if (!token) {
        throw new https_1.HttpsError("failed-precondition", "Falta el secret GITHUB_DEPLOY_TOKEN en Cloud Functions.");
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
        throw new https_1.HttpsError("internal", `GitHub Actions respondió ${response.status}: ${text.slice(0, 240) || response.statusText}`);
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
    invoker: "public",
};
exports.triggerHostingDeploy = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    await assertHostingCaller(request);
    const pageId = String((_b = (_a = request.data) === null || _a === void 0 ? void 0 : _a.pageId) !== null && _b !== void 0 ? _b : "").trim();
    if (!pageId) {
        throw new https_1.HttpsError("invalid-argument", "El pageId es obligatorio.");
    }
    const page = await loadHubPage(pageId);
    const overrides = ((_c = request.data) !== null && _c !== void 0 ? _c : {});
    const effective = Object.assign(Object.assign({}, page), { hostingProvider: overrides.hostingProvider || page.hostingProvider, hostingDeployHookUrl: (_d = overrides.hostingDeployHookUrl) !== null && _d !== void 0 ? _d : page.hostingDeployHookUrl, hostingGithubOwner: (_e = overrides.hostingGithubOwner) !== null && _e !== void 0 ? _e : page.hostingGithubOwner, hostingGithubRepo: (_f = overrides.hostingGithubRepo) !== null && _f !== void 0 ? _f : page.hostingGithubRepo, hostingGithubWorkflow: (_g = overrides.hostingGithubWorkflow) !== null && _g !== void 0 ? _g : page.hostingGithubWorkflow, hostingGithubRef: (_h = overrides.hostingGithubRef) !== null && _h !== void 0 ? _h : page.hostingGithubRef, hostingPublicUrl: (_j = overrides.hostingPublicUrl) !== null && _j !== void 0 ? _j : page.hostingPublicUrl });
    const provider = normalizeProvider(effective.hostingProvider);
    const payload = {
        pageId,
        name: page.name || "",
        customDomain: page.customDomain || "",
        source: "landing-admin",
        triggeredAt: new Date().toISOString(),
    };
    if (provider === "github") {
        const token = String((_k = process.env.GITHUB_DEPLOY_TOKEN) !== null && _k !== void 0 ? _k : "").trim();
        const result = await dispatchGithubWorkflow(effective, pageId, token);
        return {
            ok: true,
            provider,
            pageId,
            message: `Workflow ${result.workflow} disparado en ${result.owner}/${result.repo}@${result.ref}.`,
            publicUrl: String((_l = effective.hostingPublicUrl) !== null && _l !== void 0 ? _l : "").trim() || null,
            detail: result,
        };
    }
    const webhookUrl = resolveWebhookUrl(effective, provider);
    if (!webhookUrl) {
        throw new https_1.HttpsError("failed-precondition", provider === "hub"
            ? "Configura un Deploy Hook en esta página o el env DEFAULT_TEMPLATE_DEPLOY_HOOK_URL en Cloud Functions."
            : "Pegá la URL del Deploy Hook (Vercel/Netlify/Cloudflare) en esta página.");
    }
    const result = await postWebhook(webhookUrl, payload);
    return {
        ok: true,
        provider,
        pageId,
        message: "Deploy Hook disparado correctamente.",
        publicUrl: String((_m = effective.hostingPublicUrl) !== null && _m !== void 0 ? _m : "").trim() || null,
        detail: result,
    };
});
//# sourceMappingURL=hostingDeploy.js.map