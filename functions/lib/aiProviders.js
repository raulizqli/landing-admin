"use strict";
/**
 * Lightweight AI provider adapters (fetch-based, no extra npm SDKs).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockChatJson = mockChatJson;
exports.chatOllama = chatOllama;
exports.chatOpenAi = chatOpenAi;
exports.chatGroq = chatGroq;
exports.chatGemini = chatGemini;
exports.chatAnthropic = chatAnthropic;
exports.runProviderChat = runProviderChat;
exports.resolveModelForProvider = resolveModelForProvider;
exports.isQuotaOrRateLimitError = isQuotaOrRateLimitError;
exports.isProviderConnectivityError = isProviderConnectivityError;
exports.isLoopbackOllamaBaseUrl = isLoopbackOllamaBaseUrl;
exports.isOllamaReachableInThisRuntime = isOllamaReachableInThisRuntime;
exports.resolveLiteProviderChain = resolveLiteProviderChain;
exports.buildProviderFallbackChain = buildProviderFallbackChain;
exports.resolveFullProvider = resolveFullProvider;
exports.generateLogoImage = generateLogoImage;
function extractJsonObject(raw) {
    const text = String(raw !== null && raw !== void 0 ? raw : "").trim();
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1].trim() : text;
    try {
        return JSON.parse(candidate);
    }
    catch (_a) {
        const start = candidate.indexOf("{");
        const end = candidate.lastIndexOf("}");
        if (start >= 0 && end > start) {
            return JSON.parse(candidate.slice(start, end + 1));
        }
        return { text: candidate };
    }
}
/** Deterministic offline fallback when no provider keys are configured. */
function mockChatJson(request) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const current = ((_b = (_a = request.user.match(/Current text:\n([\s\S]*?)(?:\nBrief:|$)/)) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.trim())
        || ((_d = (_c = request.user.match(/Brief:\s*(.+)/)) === null || _c === void 0 ? void 0 : _c[1]) === null || _d === void 0 ? void 0 : _d.trim())
        || "";
    const tone = ((_e = /Tone:\s*(\w+)/i.exec(request.user)) === null || _e === void 0 ? void 0 : _e[1]) || "empathetic";
    let text = current || "Texto profesional, cercano y claro para tu landing.";
    if (tone === "shorter" || tone === "concise") {
        text = text.split(/[.!?]/).slice(0, 2).join(". ").trim();
        if (text && !/[.!?]$/.test(text))
            text = `${text}.`;
    }
    else if (tone === "formal") {
        text = text.replace(/\b(tú|tu)\b/gi, "usted").replace(/\bhola\b/gi, "Saludos");
    }
    else if (!current) {
        const name = (_g = (_f = /Brand\/name:\s*(.+)/i.exec(request.user)) === null || _f === void 0 ? void 0 : _f[1]) === null || _g === void 0 ? void 0 : _g.trim();
        const specialty = (_j = (_h = /Specialty:\s*(.+)/i.exec(request.user)) === null || _h === void 0 ? void 0 : _h[1]) === null || _j === void 0 ? void 0 : _j.trim();
        text = name && specialty
            ? `${name} ofrece acompañamiento profesional en ${specialty}, con un enfoque humano, claro y confidencial.`
            : text;
    }
    if (/Action:\s*hero_suggest/i.test(request.user)) {
        return {
            title: nameFrom(request.user) || "Acompañamiento profesional",
            text: text.slice(0, 180),
        };
    }
    if (/Action:\s*seo_meta/i.test(request.user)) {
        return {
            title: `${nameFrom(request.user) || "Profesional"} | ${specialtyFrom(request.user) || "Servicios"}`.slice(0, 60),
            description: text.slice(0, 155),
            text,
        };
    }
    if (/Action:\s*blog_draft/i.test(request.user)) {
        return {
            title: "Cómo cuidar tu bienestar día a día",
            excerpt: text.slice(0, 140),
            body: [text, "Si sientes que es momento de pedir ayuda, estamos aquí para acompañarte."],
            text,
        };
    }
    return { text, provider: "mock" };
}
function nameFrom(user) {
    var _a, _b;
    return ((_b = (_a = /Brand\/name:\s*(.+)/i.exec(user)) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.trim()) || "";
}
function specialtyFrom(user) {
    var _a, _b;
    return ((_b = (_a = /Specialty:\s*(.+)/i.exec(user)) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.trim()) || "";
}
async function chatOpenAiCompatible(request, defaultBase, defaultModel) {
    var _a, _b, _c;
    const base = (request.baseUrl || defaultBase).replace(/\/$/, "");
    const model = request.model || defaultModel;
    const apiKey = request.apiKey || "";
    if (!apiKey && !base.includes("11434") && !base.includes("ollama")) {
        return mockChatJson(request);
    }
    const response = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, (apiKey ? { Authorization: `Bearer ${apiKey}` } : {})),
        body: JSON.stringify({
            model,
            temperature: 0.6,
            messages: [
                { role: "system", content: request.system },
                { role: "user", content: request.user },
            ],
            response_format: { type: "json_object" },
        }),
    });
    const raw = await response.text();
    if (!response.ok) {
        throw new Error(`Proveedor OpenAI-compatible (${model}) respondió ${response.status}: ${raw.slice(0, 220) || "sin detalle"}`);
    }
    const data = JSON.parse(raw);
    const content = ((_c = (_b = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || "{}";
    return extractJsonObject(content);
}
async function chatOllama(request) {
    var _a;
    const base = (request.baseUrl || process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
    const model = request.model
        || process.env.AI_OLLAMA_MODEL
        || process.env.AI_LITE_MODEL
        || "llama3.2";
    try {
        const response = await fetch(`${base}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                stream: false,
                format: "json",
                messages: [
                    { role: "system", content: request.system },
                    { role: "user", content: request.user },
                ],
            }),
        });
        const raw = await response.text();
        if (!response.ok) {
            throw new Error(`Ollama (${model} @ ${base}) respondió ${response.status}: ${raw.slice(0, 220) || "sin detalle"}`);
        }
        const data = JSON.parse(raw);
        return extractJsonObject(((_a = data.message) === null || _a === void 0 ? void 0 : _a.content) || "{}");
    }
    catch (error) {
        // Only mock in emulator/offline. In prod Cloud Functions, localhost Ollama is unreachable —
        // swallowing the error as mock skips Gemini/Groq in the fallback chain.
        const allowMock = process.env.FUNCTIONS_EMULATOR === "true"
            || process.env.AI_ALLOW_MOCK === "1"
            || process.env.AI_ALLOW_MOCK === "true";
        if (allowMock) {
            console.warn("Ollama unavailable, using mock:", error);
            return mockChatJson(request);
        }
        throw error instanceof Error
            ? error
            : new Error(`Ollama no disponible (${base}): ${String(error)}`);
    }
}
async function chatOpenAi(request) {
    return chatOpenAiCompatible(Object.assign(Object.assign({}, request), { apiKey: request.apiKey || process.env.OPENAI_API_KEY, baseUrl: request.baseUrl || "https://api.openai.com/v1", model: request.model || process.env.AI_MODEL || "gpt-4o-mini" }), "https://api.openai.com/v1", process.env.AI_MODEL || "gpt-4o-mini");
}
async function chatGroq(request) {
    return chatOpenAiCompatible(Object.assign(Object.assign({}, request), { apiKey: request.apiKey || process.env.GROQ_API_KEY, baseUrl: request.baseUrl || "https://api.groq.com/openai/v1", model: request.model || "llama-3.3-70b-versatile" }), "https://api.groq.com/openai/v1", "llama-3.3-70b-versatile");
}
function looksLikeGeminiModel(model) {
    const id = String(model !== null && model !== void 0 ? model : "").trim().toLowerCase();
    return id.startsWith("gemini") || id.startsWith("models/gemini");
}
function resolveGeminiModel(request) {
    var _a;
    const fromRequest = String((_a = request.model) !== null && _a !== void 0 ? _a : "").trim();
    if (fromRequest && looksLikeGeminiModel(fromRequest)) {
        return fromRequest.replace(/^models\//i, "");
    }
    const fromEnv = String(process.env.GEMINI_MODEL || process.env.AI_GEMINI_MODEL || "").trim();
    if (fromEnv) {
        return fromEnv.replace(/^models\//i, "");
    }
    // Never reuse AI_LITE_MODEL here — that is often an Ollama tag (llama3.2).
    return "gemini-2.0-flash";
}
async function chatGemini(request) {
    var _a, _b, _c, _d, _e;
    const apiKey = request.apiKey || process.env.GEMINI_API_KEY || "";
    const model = resolveGeminiModel(request);
    if (!apiKey)
        return mockChatJson(request);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: `${request.system}\n\n${request.user}` }] }],
            generationConfig: { temperature: 0.6, responseMimeType: "application/json" },
        }),
    });
    const raw = await response.text();
    if (!response.ok) {
        throw new Error(`Gemini (${model}) respondió ${response.status}: ${raw.slice(0, 220) || "sin detalle"}`);
    }
    const data = JSON.parse(raw);
    const content = ((_e = (_d = (_c = (_b = (_a = data.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) || "{}";
    return extractJsonObject(content);
}
async function chatAnthropic(request) {
    var _a;
    const apiKey = request.apiKey || process.env.ANTHROPIC_API_KEY || "";
    const model = request.model || "claude-3-5-haiku-latest";
    if (!apiKey)
        return mockChatJson(request);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model,
            max_tokens: 1024,
            system: request.system,
            messages: [{ role: "user", content: request.user }],
        }),
    });
    const raw = await response.text();
    if (!response.ok) {
        throw new Error(`Anthropic (${model}) respondió ${response.status}: ${raw.slice(0, 220) || "sin detalle"}`);
    }
    const data = JSON.parse(raw);
    const content = ((_a = data.content) === null || _a === void 0 ? void 0 : _a.map((part) => part.text || "").join("\n")) || "{}";
    return extractJsonObject(content);
}
async function runProviderChat(provider, request) {
    const model = resolveModelForProvider(provider, request);
    let result;
    switch (provider) {
        case "ollama":
            result = await chatOllama(Object.assign(Object.assign({}, request), { model }));
            break;
        case "gemini":
            result = await chatGemini(Object.assign(Object.assign({}, request), { model }));
            break;
        case "groq":
            result = await chatGroq(Object.assign(Object.assign({}, request), { model }));
            break;
        case "anthropic":
            result = await chatAnthropic(Object.assign(Object.assign({}, request), { model }));
            break;
        case "openai_compatible":
            result = await chatOpenAiCompatible(Object.assign(Object.assign({}, request), { model }), request.baseUrl || "https://api.openai.com/v1", model);
            break;
        case "openai":
        default:
            result = await chatOpenAi(Object.assign(Object.assign({}, request), { model }));
            break;
    }
    const usedMock = result.provider === "mock";
    return { result, provider: usedMock ? "mock" : provider, model };
}
/** Default model id for a provider (for UI / telemetry). */
function resolveModelForProvider(provider, request = {}) {
    var _a;
    const fromRequest = String((_a = request.model) !== null && _a !== void 0 ? _a : "").trim();
    if (fromRequest)
        return fromRequest;
    switch (provider) {
        case "ollama":
            return process.env.AI_OLLAMA_MODEL
                || process.env.AI_LITE_MODEL
                || "llama3.2";
        case "gemini":
            return resolveGeminiModel(request);
        case "groq":
            return "llama-3.3-70b-versatile";
        case "anthropic":
            return "claude-3-5-haiku-latest";
        case "openai_compatible":
            return process.env.AI_MODEL || "gpt-4o-mini";
        case "openai":
        default:
            return process.env.AI_MODEL || "gpt-4o-mini";
    }
}
function tryAsProviderId(value) {
    const id = String(value !== null && value !== void 0 ? value : "").trim().toLowerCase();
    if (id === "ollama"
        || id === "openai"
        || id === "gemini"
        || id === "groq"
        || id === "anthropic"
        || id === "openai_compatible") {
        return id;
    }
    return null;
}
function asProviderId(value, fallback) {
    return tryAsProviderId(value) || fallback;
}
/** True when the provider rejected the call due to rate limits / billing quota. */
function isQuotaOrRateLimitError(error) {
    const msg = error instanceof Error
        ? error.message
        : typeof error === "string"
            ? error
            : String(error !== null && error !== void 0 ? error : "");
    return /429|rate.?limit|quota|resource.?exhausted|exceeded.?your.?current.?quota|too many requests|billing.?hard.?limit/i
        .test(msg);
}
/** True when the runtime could not reach the provider (typical for localhost Ollama from Cloud Functions). */
function isProviderConnectivityError(error) {
    const msg = error instanceof Error
        ? error.message
        : typeof error === "string"
            ? error
            : String(error !== null && error !== void 0 ? error : "");
    return /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNRESET|fetch failed|network|socket|UND_ERR|other side closed/i
        .test(msg);
}
/** True when Ollama is pointed at a loopback host unreachable from Cloud Functions. */
function isLoopbackOllamaBaseUrl(baseUrl) {
    const raw = String(baseUrl
        || process.env.OLLAMA_BASE_URL
        || "http://127.0.0.1:11434").trim();
    try {
        const host = new URL(raw).hostname.toLowerCase();
        return host === "127.0.0.1" || host === "localhost" || host === "::1";
    }
    catch (_a) {
        return /127\.0\.0\.1|localhost/i.test(raw);
    }
}
function isOllamaReachableInThisRuntime(baseUrl) {
    if (process.env.FUNCTIONS_EMULATOR === "true")
        return true;
    if (process.env.AI_ALLOW_LOCAL_OLLAMA === "1" || process.env.AI_ALLOW_LOCAL_OLLAMA === "true") {
        return true;
    }
    return !isLoopbackOllamaBaseUrl(baseUrl);
}
function resolveLiteProviderChain() {
    const primary = asProviderId(process.env.AI_LITE_PROVIDER || "ollama", "ollama");
    const fallback = asProviderId(process.env.AI_LITE_FALLBACK_PROVIDER || "gemini", "gemini");
    const chain = [];
    for (const id of [primary, fallback, "groq", "ollama"]) {
        if (id === "ollama" && !isOllamaReachableInThisRuntime())
            continue;
        if (!chain.includes(id))
            chain.push(id);
    }
    // Always keep at least one cloud-capable candidate.
    if (chain.length === 0)
        chain.push("gemini");
    return chain;
}
/**
 * Ordered providers for assist calls: preferred first, then Gemini (configured
 * fallback), then the rest of the lite chain. Keeps remote Gemini ahead of
 * localhost Ollama so Cloud Functions quota fallbacks actually work.
 */
function buildProviderFallbackChain(options = {}) {
    var _a;
    const chain = [];
    const push = (id) => {
        if (!chain.includes(id))
            chain.push(id);
    };
    const preferred = tryAsProviderId(String((_a = options.preferred) !== null && _a !== void 0 ? _a : ""));
    if (preferred) {
        if (preferred !== "ollama" || isOllamaReachableInThisRuntime()) {
            push(preferred);
        }
    }
    if (options.includeFullDefault) {
        const full = resolveFullProvider();
        if (full !== "ollama" || isOllamaReachableInThisRuntime()) {
            push(full);
        }
    }
    const configuredFallback = asProviderId(process.env.AI_LITE_FALLBACK_PROVIDER || "gemini", "gemini");
    push(configuredFallback);
    for (const id of resolveLiteProviderChain()) {
        push(id);
    }
    return chain;
}
function resolveFullProvider(preferred) {
    const value = String(preferred || process.env.AI_PROVIDER || "openai").trim().toLowerCase();
    if (value === "ollama"
        || value === "gemini"
        || value === "groq"
        || value === "anthropic"
        || value === "openai_compatible") {
        return value;
    }
    return "openai";
}
function mockLogoDataUrl(name, specialty) {
    const label = (name || specialty || "LS").trim().slice(0, 24) || "LS";
    const initials = label
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => { var _a; return ((_a = part[0]) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || ""; })
        .join("") || "LS";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#4A5D4E"/>
  <text x="256" y="278" text-anchor="middle" font-family="Georgia, serif" font-size="160" fill="#F4F1EA">${initials}</text>
</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
function parseLogoImageFallbackChain(raw) {
    var _a;
    const text = String((_a = raw !== null && raw !== void 0 ? raw : process.env.AI_IMAGE_FALLBACK_CHAIN) !== null && _a !== void 0 ? _a : "openai,gemini,mock").trim();
    const parsed = text
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
    const allowed = new Set(["openai", "mock", "gemini"]);
    const chain = parsed.filter((item) => allowed.has(item));
    return chain.length ? chain : ["openai", "gemini", "mock"];
}
function buildLogoPrompt(input) {
    var _a, _b, _c, _d;
    const name = String((_a = input.name) !== null && _a !== void 0 ? _a : "").trim();
    const specialty = String((_b = input.specialty) !== null && _b !== void 0 ? _b : "").trim();
    const vertical = String((_c = input.vertical) !== null && _c !== void 0 ? _c : "generic").trim();
    const brief = String((_d = input.brief) !== null && _d !== void 0 ? _d : "").trim();
    const language = input.language === "en" ? "English" : "Spanish";
    return [
        `Minimal professional logo mark for a ${vertical || "services"} brand.`,
        name ? `Brand name: ${name}.` : "",
        specialty ? `Specialty: ${specialty}.` : "",
        brief ? `Brief: ${brief}.` : "",
        "Flat vector style, centered icon, cream (#F4F1EA) and sage green (#4A5D4E), no text clutter, no watermark, square composition.",
        `Design notes may be in ${language}.`,
    ].filter(Boolean).join(" ");
}
/** GPT Image models always return base64 and reject `response_format`. */
function isGptImageModel(model = "") {
    return /^gpt-image/i.test(String(model).trim());
}
function buildOpenAiImageGenerationBody(model, prompt) {
    const body = {
        model,
        prompt: prompt.slice(0, 3500),
        n: 1,
        size: "1024x1024",
    };
    if (!isGptImageModel(model)) {
        body.response_format = "url";
    }
    return body;
}
function logoResultFromOpenAiPayload(payload, prompt) {
    var _a;
    const first = (_a = payload === null || payload === void 0 ? void 0 : payload.data) === null || _a === void 0 ? void 0 : _a[0];
    if (first === null || first === void 0 ? void 0 : first.url) {
        return { imageUrl: first.url, provider: "openai", prompt };
    }
    if (first === null || first === void 0 ? void 0 : first.b64_json) {
        return {
            imageUrl: `data:image/png;base64,${first.b64_json}`,
            provider: "openai",
            prompt,
        };
    }
    return null;
}
async function generateLogoWithOpenAi(apiKey, prompt) {
    const imageModel = process.env.OPENAI_IMAGE_MODEL || "dall-e-3";
    const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(buildOpenAiImageGenerationBody(imageModel, prompt)),
    });
    if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`OpenAI images error ${response.status}: ${detail.slice(0, 200)}`);
    }
    const payload = await response.json();
    const result = logoResultFromOpenAiPayload(payload, prompt);
    if (!result) {
        throw new Error("OpenAI images returned no image data.");
    }
    return result;
}
function generateLogoWithMock(name, specialty, prompt) {
    return {
        imageUrl: mockLogoDataUrl(name, specialty),
        provider: "mock",
        prompt,
    };
}
function extractGeminiInlineImage(payload) {
    var _a, _b, _c, _d;
    const parts = ((_c = (_b = (_a = payload.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) || [];
    for (const part of parts) {
        if (part.thought === true)
            continue;
        const inline = part.inlineData || part.inline_data;
        const data = String((_d = inline === null || inline === void 0 ? void 0 : inline.data) !== null && _d !== void 0 ? _d : "").trim();
        if (!data)
            continue;
        const mimeType = (inline && "mimeType" in inline && inline.mimeType)
            || (inline && "mime_type" in inline && inline.mime_type)
            || "image/png";
        return `data:${mimeType};base64,${data}`;
    }
    return null;
}
async function generateLogoWithGeminiImagen(apiKey, model, prompt) {
    var _a, _b, _c;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:predict?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            instances: [{ prompt: prompt.slice(0, 480) }],
            parameters: {
                sampleCount: 1,
                aspectRatio: "1:1",
            },
        }),
    });
    const raw = await response.text();
    if (!response.ok) {
        throw new Error(`Gemini Imagen (${model}) respondió ${response.status}: ${raw.slice(0, 200)}`);
    }
    const payload = JSON.parse(raw);
    const first = (_a = payload.predictions) === null || _a === void 0 ? void 0 : _a[0];
    const encoded = (first === null || first === void 0 ? void 0 : first.bytesBase64Encoded)
        || ((_b = first === null || first === void 0 ? void 0 : first.image) === null || _b === void 0 ? void 0 : _b.bytesBase64Encoded)
        || "";
    if (!encoded) {
        throw new Error(`Gemini Imagen (${model}) returned no image data.`);
    }
    const mimeType = (first === null || first === void 0 ? void 0 : first.mimeType) || ((_c = first === null || first === void 0 ? void 0 : first.image) === null || _c === void 0 ? void 0 : _c.mimeType) || "image/png";
    return {
        imageUrl: `data:${mimeType};base64,${encoded}`,
        provider: "gemini",
        prompt,
    };
}
async function generateLogoWithGeminiNative(apiKey, model, prompt) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt.slice(0, 3500) }] }],
            generationConfig: {
                responseModalities: ["IMAGE"],
            },
        }),
    });
    const raw = await response.text();
    if (!response.ok) {
        throw new Error(`Gemini image (${model}) respondió ${response.status}: ${raw.slice(0, 200)}`);
    }
    const payload = JSON.parse(raw);
    const imageUrl = extractGeminiInlineImage(payload);
    if (!imageUrl) {
        throw new Error(`Gemini image (${model}) returned no image data.`);
    }
    return { imageUrl, provider: "gemini", prompt };
}
async function generateLogoWithGemini(prompt) {
    const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured.");
    }
    const model = String(process.env.GEMINI_IMAGE_MODEL || "imagen-4.0-generate-001").trim();
    if (/^imagen-/i.test(model)) {
        return generateLogoWithGeminiImagen(apiKey, model, prompt);
    }
    return generateLogoWithGeminiNative(apiKey, model, prompt);
}
/**
 * Generate a simple brand mark / logo image.
 * Fallback chain defaults to OpenAI → Gemini Imagen → mock SVG.
 */
async function generateLogoImage(input) {
    var _a, _b;
    const name = String((_a = input.name) !== null && _a !== void 0 ? _a : "").trim();
    const specialty = String((_b = input.specialty) !== null && _b !== void 0 ? _b : "").trim();
    const prompt = buildLogoPrompt({
        name,
        specialty,
        vertical: input.vertical,
        brief: input.brief,
        language: input.language,
    });
    const openaiKey = String(input.apiKey || process.env.OPENAI_API_KEY || "").trim();
    const chain = parseLogoImageFallbackChain();
    const errors = [];
    for (const step of chain) {
        try {
            if (step === "openai") {
                if (!openaiKey)
                    continue;
                return await generateLogoWithOpenAi(openaiKey, prompt);
            }
            if (step === "mock") {
                if (process.env.AI_IMAGE_SKIP_MOCK === "true")
                    continue;
                return generateLogoWithMock(name, specialty, prompt);
            }
            if (step === "gemini") {
                return await generateLogoWithGemini(prompt);
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            errors.push(`${step}: ${message}`);
        }
    }
    if (errors.length) {
        throw new Error(errors.join(" | "));
    }
    return generateLogoWithMock(name, specialty, prompt);
}
//# sourceMappingURL=aiProviders.js.map