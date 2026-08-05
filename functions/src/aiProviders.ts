/**
 * Lightweight AI provider adapters (fetch-based, no extra npm SDKs).
 */

export type AiProviderId = "ollama" | "openai" | "gemini" | "groq" | "anthropic" | "openai_compatible";

export interface ChatJsonRequest {
  system: string;
  user: string;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

function extractJsonObject(raw: string): Record<string, unknown> {
  const text = String(raw ?? "").trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : text;
  try {
    return JSON.parse(candidate) as Record<string, unknown>;
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
    }
    return { text: candidate };
  }
}

/** Deterministic offline fallback when no provider keys are configured. */
export function mockChatJson(request: ChatJsonRequest): Record<string, unknown> {
  const current = request.user.match(/Current text:\n([\s\S]*?)(?:\nBrief:|$)/)?.[1]?.trim()
    || request.user.match(/Brief:\s*(.+)/)?.[1]?.trim()
    || "";
  const tone = /Tone:\s*(\w+)/i.exec(request.user)?.[1] || "empathetic";
  let text = current || "Texto profesional, cercano y claro para tu landing.";
  if (tone === "shorter" || tone === "concise") {
    text = text.split(/[.!?]/).slice(0, 2).join(". ").trim();
    if (text && !/[.!?]$/.test(text)) text = `${text}.`;
  } else if (tone === "formal") {
    text = text.replace(/\b(tú|tu)\b/gi, "usted").replace(/\bhola\b/gi, "Saludos");
  } else if (!current) {
    const name = /Brand\/name:\s*(.+)/i.exec(request.user)?.[1]?.trim();
    const specialty = /Specialty:\s*(.+)/i.exec(request.user)?.[1]?.trim();
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

function nameFrom(user: string) {
  return /Brand\/name:\s*(.+)/i.exec(user)?.[1]?.trim() || "";
}
function specialtyFrom(user: string) {
  return /Specialty:\s*(.+)/i.exec(user)?.[1]?.trim() || "";
}

async function chatOpenAiCompatible(
  request: ChatJsonRequest,
  defaultBase: string,
  defaultModel: string,
): Promise<Record<string, unknown>> {
  const base = (request.baseUrl || defaultBase).replace(/\/$/, "");
  const model = request.model || defaultModel;
  const apiKey = request.apiKey || "";
  if (!apiKey && !base.includes("11434") && !base.includes("ollama")) {
    return mockChatJson(request);
  }

  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
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
    throw new Error(
      `Proveedor OpenAI-compatible (${model}) respondió ${response.status}: ${raw.slice(0, 220) || "sin detalle"}`,
    );
  }
  const data = JSON.parse(raw) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content || "{}";
  return extractJsonObject(content);
}

export async function chatOllama(request: ChatJsonRequest): Promise<Record<string, unknown>> {
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
      throw new Error(
        `Ollama (${model} @ ${base}) respondió ${response.status}: ${raw.slice(0, 220) || "sin detalle"}`,
      );
    }
    const data = JSON.parse(raw) as { message?: { content?: string } };
    return extractJsonObject(data.message?.content || "{}");
  } catch (error) {
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

export async function chatOpenAi(request: ChatJsonRequest): Promise<Record<string, unknown>> {
  return chatOpenAiCompatible(
    {
      ...request,
      apiKey: request.apiKey || process.env.OPENAI_API_KEY,
      baseUrl: request.baseUrl || "https://api.openai.com/v1",
      model: request.model || process.env.AI_MODEL || "gpt-4o-mini",
    },
    "https://api.openai.com/v1",
    process.env.AI_MODEL || "gpt-4o-mini",
  );
}

export async function chatGroq(request: ChatJsonRequest): Promise<Record<string, unknown>> {
  return chatOpenAiCompatible(
    {
      ...request,
      apiKey: request.apiKey || process.env.GROQ_API_KEY,
      baseUrl: request.baseUrl || "https://api.groq.com/openai/v1",
      model: request.model || "llama-3.3-70b-versatile",
    },
    "https://api.groq.com/openai/v1",
    "llama-3.3-70b-versatile",
  );
}

function looksLikeGeminiModel(model: string): boolean {
  const id = String(model ?? "").trim().toLowerCase();
  return id.startsWith("gemini") || id.startsWith("models/gemini");
}

function resolveGeminiModel(request: ChatJsonRequest): string {
  const fromRequest = String(request.model ?? "").trim();
  if (fromRequest && looksLikeGeminiModel(fromRequest)) {
    return fromRequest.replace(/^models\//i, "");
  }
  const fromEnv = String(
    process.env.GEMINI_MODEL || process.env.AI_GEMINI_MODEL || "",
  ).trim();
  if (fromEnv) {
    return fromEnv.replace(/^models\//i, "");
  }
  // Never reuse AI_LITE_MODEL here — that is often an Ollama tag (llama3.2).
  return "gemini-2.0-flash";
}

export async function chatGemini(request: ChatJsonRequest): Promise<Record<string, unknown>> {
  const apiKey = request.apiKey || process.env.GEMINI_API_KEY || "";
  const model = resolveGeminiModel(request);
  if (!apiKey) return mockChatJson(request);

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
    throw new Error(
      `Gemini (${model}) respondió ${response.status}: ${raw.slice(0, 220) || "sin detalle"}`,
    );
  }
  const data = JSON.parse(raw) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return extractJsonObject(content);
}

export async function chatAnthropic(request: ChatJsonRequest): Promise<Record<string, unknown>> {
  const apiKey = request.apiKey || process.env.ANTHROPIC_API_KEY || "";
  const model = request.model || "claude-3-5-haiku-latest";
  if (!apiKey) return mockChatJson(request);

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
    throw new Error(
      `Anthropic (${model}) respondió ${response.status}: ${raw.slice(0, 220) || "sin detalle"}`,
    );
  }
  const data = JSON.parse(raw) as { content?: Array<{ text?: string }> };
  const content = data.content?.map((part) => part.text || "").join("\n") || "{}";
  return extractJsonObject(content);
}

export async function runProviderChat(
  provider: AiProviderId,
  request: ChatJsonRequest,
): Promise<{ result: Record<string, unknown>; provider: AiProviderId | "mock"; model: string }> {
  const model = resolveModelForProvider(provider, request);
  let result: Record<string, unknown>;
  switch (provider) {
    case "ollama":
      result = await chatOllama({ ...request, model });
      break;
    case "gemini":
      result = await chatGemini({ ...request, model });
      break;
    case "groq":
      result = await chatGroq({ ...request, model });
      break;
    case "anthropic":
      result = await chatAnthropic({ ...request, model });
      break;
    case "openai_compatible":
      result = await chatOpenAiCompatible(
        { ...request, model },
        request.baseUrl || "https://api.openai.com/v1",
        model,
      );
      break;
    case "openai":
    default:
      result = await chatOpenAi({ ...request, model });
      break;
  }
  const usedMock = result.provider === "mock";
  return { result, provider: usedMock ? "mock" : provider, model };
}

/** Default model id for a provider (for UI / telemetry). */
export function resolveModelForProvider(
  provider: AiProviderId,
  request: Pick<ChatJsonRequest, "model"> & Partial<ChatJsonRequest> = {},
): string {
  const fromRequest = String(request.model ?? "").trim();
  if (fromRequest) return fromRequest;
  switch (provider) {
    case "ollama":
      return process.env.AI_OLLAMA_MODEL
        || process.env.AI_LITE_MODEL
        || "llama3.2";
    case "gemini":
      return resolveGeminiModel(request as ChatJsonRequest);
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

function tryAsProviderId(value: string): AiProviderId | null {
  const id = String(value ?? "").trim().toLowerCase();
  if (
    id === "ollama"
    || id === "openai"
    || id === "gemini"
    || id === "groq"
    || id === "anthropic"
    || id === "openai_compatible"
  ) {
    return id;
  }
  return null;
}

function asProviderId(value: string, fallback: AiProviderId): AiProviderId {
  return tryAsProviderId(value) || fallback;
}

/** True when the provider rejected the call due to rate limits / billing quota. */
export function isQuotaOrRateLimitError(error: unknown): boolean {
  const msg = error instanceof Error
    ? error.message
    : typeof error === "string"
      ? error
      : String(error ?? "");
  return /429|rate.?limit|quota|resource.?exhausted|exceeded.?your.?current.?quota|too many requests|billing.?hard.?limit/i
    .test(msg);
}

/** True when the runtime could not reach the provider (typical for localhost Ollama from Cloud Functions). */
export function isProviderConnectivityError(error: unknown): boolean {
  const msg = error instanceof Error
    ? error.message
    : typeof error === "string"
      ? error
      : String(error ?? "");
  return /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNRESET|fetch failed|network|socket|UND_ERR|other side closed/i
    .test(msg);
}

/** True when Ollama is pointed at a loopback host unreachable from Cloud Functions. */
export function isLoopbackOllamaBaseUrl(baseUrl?: string): boolean {
  const raw = String(
    baseUrl
    || process.env.OLLAMA_BASE_URL
    || "http://127.0.0.1:11434",
  ).trim();
  try {
    const host = new URL(raw).hostname.toLowerCase();
    return host === "127.0.0.1" || host === "localhost" || host === "::1";
  } catch {
    return /127\.0\.0\.1|localhost/i.test(raw);
  }
}

export function isOllamaReachableInThisRuntime(baseUrl?: string): boolean {
  if (process.env.FUNCTIONS_EMULATOR === "true") return true;
  if (process.env.AI_ALLOW_LOCAL_OLLAMA === "1" || process.env.AI_ALLOW_LOCAL_OLLAMA === "true") {
    return true;
  }
  return !isLoopbackOllamaBaseUrl(baseUrl);
}

export function resolveLiteProviderChain(): AiProviderId[] {
  const primary = asProviderId(process.env.AI_LITE_PROVIDER || "ollama", "ollama");
  const fallback = asProviderId(process.env.AI_LITE_FALLBACK_PROVIDER || "gemini", "gemini");
  const chain: AiProviderId[] = [];
  for (const id of [primary, fallback, "groq" as const, "ollama" as const]) {
    if (id === "ollama" && !isOllamaReachableInThisRuntime()) continue;
    if (!chain.includes(id)) chain.push(id);
  }
  // Always keep at least one cloud-capable candidate.
  if (chain.length === 0) chain.push("gemini");
  return chain;
}

/**
 * Ordered providers for assist calls: preferred first, then Gemini (configured
 * fallback), then the rest of the lite chain. Keeps remote Gemini ahead of
 * localhost Ollama so Cloud Functions quota fallbacks actually work.
 */
export function buildProviderFallbackChain(options: {
  preferred?: string | null;
  includeFullDefault?: boolean;
} = {}): AiProviderId[] {
  const chain: AiProviderId[] = [];
  const push = (id: AiProviderId) => {
    if (!chain.includes(id)) chain.push(id);
  };

  const preferred = tryAsProviderId(String(options.preferred ?? ""));
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

  const configuredFallback = asProviderId(
    process.env.AI_LITE_FALLBACK_PROVIDER || "gemini",
    "gemini",
  );
  push(configuredFallback);

  for (const id of resolveLiteProviderChain()) {
    push(id);
  }
  return chain;
}

export function resolveFullProvider(preferred?: string): AiProviderId {
  const value = String(preferred || process.env.AI_PROVIDER || "openai").trim().toLowerCase();
  if (
    value === "ollama"
    || value === "gemini"
    || value === "groq"
    || value === "anthropic"
    || value === "openai_compatible"
  ) {
    return value;
  }
  return "openai";
}

function mockLogoDataUrl(name: string, specialty: string): string {
  const label = (name || specialty || "LS").trim().slice(0, 24) || "LS";
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "LS";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#4A5D4E"/>
  <text x="256" y="278" text-anchor="middle" font-family="Georgia, serif" font-size="160" fill="#F4F1EA">${initials}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

type LogoImageProvider = "openai" | "mock" | "gemini";

function parseLogoImageFallbackChain(raw?: string): LogoImageProvider[] {
  const text = String(raw ?? process.env.AI_IMAGE_FALLBACK_CHAIN ?? "openai,mock,gemini").trim();
  const parsed = text
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const allowed = new Set<LogoImageProvider>(["openai", "mock", "gemini"]);
  const chain = parsed.filter((item): item is LogoImageProvider => allowed.has(item as LogoImageProvider));
  return chain.length ? chain : ["openai", "mock", "gemini"];
}

function buildLogoPrompt(input: {
  name?: string;
  specialty?: string;
  vertical?: string;
  brief?: string;
  language?: string;
}): string {
  const name = String(input.name ?? "").trim();
  const specialty = String(input.specialty ?? "").trim();
  const vertical = String(input.vertical ?? "generic").trim();
  const brief = String(input.brief ?? "").trim();
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
function isGptImageModel(model = ""): boolean {
  return /^gpt-image/i.test(String(model).trim());
}

function buildOpenAiImageGenerationBody(model: string, prompt: string): Record<string, unknown> {
  const body: Record<string, unknown> = {
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

function logoResultFromOpenAiPayload(
  payload: { data?: Array<{ url?: string; b64_json?: string }> },
  prompt: string,
) {
  const first = payload?.data?.[0];
  if (first?.url) {
    return { imageUrl: first.url, provider: "openai", prompt };
  }
  if (first?.b64_json) {
    return {
      imageUrl: `data:image/png;base64,${first.b64_json}`,
      provider: "openai",
      prompt,
    };
  }
  return null;
}

async function generateLogoWithOpenAi(
  apiKey: string,
  prompt: string,
): Promise<{ imageUrl: string; provider: string; prompt: string }> {
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

  const payload = await response.json() as { data?: Array<{ url?: string; b64_json?: string }> };
  const result = logoResultFromOpenAiPayload(payload, prompt);
  if (!result) {
    throw new Error("OpenAI images returned no image data.");
  }
  return result;
}

function generateLogoWithMock(
  name: string,
  specialty: string,
  prompt: string,
): { imageUrl: string; provider: string; prompt: string } {
  return {
    imageUrl: mockLogoDataUrl(name, specialty),
    provider: "mock",
    prompt,
  };
}

function extractGeminiInlineImage(payload: {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: { mimeType?: string; data?: string };
        inline_data?: { mime_type?: string; data?: string };
        thought?: boolean;
      }>;
    };
  }>;
}): string | null {
  const parts = payload.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.thought === true) continue;
    const inline = part.inlineData || part.inline_data;
    const data = String(inline?.data ?? "").trim();
    if (!data) continue;
    const mimeType = (inline && "mimeType" in inline && inline.mimeType)
      || (inline && "mime_type" in inline && inline.mime_type)
      || "image/png";
    return `data:${mimeType};base64,${data}`;
  }
  return null;
}

async function generateLogoWithGeminiImagen(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<{ imageUrl: string; provider: string; prompt: string }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:predict?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: prompt.slice(0, 480) }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1",
        },
      }),
    },
  );
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Gemini Imagen (${model}) respondió ${response.status}: ${raw.slice(0, 200)}`);
  }

  const payload = JSON.parse(raw) as {
    predictions?: Array<{
      bytesBase64Encoded?: string;
      mimeType?: string;
      image?: { bytesBase64Encoded?: string; mimeType?: string };
    }>;
  };
  const first = payload.predictions?.[0];
  const encoded = first?.bytesBase64Encoded
    || first?.image?.bytesBase64Encoded
    || "";
  if (!encoded) {
    throw new Error(`Gemini Imagen (${model}) returned no image data.`);
  }
  const mimeType = first?.mimeType || first?.image?.mimeType || "image/png";
  return {
    imageUrl: `data:${mimeType};base64,${encoded}`,
    provider: "gemini",
    prompt,
  };
}

async function generateLogoWithGeminiNative(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<{ imageUrl: string; provider: string; prompt: string }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt.slice(0, 3500) }] }],
        generationConfig: {
          responseModalities: ["IMAGE"],
        },
      }),
    },
  );
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Gemini image (${model}) respondió ${response.status}: ${raw.slice(0, 200)}`);
  }

  const payload = JSON.parse(raw) as Parameters<typeof extractGeminiInlineImage>[0];
  const imageUrl = extractGeminiInlineImage(payload);
  if (!imageUrl) {
    throw new Error(`Gemini image (${model}) returned no image data.`);
  }
  return { imageUrl, provider: "gemini", prompt };
}

async function generateLogoWithGemini(
  prompt: string,
): Promise<{ imageUrl: string; provider: string; prompt: string }> {
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
 * Fallback chain defaults to OpenAI → mock SVG → Gemini Imagen.
 */
export async function generateLogoImage(input: {
  name?: string;
  specialty?: string;
  vertical?: string;
  brief?: string;
  language?: string;
  apiKey?: string;
}): Promise<{ imageUrl: string; provider: string; prompt: string }> {
  const name = String(input.name ?? "").trim();
  const specialty = String(input.specialty ?? "").trim();
  const prompt = buildLogoPrompt({
    name,
    specialty,
    vertical: input.vertical,
    brief: input.brief,
    language: input.language,
  });

  const openaiKey = String(input.apiKey || process.env.OPENAI_API_KEY || "").trim();
  const chain = parseLogoImageFallbackChain();
  const errors: string[] = [];

  for (const step of chain) {
    try {
      if (step === "openai") {
        if (!openaiKey) continue;
        return await generateLogoWithOpenAi(openaiKey, prompt);
      }
      if (step === "mock") {
        if (process.env.AI_IMAGE_SKIP_MOCK === "true") continue;
        return generateLogoWithMock(name, specialty, prompt);
      }
      if (step === "gemini") {
        return await generateLogoWithGemini(prompt);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${step}: ${message}`);
    }
  }

  if (errors.length) {
    throw new Error(errors.join(" | "));
  }

  return generateLogoWithMock(name, specialty, prompt);
}
