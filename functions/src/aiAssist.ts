import { getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";
import {
  resolveFullProvider,
  resolveLiteProviderChain,
  runProviderChat,
  AiProviderId,
} from "./aiProviders.js";

if (getApps().length === 0) {
  initializeApp();
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

const PLAN_QUOTAS: Record<string, { lite: number; full: number | null; aiAssist: boolean; aiByok: boolean }> = {
  starter: { lite: 30, full: 0, aiAssist: false, aiByok: false },
  pro: { lite: 30, full: 50, aiAssist: true, aiByok: false },
  agency: { lite: 30, full: 200, aiAssist: true, aiByok: true },
  enterprise: { lite: 30, full: null, aiAssist: true, aiByok: true },
};

type CallerProfile = {
  uid: string;
  role?: string;
  accountId?: string;
  pageId?: string;
  assignedPageIds?: unknown;
};

function normalizePlanId(value: unknown): string {
  const id = String(value ?? "").trim().toLowerCase();
  return PLAN_QUOTAS[id] ? id : "starter";
}

function normalizePageIdList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function canAccessPage(profile: CallerProfile, pageId: string): boolean {
  const role = String(profile.role ?? "").trim().toLowerCase();
  if (role === "root") return true;
  if (role === "admin") return normalizePageIdList(profile.assignedPageIds).includes(pageId);
  if (role === "user") {
    const single = String(profile.pageId ?? "").trim();
    if (single) return single === pageId;
    return normalizePageIdList(profile.assignedPageIds)[0] === pageId;
  }
  return false;
}

function isActiveStatus(status: unknown): boolean {
  const value = String(status ?? "").trim().toLowerCase();
  return value === "active" || value === "trialing";
}

function currentPeriod(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function getCallerProfile(uid: string): Promise<CallerProfile> {
  const snap = await getFirestore().collection(USERS_COLLECTION).doc(uid).get();
  if (!snap.exists) {
    throw new HttpsError("permission-denied", "Perfil de usuario no encontrado.");
  }
  return { uid, ...(snap.data() ?? {}) } as CallerProfile;
}

function resolveLane(account: { plan?: unknown; status?: unknown }, isRoot: boolean): "lite" | "full" {
  if (isRoot) return "full";
  const planId = normalizePlanId(account.plan);
  const quota = PLAN_QUOTAS[planId];
  if (isActiveStatus(account.status) && quota.aiAssist) return "full";
  return "lite";
}

function buildSystemPrompt(language: string, vertical: string): string {
  const lang = language === "en" ? "English" : "Spanish";
  return [
    "You are a writing assistant for professional service landing pages (psychology, therapy, coaching, clinics).",
    `Write in ${lang}.`,
    "Tone: warm, clear, ethical. Never invent clinical diagnoses, guarantees of cure, or medical claims.",
    "Return ONLY valid JSON as instructed. No markdown fences.",
    `Vertical context: ${vertical || "generic"}.`,
  ].join(" ");
}

function buildUserPrompt(payload: {
  action: string;
  tone: string;
  fieldPath: string;
  currentValue: string;
  brief: string;
  context: Record<string, unknown>;
}): string {
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

async function assertAndIncrementQuota(
  accountId: string,
  lane: "lite" | "full",
  limit: number | null,
  isRoot: boolean,
) {
  if (isRoot || limit == null) {
    return { generations: 0, limit, remaining: null as number | null };
  }
  const period = currentPeriod();
  const ref = getFirestore()
    .collection(BILLING_ACCOUNTS_COLLECTION)
    .doc(accountId)
    .collection(AI_USAGE_SUBCOLLECTION)
    .doc(`${period}-${lane}`);

  const used = await getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const generations = Number(snap.data()?.generations ?? 0) || 0;
    if (generations >= limit) {
      throw new HttpsError(
        "resource-exhausted",
        `Cuota de IA ${lane} agotada (${limit}/mes). Mejora tu plan o espera al próximo periodo.`,
      );
    }
    tx.set(
      ref,
      {
        period,
        lane,
        generations: generations + 1,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    return generations + 1;
  });

  return {
    generations: used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

function buildLandingDraftPrompt(brief: string, language: string, vertical: string): string {
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

export const generateLandingDraft = onCall({ timeoutSeconds: 120 }, async (request: CallableRequest) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }

  const profile = await getCallerProfile(request.auth.uid);
  if (String(profile.role ?? "").trim().toLowerCase() !== "root") {
    throw new HttpsError("permission-denied", "Solo root puede crear páginas con IA.");
  }

  const brief = String(request.data?.brief ?? "").trim();
  if (brief.length < 80) {
    throw new HttpsError(
      "invalid-argument",
      "Describe con más detalle el objetivo, público, servicios y propuesta de valor.",
    );
  }
  if (brief.length > 12000) {
    throw new HttpsError("invalid-argument", "La descripción es demasiado larga (máximo 12,000 caracteres).");
  }

  const language = String(request.data?.language ?? "es").toLowerCase().startsWith("en") ? "en" : "es";
  const vertical = String(request.data?.vertical ?? "generic").trim().toLowerCase() || "generic";
  const system = [
    "You are a conversion copywriter and information architect for professional landing pages.",
    `Write in ${language === "en" ? "English" : "Spanish"}.`,
    "Use a clear, trustworthy tone appropriate to the business vertical.",
    "Never invent facts, credentials, contact details, reviews, guarantees, diagnoses, or regulated claims.",
    "Return ONLY valid JSON matching the requested schema. No markdown fences.",
  ].join(" ");
  const user = buildLandingDraftPrompt(brief, language, vertical);
  const providers = [...new Set([resolveFullProvider(), ...resolveLiteProviderChain()])];
  let lastError: unknown = null;

  for (const provider of providers) {
    try {
      const output = await runProviderChat(provider, { system, user });
      return {
        ok: true,
        provider: output.provider,
        result: output.result,
        disclaimer: "Este contenido es un borrador. Revísalo antes de publicar.",
      };
    } catch (error) {
      lastError = error;
    }
  }

  console.error("generateLandingDraft provider failure", lastError);
  throw new HttpsError(
    "internal",
    lastError instanceof Error ? lastError.message.slice(0, 240) : "No se pudo generar el borrador.",
  );
});

export const runAiAssist = onCall({ timeoutSeconds: 120 }, async (request: CallableRequest) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }

  const profile = await getCallerProfile(request.auth.uid);
  const isRoot = String(profile.role ?? "").trim().toLowerCase() === "root";
  const pageId = String(request.data?.pageId ?? "").trim();
  if (!pageId) {
    throw new HttpsError("invalid-argument", "pageId es obligatorio.");
  }
  if (!canAccessPage(profile, pageId)) {
    throw new HttpsError("permission-denied", "No tienes acceso a esta página.");
  }

  const action = String(request.data?.action ?? "").trim().toLowerCase();
  const tone = String(request.data?.tone ?? "empathetic").trim().toLowerCase() || "empathetic";
  const language = String(request.data?.language ?? "es").trim().toLowerCase().startsWith("en")
    ? "en"
    : "es";
  const fieldPath = String(request.data?.fieldPath ?? "").trim();
  const currentValue = String(request.data?.currentValue ?? request.data?.input?.currentValue ?? "").trim();
  const brief = String(request.data?.brief ?? request.data?.input?.brief ?? "").trim();
  const context = (request.data?.input?.context || request.data?.context || {}) as Record<string, unknown>;
  const preferredEngine = String(request.data?.engine ?? "").trim().toLowerCase();

  const accountId = String(profile.accountId ?? profile.uid).trim();
  const accountSnap = await getFirestore().collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId).get();
  const account = { id: accountId, ...(accountSnap.data() ?? {}) } as {
    id: string;
    plan?: string;
    status?: string;
    aiProvider?: {
      mode?: string;
      provider?: string;
      baseUrl?: string;
      apiKey?: string;
      model?: string;
    };
  };

  const lane = resolveLane(account, isRoot);
  const allowed = lane === "full" ? FULL_ACTIONS : LITE_ACTIONS;
  if (!allowed.has(action)) {
    throw new HttpsError(
      "permission-denied",
      lane === "lite"
        ? "Esta acción de IA requiere plan Pro o superior."
        : "Acción de IA no válida.",
    );
  }

  const planId = normalizePlanId(account.plan);
  const quotaConf = PLAN_QUOTAS[planId];
  const limit = lane === "full" ? quotaConf.full : quotaConf.lite;
  const usage = await assertAndIncrementQuota(accountId, lane, limit, isRoot);

  const system = buildSystemPrompt(language, String(context.vertical ?? "generic"));
  const user = buildUserPrompt({
    action,
    tone,
    fieldPath,
    currentValue,
    brief,
    context,
  });

  let provider: AiProviderId = "ollama";
  let apiKey = "";
  let baseUrl = "";
  let model = "";

  const byok = account.aiProvider?.mode === "byok" && quotaConf.aiByok && isActiveStatus(account.status);
  if (lane === "full" && byok && account.aiProvider?.provider) {
    provider = resolveFullProvider(account.aiProvider.provider);
    apiKey = String(account.aiProvider.apiKey ?? "");
    baseUrl = String(account.aiProvider.baseUrl ?? "");
    model = String(account.aiProvider.model ?? "");
  } else if (lane === "full") {
    provider = resolveFullProvider();
  } else if (preferredEngine === "gemini" || preferredEngine === "groq" || preferredEngine === "ollama") {
    provider = preferredEngine;
  } else {
    provider = resolveLiteProviderChain()[0];
  }

  const chatRequest = { system, user, apiKey, baseUrl, model };
  let result: Record<string, unknown> | null = null;
  let usedProvider: string = provider;

  try {
    if (lane === "lite" && !preferredEngine) {
      let lastError: unknown = null;
      for (const candidate of resolveLiteProviderChain()) {
        try {
          const out = await runProviderChat(candidate, chatRequest);
          result = out.result;
          usedProvider = out.provider;
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (!result) {
        throw lastError instanceof Error ? lastError : new Error("No AI lite provider available.");
      }
    } else {
      const out = await runProviderChat(provider, chatRequest);
      result = out.result;
      usedProvider = out.provider;
    }
  } catch (error) {
    console.error("runAiAssist provider failure", error);
    throw new HttpsError(
      "internal",
      error instanceof Error ? error.message.slice(0, 240) : "Error al generar con IA.",
    );
  }

  await getFirestore().collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId).set(
    {
      aiUsageUpdatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

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
export const setAiProviderConfig = onCall(async (request: CallableRequest) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }
  const profile = await getCallerProfile(request.auth.uid);
  const isRoot = String(profile.role ?? "").trim().toLowerCase() === "root";
  const accountId = String(request.data?.accountId ?? profile.accountId ?? profile.uid).trim();
  if (!accountId) {
    throw new HttpsError("invalid-argument", "accountId es obligatorio.");
  }

  const accountRef = getFirestore().collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId);
  const accountSnap = await accountRef.get();
  if (!accountSnap.exists) {
    throw new HttpsError("not-found", "Cuenta de billing no encontrada.");
  }
  const account = accountSnap.data() ?? {};
  const planId = normalizePlanId(account.plan);
  if (!isRoot && !PLAN_QUOTAS[planId].aiByok) {
    throw new HttpsError("permission-denied", "BYOK requiere plan Agency o Enterprise.");
  }
  if (!isRoot && String(profile.accountId ?? profile.uid) !== accountId) {
    throw new HttpsError("permission-denied", "No puedes editar otra cuenta.");
  }

  const mode = String(request.data?.mode ?? "platform").trim().toLowerCase() === "byok"
    ? "byok"
    : "platform";
  const provider = resolveFullProvider(request.data?.provider);
  const model = String(request.data?.model ?? "").trim();
  const baseUrl = String(request.data?.baseUrl ?? "").trim();
  const apiKey = String(request.data?.apiKey ?? "").trim();
  const clearKey = request.data?.clearKey === true;

  const previous = (account.aiProvider && typeof account.aiProvider === "object")
    ? account.aiProvider as Record<string, unknown>
    : {};

  const next: Record<string, unknown> = {
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
  } else if (apiKey) {
    next.apiKey = apiKey;
    next.apiKeyLast4 = apiKey.slice(-4);
  } else if (previous.apiKey) {
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

export const getAiAssistUsage = onCall(async (request: CallableRequest) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }
  const profile = await getCallerProfile(request.auth.uid);
  const isRoot = String(profile.role ?? "").trim().toLowerCase() === "root";
  const accountId = String(profile.accountId ?? profile.uid).trim();
  const accountSnap = await getFirestore().collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId).get();
  const account = accountSnap.data() ?? {};
  const lane = resolveLane(account, isRoot);
  const planId = normalizePlanId(account.plan);
  const limit = lane === "full" ? PLAN_QUOTAS[planId].full : PLAN_QUOTAS[planId].lite;
  const period = currentPeriod();
  const usageSnap = await getFirestore()
    .collection(BILLING_ACCOUNTS_COLLECTION)
    .doc(accountId)
    .collection(AI_USAGE_SUBCOLLECTION)
    .doc(`${period}-${lane}`)
    .get();
  const generations = Number(usageSnap.data()?.generations ?? 0) || 0;
  const aiProvider = account.aiProvider && typeof account.aiProvider === "object"
    ? account.aiProvider as Record<string, unknown>
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
