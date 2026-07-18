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
    throw new Error(`AI provider error ${response.status}: ${raw.slice(0, 240)}`);
  }
  const data = JSON.parse(raw) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content || "{}";
  return extractJsonObject(content);
}

export async function chatOllama(request: ChatJsonRequest): Promise<Record<string, unknown>> {
  const base = (request.baseUrl || process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
  const model = request.model || process.env.AI_LITE_MODEL || "qwen2.5:7b";

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
      throw new Error(`Ollama error ${response.status}: ${raw.slice(0, 240)}`);
    }
    const data = JSON.parse(raw) as { message?: { content?: string } };
    return extractJsonObject(data.message?.content || "{}");
  } catch (error) {
    // Hub Ollama often unavailable in local/dev — fall through to mock.
    console.warn("Ollama unavailable, using mock:", error);
    return mockChatJson(request);
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

export async function chatGemini(request: ChatJsonRequest): Promise<Record<string, unknown>> {
  const apiKey = request.apiKey || process.env.GEMINI_API_KEY || "";
  const model = request.model || process.env.AI_LITE_MODEL || "gemini-2.0-flash";
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
    throw new Error(`Gemini error ${response.status}: ${raw.slice(0, 240)}`);
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
    throw new Error(`Anthropic error ${response.status}: ${raw.slice(0, 240)}`);
  }
  const data = JSON.parse(raw) as { content?: Array<{ text?: string }> };
  const content = data.content?.map((part) => part.text || "").join("\n") || "{}";
  return extractJsonObject(content);
}

export async function runProviderChat(
  provider: AiProviderId,
  request: ChatJsonRequest,
): Promise<{ result: Record<string, unknown>; provider: AiProviderId | "mock" }> {
  let result: Record<string, unknown>;
  switch (provider) {
    case "ollama":
      result = await chatOllama(request);
      break;
    case "gemini":
      result = await chatGemini(request);
      break;
    case "groq":
      result = await chatGroq(request);
      break;
    case "anthropic":
      result = await chatAnthropic(request);
      break;
    case "openai_compatible":
      result = await chatOpenAiCompatible(
        request,
        request.baseUrl || "https://api.openai.com/v1",
        request.model || "gpt-4o-mini",
      );
      break;
    case "openai":
    default:
      result = await chatOpenAi(request);
      break;
  }
  const usedMock = result.provider === "mock";
  return { result, provider: usedMock ? "mock" : provider };
}

function asProviderId(value: string, fallback: AiProviderId): AiProviderId {
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
  return fallback;
}

export function resolveLiteProviderChain(): AiProviderId[] {
  const primary = asProviderId(process.env.AI_LITE_PROVIDER || "ollama", "ollama");
  const fallback = asProviderId(process.env.AI_LITE_FALLBACK_PROVIDER || "gemini", "gemini");
  const chain: AiProviderId[] = [];
  for (const id of [primary, fallback, "groq" as const, "ollama" as const]) {
    if (!chain.includes(id)) chain.push(id);
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
