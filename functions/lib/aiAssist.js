"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAiAssistUsage = exports.setAiProviderConfig = exports.runAiAssist = exports.generateLandingDraft = void 0;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const aiProviders_js_1 = require("./aiProviders.js");
const callableOptions_js_1 = require("./callableOptions.js");
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
const USERS_COLLECTION = "users";
const BILLING_ACCOUNTS_COLLECTION = "billingAccounts";
const AI_USAGE_SUBCOLLECTION = "aiUsage";
const AI_SECRETS_DOC = "aiProvider";
const callableOptions = (0, callableOptions_js_1.sensitiveCallableOptions)();
const longCallableOptions = (0, callableOptions_js_1.sensitiveCallableOptions)({ timeoutSeconds: 120 });
const LITE_ACTIONS = new Set(["rewrite_field", "polish_bio", "polish_tagline", "hero_suggest"]);
const FULL_ACTIONS = new Set([
    ...LITE_ACTIONS,
    "service_blurb",
    "seo_meta",
    "blog_draft",
    "suggest_page_structure",
    "generate_page_content",
    "generate_logo",
]);
const STRUCTURE_SECTION_FLAGS = [
    "preHeroEnabled",
    "heroSectionEnabled",
    "aboutSectionEnabled",
    "servicesSectionEnabled",
    "catalogSectionEnabled",
    "gallerySectionEnabled",
    "videoSectionEnabled",
    "testimonialsEnabled",
    "blogSectionEnabled",
    "contactSectionEnabled",
    "socialSectionEnabled",
    "footerSectionEnabled",
];
const PLAN_QUOTAS = {
    starter: { lite: 30, full: 0, logo: 0, aiAssist: false, aiByok: false },
    pro: { lite: 30, full: 50, logo: 3, aiAssist: true, aiByok: false },
    agency: { lite: 30, full: 200, logo: null, aiAssist: true, aiByok: true },
    enterprise: { lite: 30, full: null, logo: null, aiAssist: true, aiByok: true },
};
function normalizePlanId(value) {
    const id = String(value !== null && value !== void 0 ? value : "").trim().toLowerCase();
    return PLAN_QUOTAS[id] ? id : "starter";
}
function normalizePageIdList(values) {
    if (!Array.isArray(values))
        return [];
    return [...new Set(values.map((value) => String(value !== null && value !== void 0 ? value : "").trim()).filter(Boolean))];
}
function canAccessPage(profile, pageId) {
    var _a, _b;
    const role = String((_a = profile.role) !== null && _a !== void 0 ? _a : "").trim().toLowerCase();
    if (role === "root")
        return true;
    if (role === "admin")
        return normalizePageIdList(profile.assignedPageIds).includes(pageId);
    if (role === "user") {
        const single = String((_b = profile.pageId) !== null && _b !== void 0 ? _b : "").trim();
        if (single)
            return single === pageId;
        return normalizePageIdList(profile.assignedPageIds)[0] === pageId;
    }
    return false;
}
function isActiveStatus(status) {
    const value = String(status !== null && status !== void 0 ? status : "").trim().toLowerCase();
    return value === "active" || value === "trialing";
}
function currentPeriod(date = new Date()) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
async function getCallerProfile(uid) {
    var _a;
    const snap = await (0, firestore_1.getFirestore)().collection(USERS_COLLECTION).doc(uid).get();
    if (!snap.exists) {
        throw new https_1.HttpsError("permission-denied", "Perfil de usuario no encontrado.");
    }
    return Object.assign({ uid }, ((_a = snap.data()) !== null && _a !== void 0 ? _a : {}));
}
function aiSecretsRef(accountId) {
    return (0, firestore_1.getFirestore)()
        .collection(BILLING_ACCOUNTS_COLLECTION)
        .doc(accountId)
        .collection("secrets")
        .doc(AI_SECRETS_DOC);
}
/** Persist BYOK key in Admin-only secrets subcollection (never on the public billingAccounts doc). */
async function saveByokApiKey(accountId, apiKey) {
    const trimmed = String(apiKey !== null && apiKey !== void 0 ? apiKey : "").trim();
    if (!trimmed) {
        await aiSecretsRef(accountId).delete().catch(() => undefined);
        return;
    }
    await aiSecretsRef(accountId).set({
        apiKey: trimmed,
        updatedAt: new Date().toISOString(),
    }, { merge: true });
}
/**
 * Load BYOK key from secrets/. Migrates legacy plaintext apiKey off billingAccounts if present (F11).
 */
async function loadByokApiKey(accountId, accountData) {
    var _a, _b, _c;
    const secretsSnap = await aiSecretsRef(accountId).get();
    const fromSecrets = String((_b = (_a = secretsSnap.data()) === null || _a === void 0 ? void 0 : _a.apiKey) !== null && _b !== void 0 ? _b : "").trim();
    if (fromSecrets)
        return fromSecrets;
    const legacy = (accountData.aiProvider && typeof accountData.aiProvider === "object")
        ? accountData.aiProvider
        : {};
    const legacyKey = String((_c = legacy.apiKey) !== null && _c !== void 0 ? _c : "").trim();
    if (!legacyKey)
        return "";
    await saveByokApiKey(accountId, legacyKey);
    await (0, firestore_1.getFirestore)().collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId).set({
        aiProvider: Object.assign(Object.assign({}, legacy), { apiKey: firestore_1.FieldValue.delete(), apiKeyLast4: legacy.apiKeyLast4 || legacyKey.slice(-4), hasKey: true }),
        updatedAt: new Date().toISOString(),
    }, { merge: true });
    return legacyKey;
}
function resolveLane(account, isRoot) {
    if (isRoot)
        return "full";
    const planId = normalizePlanId(account.plan);
    const quota = PLAN_QUOTAS[planId];
    if (isActiveStatus(account.status) && quota.aiAssist)
        return "full";
    return "lite";
}
function buildSystemPrompt(language, vertical) {
    const lang = language === "en" ? "English" : "Spanish";
    return [
        "You are a writing assistant for professional service landing pages (psychology, therapy, coaching, clinics).",
        `Write in ${lang}.`,
        "Tone: warm, clear, ethical. Never invent clinical diagnoses, guarantees of cure, or medical claims.",
        "Return ONLY valid JSON as instructed. No markdown fences.",
        `Vertical context: ${vertical || "generic"}.`,
    ].join(" ");
}
function buildUserPrompt(payload) {
    if (payload.action === "suggest_page_structure") {
        return [
            "Action: suggest_page_structure",
            "Recommend which landing-page sections to enable for this business.",
            `Selected vertical (prefer unless the note clearly requires another): ${payload.context.vertical || "generic"}.`,
            "Allowed vertical values: generic, psychology, dental, veterinary, legal, medical, beauty, fitness, education, ecommerce.",
            `Allowed section flags: ${STRUCTURE_SECTION_FLAGS.join(", ")}.`,
            "Always enable heroSectionEnabled, aboutSectionEnabled, contactSectionEnabled, and footerSectionEnabled unless there is a strong reason not to.",
            "Do not invent contact details, prices, testimonials, credentials, or medical claims.",
            "Return ONLY one valid JSON object. No markdown fences.",
            "Use exactly this shape:",
            JSON.stringify({
                vertical: "one allowed vertical value",
                summary: "1-2 sentences explaining the recommended structure",
                recommendedSections: [
                    { flag: "servicesSectionEnabled", enabled: true, reason: "short reason" },
                ],
            }),
            payload.context.name ? `Brand/name: ${payload.context.name}` : "",
            payload.context.specialty ? `Specialty: ${payload.context.specialty}` : "",
            payload.brief ? `User note:\n${payload.brief}` : "User note: (none)",
        ].filter(Boolean).join("\n");
    }
    if (payload.action === "generate_page_content") {
        const targets = Array.isArray(payload.context.targets)
            ? payload.context.targets.map((item) => String(item !== null && item !== void 0 ? item : "").trim()).filter(Boolean)
            : [];
        const shape = {};
        if (targets.includes("seo"))
            shape.seo = { title: "string", description: "string" };
        if (targets.includes("hero"))
            shape.hero = { title: "string", text: "string" };
        if (targets.includes("preHero"))
            shape.preHero = { title: "string", text: "string" };
        if (targets.includes("about"))
            shape.about = { tagline: "string", bio: "string" };
        if (targets.includes("services")) {
            shape.services = {
                sectionTitle: "string",
                sectionText: "string",
                items: [{ title: "string", description: "string" }],
            };
        }
        if (targets.includes("catalog")) {
            shape.catalog = {
                sectionTitle: "string",
                sectionText: "string",
                items: [{ title: "string", description: "string" }],
            };
        }
        if (targets.includes("testimonials")) {
            shape.testimonials = {
                sectionTitle: "string",
                items: [{ title: "optional attribution", quote: "string" }],
            };
        }
        if (targets.includes("blog")) {
            shape.blog = {
                sectionTitle: "string",
                sectionText: "string",
                posts: [{ title: "string", excerpt: "string", body: "string" }],
            };
        }
        const lang = payload.context.language === "en" ? "English" : "Spanish";
        return [
            "Action: generate_page_content",
            "Write starter copy to pre-fill a landing page form.",
            `Language: ${lang}.`,
            `Vertical: ${payload.context.vertical || "generic"}.`,
            `Generate ONLY these content blocks: ${targets.join(", ") || "(none)"}.`,
            "Do not invent phone numbers, emails, addresses, prices, credentials, or medical claims.",
            'For testimonials use generic attribution (e.g. "Paciente", "Cliente") — no real names.',
            "Services/catalog: 2-4 concise items when requested.",
            "Blog: at most 1 post when requested.",
            payload.context.structureSummary
                ? `Structure rationale:\n${payload.context.structureSummary}`
                : "",
            payload.context.name ? `Brand/name: ${payload.context.name}` : "",
            payload.context.specialty ? `Specialty: ${payload.context.specialty}` : "",
            payload.brief ? `User note:\n${payload.brief}` : "User note: (none)",
            "Return ONLY one valid JSON object matching this shape (omit keys not requested):",
            JSON.stringify(shape),
        ].filter(Boolean).join("\n");
    }
    return [
        `Action: ${payload.action}`,
        `Tone: ${payload.tone}`,
        payload.fieldPath ? `Field: ${payload.fieldPath}` : "",
        payload.context.name ? `Brand/name: ${payload.context.name}` : "",
        payload.context.specialty ? `Specialty: ${payload.context.specialty}` : "",
        payload.brief ? `Brief: ${payload.brief}` : "",
        payload.currentValue ? `Current text:\n${payload.currentValue}` : "",
        'Respond as JSON object with keys appropriate to the action (at least "text" for rewrites).',
    ].filter(Boolean).join("\n");
}
async function assertAndIncrementQuota(accountId, lane, limit, isRoot) {
    if (isRoot || limit == null) {
        return { generations: 0, limit, remaining: null };
    }
    if (limit <= 0) {
        throw new https_1.HttpsError("permission-denied", lane === "logo"
            ? "Generar logo con IA requiere plan Pro o superior."
            : "Esta acción de IA no está incluida en tu plan.");
    }
    const period = currentPeriod();
    const ref = (0, firestore_1.getFirestore)()
        .collection(BILLING_ACCOUNTS_COLLECTION)
        .doc(accountId)
        .collection(AI_USAGE_SUBCOLLECTION)
        .doc(`${period}-${lane}`);
    const used = await (0, firestore_1.getFirestore)().runTransaction(async (tx) => {
        var _a, _b;
        const snap = await tx.get(ref);
        const generations = Number((_b = (_a = snap.data()) === null || _a === void 0 ? void 0 : _a.generations) !== null && _b !== void 0 ? _b : 0) || 0;
        if (generations >= limit) {
            throw new https_1.HttpsError("resource-exhausted", lane === "logo"
                ? `Cuota de logos IA agotada (${limit}/mes en Pro). Mejora a Agency para ilimitado, o espera al próximo periodo.`
                : `Cuota de IA ${lane} agotada (${limit}/mes). Mejora tu plan o espera al próximo periodo.`);
        }
        tx.set(ref, {
            period,
            lane,
            generations: generations + 1,
            updatedAt: new Date().toISOString(),
        }, { merge: true });
        return generations + 1;
    });
    return {
        generations: used,
        limit,
        remaining: Math.max(0, limit - used),
    };
}
/** Firebase clients redact messages for code "internal"; use unavailable + details. */
function sanitizeAiProviderMessage(error, fallback) {
    const raw = error instanceof Error
        ? error.message
        : typeof error === "string"
            ? error
            : "";
    const cleaned = String(raw || "").replace(/\s+/g, " ").trim().slice(0, 280);
    if (!cleaned || /^(internal|unknown)$/i.test(cleaned)) {
        return fallback;
    }
    if (/401|unauthorized|invalid.?api.?key|api.?key/i.test(cleaned)) {
        return `API key del proveedor de IA faltante o inválida. (${cleaned.slice(0, 180)})`;
    }
    if (/403|permission|forbidden/i.test(cleaned)) {
        return `El proveedor de IA rechazó el acceso. (${cleaned.slice(0, 180)})`;
    }
    if (/429|rate.?limit|quota|resource.?exhausted/i.test(cleaned)) {
        return `Límite o cuota del proveedor de IA agotada. (${cleaned.slice(0, 180)})`;
    }
    if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT|fetch failed|network|socket/i.test(cleaned)) {
        return `No se pudo conectar con el proveedor de IA. (${cleaned.slice(0, 180)})`;
    }
    return cleaned;
}
function throwAiProviderFailure(error, fallback) {
    const message = sanitizeAiProviderMessage(error, fallback);
    throw new https_1.HttpsError("unavailable", message, {
        reason: "ai_provider_failure",
        detail: message,
    });
}
function buildLandingDraftPrompt(brief, language, vertical) {
    const lang = language === "en" ? "English" : "Spanish";
    return [
        "Create a complete first draft for a professional landing page from the user's brief below.",
        `Write all public-facing copy in ${lang}.`,
        `Selected vertical (use it unless the brief clearly requires another): ${vertical || "generic"}.`,
        "Allowed vertical values: generic, psychology, dental, veterinary, legal, medical, beauty, fitness, education, ecommerce.",
        "Do not invent contact details, addresses, credentials, testimonials, prices, guarantees, diagnoses, or regulated claims.",
        "Make the copy specific to the audience and goal described by the user; avoid generic filler.",
        "Hero title: concise and benefit-led. Hero text: 1-2 clear sentences.",
        "About tagline: one sentence. About bio: 90-160 words.",
        "Generate 3-6 services, each with a short title and a 2-3 sentence description.",
        "SEO title: at most 60 characters. SEO description: at most 155 characters.",
        "Return ONLY one valid JSON object. No markdown fences and no commentary.",
        "Use exactly this shape:",
        JSON.stringify({
            name: "brand or professional name",
            specialty: "clear specialty or business category",
            vertical: "one allowed vertical value",
            hero: { title: "string", text: "string" },
            about: { tagline: "string", bio: "string" },
            servicesSection: { title: "string", text: "string" },
            services: [{ title: "string", description: "string" }],
            seo: { title: "string", description: "string" },
        }),
        "USER BRIEF (preserve all relevant details):",
        brief,
    ].join("\n");
}
exports.generateLandingDraft = (0, https_1.onCall)(longCallableOptions, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const profile = await getCallerProfile(request.auth.uid);
    if (String((_b = profile.role) !== null && _b !== void 0 ? _b : "").trim().toLowerCase() !== "root") {
        throw new https_1.HttpsError("permission-denied", "Solo root puede crear páginas con IA.");
    }
    const brief = String((_d = (_c = request.data) === null || _c === void 0 ? void 0 : _c.brief) !== null && _d !== void 0 ? _d : "").trim();
    if (brief.length < 80) {
        throw new https_1.HttpsError("invalid-argument", "Describe con más detalle el objetivo, público, servicios y propuesta de valor.");
    }
    if (brief.length > 12000) {
        throw new https_1.HttpsError("invalid-argument", "La descripción es demasiado larga (máximo 12,000 caracteres).");
    }
    const language = String((_f = (_e = request.data) === null || _e === void 0 ? void 0 : _e.language) !== null && _f !== void 0 ? _f : "es").toLowerCase().startsWith("en") ? "en" : "es";
    const vertical = String((_h = (_g = request.data) === null || _g === void 0 ? void 0 : _g.vertical) !== null && _h !== void 0 ? _h : "generic").trim().toLowerCase() || "generic";
    const system = [
        "You are a conversion copywriter and information architect for professional landing pages.",
        `Write in ${language === "en" ? "English" : "Spanish"}.`,
        "Use a clear, trustworthy tone appropriate to the business vertical.",
        "Never invent facts, credentials, contact details, reviews, guarantees, diagnoses, or regulated claims.",
        "Return ONLY valid JSON matching the requested schema. No markdown fences.",
    ].join(" ");
    const user = buildLandingDraftPrompt(brief, language, vertical);
    const providers = [...new Set([(0, aiProviders_js_1.resolveFullProvider)(), ...(0, aiProviders_js_1.resolveLiteProviderChain)()])];
    const failures = [];
    for (const provider of providers) {
        try {
            const output = await (0, aiProviders_js_1.runProviderChat)(provider, { system, user });
            if (output.provider === "mock") {
                failures.push(`${provider}: respuesta mock (sin proveedor real)`);
                continue;
            }
            return {
                ok: true,
                provider: output.provider,
                result: output.result,
                disclaimer: "Este contenido es un borrador. Revísalo antes de publicar.",
            };
        }
        catch (error) {
            const detail = sanitizeAiProviderMessage(error, "fallo sin detalle");
            failures.push(`${provider}: ${detail}`);
            console.error("generateLandingDraft provider failure", { provider, detail, error });
        }
    }
    throwAiProviderFailure(new Error(failures.join(" | ") || "Ningún proveedor de IA respondió."), "No se pudo generar el borrador. Revisa claves, modelo y conectividad de IA.");
});
exports.runAiAssist = (0, https_1.onCall)(longCallableOptions, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const profile = await getCallerProfile(request.auth.uid);
    const isRoot = String((_b = profile.role) !== null && _b !== void 0 ? _b : "").trim().toLowerCase() === "root";
    const pageId = String((_d = (_c = request.data) === null || _c === void 0 ? void 0 : _c.pageId) !== null && _d !== void 0 ? _d : "").trim();
    if (!pageId) {
        throw new https_1.HttpsError("invalid-argument", "pageId es obligatorio.");
    }
    if (!canAccessPage(profile, pageId)) {
        throw new https_1.HttpsError("permission-denied", "No tienes acceso a esta página.");
    }
    const action = String((_f = (_e = request.data) === null || _e === void 0 ? void 0 : _e.action) !== null && _f !== void 0 ? _f : "").trim().toLowerCase();
    const tone = String((_h = (_g = request.data) === null || _g === void 0 ? void 0 : _g.tone) !== null && _h !== void 0 ? _h : "empathetic").trim().toLowerCase() || "empathetic";
    const language = String((_k = (_j = request.data) === null || _j === void 0 ? void 0 : _j.language) !== null && _k !== void 0 ? _k : "es").trim().toLowerCase().startsWith("en")
        ? "en"
        : "es";
    const fieldPath = String((_m = (_l = request.data) === null || _l === void 0 ? void 0 : _l.fieldPath) !== null && _m !== void 0 ? _m : "").trim();
    const currentValue = String((_s = (_p = (_o = request.data) === null || _o === void 0 ? void 0 : _o.currentValue) !== null && _p !== void 0 ? _p : (_r = (_q = request.data) === null || _q === void 0 ? void 0 : _q.input) === null || _r === void 0 ? void 0 : _r.currentValue) !== null && _s !== void 0 ? _s : "").trim();
    const brief = String((_x = (_u = (_t = request.data) === null || _t === void 0 ? void 0 : _t.brief) !== null && _u !== void 0 ? _u : (_w = (_v = request.data) === null || _v === void 0 ? void 0 : _v.input) === null || _w === void 0 ? void 0 : _w.brief) !== null && _x !== void 0 ? _x : "").trim();
    const context = (((_z = (_y = request.data) === null || _y === void 0 ? void 0 : _y.input) === null || _z === void 0 ? void 0 : _z.context) || ((_0 = request.data) === null || _0 === void 0 ? void 0 : _0.context) || {});
    const preferredEngine = String((_2 = (_1 = request.data) === null || _1 === void 0 ? void 0 : _1.engine) !== null && _2 !== void 0 ? _2 : "").trim().toLowerCase();
    const accountId = String((_3 = profile.accountId) !== null && _3 !== void 0 ? _3 : profile.uid).trim();
    const accountSnap = await (0, firestore_1.getFirestore)().collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId).get();
    const account = Object.assign({ id: accountId }, ((_4 = accountSnap.data()) !== null && _4 !== void 0 ? _4 : {}));
    const lane = resolveLane(account, isRoot);
    const allowed = lane === "full" ? FULL_ACTIONS : LITE_ACTIONS;
    if (!allowed.has(action)) {
        throw new https_1.HttpsError("permission-denied", lane === "lite"
            ? "Esta acción de IA requiere plan Pro o superior."
            : "Acción de IA no válida.");
    }
    const planId = normalizePlanId(account.plan);
    const quotaConf = PLAN_QUOTAS[planId];
    if (action === "generate_logo") {
        const logoUsage = await assertAndIncrementQuota(accountId, "logo", isRoot ? null : quotaConf.logo, isRoot);
        let logoResult;
        try {
            const byokKey = ((_5 = account.aiProvider) === null || _5 === void 0 ? void 0 : _5.mode) === "byok"
                && quotaConf.aiByok
                && isActiveStatus(account.status)
                ? await loadByokApiKey(accountId, account)
                : "";
            logoResult = await (0, aiProviders_js_1.generateLogoImage)({
                name: String((_6 = context.name) !== null && _6 !== void 0 ? _6 : ""),
                specialty: String((_7 = context.specialty) !== null && _7 !== void 0 ? _7 : ""),
                vertical: String((_8 = context.vertical) !== null && _8 !== void 0 ? _8 : "generic"),
                brief,
                language,
                apiKey: byokKey || undefined,
            });
        }
        catch (error) {
            throwAiProviderFailure(error, "No se pudo generar el logo con IA.");
        }
        return {
            ok: true,
            lane: "full",
            action,
            provider: logoResult.provider,
            result: {
                imageUrl: logoResult.imageUrl,
                url: logoResult.imageUrl,
                text: logoResult.prompt,
                fieldPath,
            },
            usage: {
                period: currentPeriod(),
                lane: "logo",
                generations: logoUsage.generations,
                limit: logoUsage.limit,
                remaining: logoUsage.remaining,
            },
            disclaimer: "Revisa el logo antes de publicar.",
        };
    }
    const limit = lane === "full" ? quotaConf.full : quotaConf.lite;
    const usage = await assertAndIncrementQuota(accountId, lane, limit, isRoot);
    const system = buildSystemPrompt(language, String((_9 = context.vertical) !== null && _9 !== void 0 ? _9 : "generic"));
    const user = buildUserPrompt({
        action,
        tone,
        fieldPath,
        currentValue,
        brief,
        context,
    });
    let byokProvider = null;
    let apiKey = "";
    let baseUrl = "";
    let model = "";
    const byok = ((_10 = account.aiProvider) === null || _10 === void 0 ? void 0 : _10.mode) === "byok" && quotaConf.aiByok && isActiveStatus(account.status);
    if (lane === "full" && byok && ((_11 = account.aiProvider) === null || _11 === void 0 ? void 0 : _11.provider)) {
        byokProvider = (0, aiProviders_js_1.resolveFullProvider)(account.aiProvider.provider);
        apiKey = await loadByokApiKey(accountId, account);
        baseUrl = String((_12 = account.aiProvider.baseUrl) !== null && _12 !== void 0 ? _12 : "");
        model = String((_13 = account.aiProvider.model) !== null && _13 !== void 0 ? _13 : "");
    }
    const preferredForChain = byokProvider
        || (preferredEngine === "gemini" || preferredEngine === "groq" || preferredEngine === "ollama"
            || preferredEngine === "openai" || preferredEngine === "anthropic" || preferredEngine === "openai_compatible"
            ? preferredEngine
            : null)
        || (lane === "full" ? (0, aiProviders_js_1.resolveFullProvider)() : null);
    // Prefer chosen engine; on quota/rate-limit OR connectivity failure continue the chain.
    // Lite without an explicit engine still retries any provider failure (legacy behavior).
    const providerChain = (0, aiProviders_js_1.buildProviderFallbackChain)({
        preferred: preferredForChain,
        includeFullDefault: lane === "full" && !byokProvider,
    });
    const retryAnyFailure = !byokProvider || (lane === "lite" && !preferredEngine);
    let result = null;
    let usedProvider = providerChain[0] || "gemini";
    let usedModel = "";
    const failures = [];
    try {
        for (let index = 0; index < providerChain.length; index += 1) {
            const candidate = providerChain[index];
            const chatRequest = candidate === byokProvider
                ? { system, user, apiKey, baseUrl, model }
                : { system, user };
            try {
                const out = await (0, aiProviders_js_1.runProviderChat)(candidate, chatRequest);
                // Mock means the adapter could not reach a real model — keep walking the chain.
                if (out.provider === "mock" && index < providerChain.length - 1) {
                    failures.push(`${candidate}: respuesta mock (sin proveedor real)`);
                    console.warn("runAiAssist skipping mock result", { candidate, failures });
                    continue;
                }
                result = out.result;
                usedProvider = out.provider;
                usedModel = out.model || model || "";
                if (index > 0) {
                    console.warn("runAiAssist fell back after provider failure", {
                        usedProvider,
                        failures,
                    });
                }
                break;
            }
            catch (error) {
                const detail = sanitizeAiProviderMessage(error, "fallo sin detalle");
                failures.push(`${candidate}: ${detail}`);
                console.error("runAiAssist provider failure", { candidate, detail, error });
                const canRetry = index < providerChain.length - 1
                    && (retryAnyFailure
                        || (0, aiProviders_js_1.isQuotaOrRateLimitError)(error)
                        || (0, aiProviders_js_1.isProviderConnectivityError)(error));
                if (!canRetry) {
                    throw error;
                }
            }
        }
        if (!result || usedProvider === "mock") {
            throw new Error(failures.join(" | ") || "Ningún proveedor de IA respondió.");
        }
    }
    catch (error) {
        console.error("runAiAssist provider failure", error);
        throwAiProviderFailure(error, "Error al generar con IA. Revisa el proveedor configurado (API key, modelo, cuota).");
    }
    await (0, firestore_1.getFirestore)().collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId).set({
        aiUsageUpdatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }, { merge: true });
    return {
        ok: true,
        lane,
        action,
        provider: usedProvider,
        model: usedModel,
        result,
        usage: {
            period: currentPeriod(),
            lane,
            generations: usage.generations,
            limit: usage.limit,
            remaining: usage.remaining,
        },
        disclaimer: "Revisa el texto antes de publicar.",
    };
});
/** Agency+/root: store BYOK provider settings (api key in secrets/ only). */
exports.setAiProviderConfig = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const profile = await getCallerProfile(request.auth.uid);
    const isRoot = String((_b = profile.role) !== null && _b !== void 0 ? _b : "").trim().toLowerCase() === "root";
    const accountId = String((_e = (_d = (_c = request.data) === null || _c === void 0 ? void 0 : _c.accountId) !== null && _d !== void 0 ? _d : profile.accountId) !== null && _e !== void 0 ? _e : profile.uid).trim();
    if (!accountId) {
        throw new https_1.HttpsError("invalid-argument", "accountId es obligatorio.");
    }
    const accountRef = (0, firestore_1.getFirestore)().collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId);
    const accountSnap = await accountRef.get();
    if (!accountSnap.exists) {
        throw new https_1.HttpsError("not-found", "Cuenta de billing no encontrada.");
    }
    const account = (_f = accountSnap.data()) !== null && _f !== void 0 ? _f : {};
    const planId = normalizePlanId(account.plan);
    if (!isRoot && !PLAN_QUOTAS[planId].aiByok) {
        throw new https_1.HttpsError("permission-denied", "BYOK requiere plan Agency o Enterprise.");
    }
    if (!isRoot && String((_g = profile.accountId) !== null && _g !== void 0 ? _g : profile.uid) !== accountId) {
        throw new https_1.HttpsError("permission-denied", "No puedes editar otra cuenta.");
    }
    const mode = String((_j = (_h = request.data) === null || _h === void 0 ? void 0 : _h.mode) !== null && _j !== void 0 ? _j : "platform").trim().toLowerCase() === "byok"
        ? "byok"
        : "platform";
    const provider = (0, aiProviders_js_1.resolveFullProvider)((_k = request.data) === null || _k === void 0 ? void 0 : _k.provider);
    const model = String((_m = (_l = request.data) === null || _l === void 0 ? void 0 : _l.model) !== null && _m !== void 0 ? _m : "").trim();
    const baseUrl = String((_p = (_o = request.data) === null || _o === void 0 ? void 0 : _o.baseUrl) !== null && _p !== void 0 ? _p : "").trim();
    const apiKey = String((_r = (_q = request.data) === null || _q === void 0 ? void 0 : _q.apiKey) !== null && _r !== void 0 ? _r : "").trim();
    const clearKey = ((_s = request.data) === null || _s === void 0 ? void 0 : _s.clearKey) === true;
    const previous = (account.aiProvider && typeof account.aiProvider === "object")
        ? account.aiProvider
        : {};
    let apiKeyLast4 = String((_t = previous.apiKeyLast4) !== null && _t !== void 0 ? _t : "").trim();
    let hasKey = false;
    if (clearKey) {
        await saveByokApiKey(accountId, "");
        apiKeyLast4 = "";
        hasKey = false;
    }
    else if (apiKey) {
        await saveByokApiKey(accountId, apiKey);
        apiKeyLast4 = apiKey.slice(-4);
        hasKey = true;
    }
    else {
        const existing = await loadByokApiKey(accountId, account);
        hasKey = Boolean(existing);
        if (hasKey && !apiKeyLast4 && existing)
            apiKeyLast4 = existing.slice(-4);
    }
    const next = {
        mode,
        provider,
        model,
        baseUrl,
        updatedAt: new Date().toISOString(),
        apiKeyLast4,
        hasKey,
    };
    // Never persist raw apiKey on the client-readable billingAccounts document.
    await accountRef.set({
        aiProvider: Object.assign(Object.assign({}, next), { apiKey: firestore_1.FieldValue.delete() }),
        updatedAt: new Date().toISOString(),
    }, { merge: true });
    return {
        aiProvider: {
            mode: next.mode,
            provider: next.provider,
            model: next.model,
            baseUrl: next.baseUrl,
            apiKeyLast4,
            hasKey,
            updatedAt: next.updatedAt,
        },
    };
});
exports.getAiAssistUsage = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const profile = await getCallerProfile(request.auth.uid);
    const isRoot = String((_b = profile.role) !== null && _b !== void 0 ? _b : "").trim().toLowerCase() === "root";
    const accountId = String((_c = profile.accountId) !== null && _c !== void 0 ? _c : profile.uid).trim();
    const accountSnap = await (0, firestore_1.getFirestore)().collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId).get();
    const account = (_d = accountSnap.data()) !== null && _d !== void 0 ? _d : {};
    const lane = resolveLane(account, isRoot);
    const planId = normalizePlanId(account.plan);
    const limit = lane === "full" ? PLAN_QUOTAS[planId].full : PLAN_QUOTAS[planId].lite;
    const period = currentPeriod();
    const usageSnap = await (0, firestore_1.getFirestore)()
        .collection(BILLING_ACCOUNTS_COLLECTION)
        .doc(accountId)
        .collection(AI_USAGE_SUBCOLLECTION)
        .doc(`${period}-${lane}`)
        .get();
    const generations = Number((_f = (_e = usageSnap.data()) === null || _e === void 0 ? void 0 : _e.generations) !== null && _f !== void 0 ? _f : 0) || 0;
    const logoSnap = await (0, firestore_1.getFirestore)()
        .collection(BILLING_ACCOUNTS_COLLECTION)
        .doc(accountId)
        .collection(AI_USAGE_SUBCOLLECTION)
        .doc(`${period}-logo`)
        .get();
    const logoGenerations = Number((_h = (_g = logoSnap.data()) === null || _g === void 0 ? void 0 : _g.generations) !== null && _h !== void 0 ? _h : 0) || 0;
    const logoLimit = isRoot ? null : PLAN_QUOTAS[planId].logo;
    const aiProvider = account.aiProvider && typeof account.aiProvider === "object"
        ? account.aiProvider
        : {};
    return {
        lane,
        planId,
        period,
        generations,
        limit,
        remaining: limit == null ? null : Math.max(0, limit - generations),
        logo: {
            generations: logoGenerations,
            limit: logoLimit,
            remaining: logoLimit == null ? null : Math.max(0, logoLimit - logoGenerations),
        },
        aiProvider: {
            mode: aiProvider.mode || "platform",
            provider: aiProvider.provider || "",
            model: aiProvider.model || "",
            baseUrl: aiProvider.baseUrl || "",
            apiKeyLast4: aiProvider.apiKeyLast4 || "",
            hasKey: Boolean(aiProvider.hasKey) || Boolean(await loadByokApiKey(accountId, account)),
        },
    };
});
//# sourceMappingURL=aiAssist.js.map