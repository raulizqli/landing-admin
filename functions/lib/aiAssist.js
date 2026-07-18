"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAiAssistUsage = exports.setAiProviderConfig = exports.runAiAssist = void 0;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const aiProviders_js_1 = require("./aiProviders.js");
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
const USERS_COLLECTION = "users";
const BILLING_ACCOUNTS_COLLECTION = "billingAccounts";
const AI_USAGE_SUBCOLLECTION = "aiUsage";
const LITE_ACTIONS = new Set(["rewrite_field", "polish_bio", "polish_tagline", "hero_suggest"]);
const FULL_ACTIONS = new Set([
    ...LITE_ACTIONS,
    "service_blurb",
    "seo_meta",
    "blog_draft",
]);
const PLAN_QUOTAS = {
    starter: { lite: 30, full: 0, aiAssist: false, aiByok: false },
    pro: { lite: 30, full: 50, aiAssist: true, aiByok: false },
    agency: { lite: 30, full: 200, aiAssist: true, aiByok: true },
    enterprise: { lite: 30, full: null, aiAssist: true, aiByok: true },
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
            throw new https_1.HttpsError("resource-exhausted", `Cuota de IA ${lane} agotada (${limit}/mes). Mejora tu plan o espera al próximo periodo.`);
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
exports.runAiAssist = (0, https_1.onCall)({ timeoutSeconds: 120 }, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10;
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
    const limit = lane === "full" ? quotaConf.full : quotaConf.lite;
    const usage = await assertAndIncrementQuota(accountId, lane, limit, isRoot);
    const system = buildSystemPrompt(language, String((_5 = context.vertical) !== null && _5 !== void 0 ? _5 : "generic"));
    const user = buildUserPrompt({
        action,
        tone,
        fieldPath,
        currentValue,
        brief,
        context,
    });
    let provider = "ollama";
    let apiKey = "";
    let baseUrl = "";
    let model = "";
    const byok = ((_6 = account.aiProvider) === null || _6 === void 0 ? void 0 : _6.mode) === "byok" && quotaConf.aiByok && isActiveStatus(account.status);
    if (lane === "full" && byok && ((_7 = account.aiProvider) === null || _7 === void 0 ? void 0 : _7.provider)) {
        provider = (0, aiProviders_js_1.resolveFullProvider)(account.aiProvider.provider);
        apiKey = String((_8 = account.aiProvider.apiKey) !== null && _8 !== void 0 ? _8 : "");
        baseUrl = String((_9 = account.aiProvider.baseUrl) !== null && _9 !== void 0 ? _9 : "");
        model = String((_10 = account.aiProvider.model) !== null && _10 !== void 0 ? _10 : "");
    }
    else if (lane === "full") {
        provider = (0, aiProviders_js_1.resolveFullProvider)();
    }
    else if (preferredEngine === "gemini" || preferredEngine === "groq" || preferredEngine === "ollama") {
        provider = preferredEngine;
    }
    else {
        provider = (0, aiProviders_js_1.resolveLiteProviderChain)()[0];
    }
    const chatRequest = { system, user, apiKey, baseUrl, model };
    let result = null;
    let usedProvider = provider;
    try {
        if (lane === "lite" && !preferredEngine) {
            let lastError = null;
            for (const candidate of (0, aiProviders_js_1.resolveLiteProviderChain)()) {
                try {
                    const out = await (0, aiProviders_js_1.runProviderChat)(candidate, chatRequest);
                    result = out.result;
                    usedProvider = out.provider;
                    lastError = null;
                    break;
                }
                catch (error) {
                    lastError = error;
                }
            }
            if (!result) {
                throw lastError instanceof Error ? lastError : new Error("No AI lite provider available.");
            }
        }
        else {
            const out = await (0, aiProviders_js_1.runProviderChat)(provider, chatRequest);
            result = out.result;
            usedProvider = out.provider;
        }
    }
    catch (error) {
        console.error("runAiAssist provider failure", error);
        throw new https_1.HttpsError("internal", error instanceof Error ? error.message.slice(0, 240) : "Error al generar con IA.");
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
/** Agency+/root: store BYOK provider settings (api key server-side only). */
exports.setAiProviderConfig = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
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
    const next = {
        mode,
        provider,
        model,
        baseUrl,
        updatedAt: new Date().toISOString(),
        apiKeyLast4: previous.apiKeyLast4 || "",
    };
    if (clearKey) {
        next.apiKey = "";
        next.apiKeyLast4 = "";
    }
    else if (apiKey) {
        next.apiKey = apiKey;
        next.apiKeyLast4 = apiKey.slice(-4);
    }
    else if (previous.apiKey) {
        next.apiKey = previous.apiKey;
        next.apiKeyLast4 = previous.apiKeyLast4 || "";
    }
    await accountRef.set({ aiProvider: next, updatedAt: new Date().toISOString() }, { merge: true });
    return {
        aiProvider: {
            mode: next.mode,
            provider: next.provider,
            model: next.model,
            baseUrl: next.baseUrl,
            apiKeyLast4: next.apiKeyLast4,
            hasKey: Boolean(next.apiKey),
            updatedAt: next.updatedAt,
        },
    };
});
exports.getAiAssistUsage = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d, _e, _f;
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
        aiProvider: {
            mode: aiProvider.mode || "platform",
            provider: aiProvider.provider || "",
            model: aiProvider.model || "",
            baseUrl: aiProvider.baseUrl || "",
            apiKeyLast4: aiProvider.apiKeyLast4 || "",
            hasKey: Boolean(aiProvider.apiKey),
        },
    };
});
//# sourceMappingURL=aiAssist.js.map