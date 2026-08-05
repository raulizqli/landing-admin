import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";
import {
  resolveFullProvider,
  resolveLiteProviderChain,
  buildProviderFallbackChain,
  isQuotaOrRateLimitError,
  isProviderConnectivityError,
  runProviderChat,
  generateLogoImage,
  AiProviderId,
} from "./aiProviders.js";
import { sensitiveCallableOptions } from "./callableOptions.js";

if (getApps().length === 0) {
  initializeApp();
}

const USERS_COLLECTION = "users";
const BILLING_ACCOUNTS_COLLECTION = "billingAccounts";
const AI_USAGE_SUBCOLLECTION = "aiUsage";
const AI_SECRETS_DOC = "aiProvider";
const callableOptions = sensitiveCallableOptions();
const longCallableOptions = sensitiveCallableOptions({ timeoutSeconds: 120 });

const LITE_ACTIONS = new Set(["rewrite_field", "polish_bio", "polish_tagline", "hero_suggest"]);
const FULL_ACTIONS = new Set([
  ...LITE_ACTIONS,
  "service_blurb",
  "seo_meta",
  "blog_draft",
  "suggest_page_structure",
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

const PLAN_QUOTAS: Record<string, {
  lite: number;
  full: number | null;
  logo: number | null;
  aiAssist: boolean;
  aiByok: boolean;
}> = {
  starter: { lite: 30, full: 0, logo: 0, aiAssist: false, aiByok: false },
  pro: { lite: 30, full: 50, logo: 3, aiAssist: true, aiByok: false },
  agency: { lite: 30, full: 200, logo: null, aiAssist: true, aiByok: true },
  enterprise: { lite: 30, full: null, logo: null, aiAssist: true, aiByok: true },
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

function aiSecretsRef(accountId: string) {
  return getFirestore()
    .collection(BILLING_ACCOUNTS_COLLECTION)
    .doc(accountId)
    .collection("secrets")
    .doc(AI_SECRETS_DOC);
}

/** Persist BYOK key in Admin-only secrets subcollection (never on the public billingAccounts doc). */
async function saveByokApiKey(accountId: string, apiKey: string): Promise<void> {
  const trimmed = String(apiKey ?? "").trim();
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
async function loadByokApiKey(
  accountId: string,
  accountData: Record<string, unknown>,
): Promise<string> {
  const secretsSnap = await aiSecretsRef(accountId).get();
  const fromSecrets = String(secretsSnap.data()?.apiKey ?? "").trim();
  if (fromSecrets) return fromSecrets;

  const legacy = (accountData.aiProvider && typeof accountData.aiProvider === "object")
    ? accountData.aiProvider as Record<string, unknown>
    : {};
  const legacyKey = String(legacy.apiKey ?? "").trim();
  if (!legacyKey) return "";

  await saveByokApiKey(accountId, legacyKey);
  await getFirestore().collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId).set({
    aiProvider: {
      ...legacy,
      apiKey: FieldValue.delete(),
      apiKeyLast4: legacy.apiKeyLast4 || legacyKey.slice(-4),
      hasKey: true,
    },
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  return legacyKey;
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
  lane: "lite" | "full" | "logo",
  limit: number | null,
  isRoot: boolean,
) {
  if (isRoot || limit == null) {
    return { generations: 0, limit, remaining: null as number | null };
  }
  if (limit <= 0) {
    throw new HttpsError(
      "permission-denied",
      lane === "logo"
        ? "Generar logo con IA requiere plan Pro o superior."
        : "Esta acción de IA no está incluida en tu plan.",
    );
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
        lane === "logo"
          ? `Cuota de logos IA agotada (${limit}/mes en Pro). Mejora a Agency para ilimitado, o espera al próximo periodo.`
          : `Cuota de IA ${lane} agotada (${limit}/mes). Mejora tu plan o espera al próximo periodo.`,
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

/** Firebase clients redact messages for code "internal"; use unavailable + details. */
function sanitizeAiProviderMessage(error: unknown, fallback: string): string {
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

function throwAiProviderFailure(error: unknown, fallback: string): never {
  const message = sanitizeAiProviderMessage(error, fallback);
  throw new HttpsError("unavailable", message, {
    reason: "ai_provider_failure",
    detail: message,
  });
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

export const generateLandingDraft = onCall(longCallableOptions, async (request: CallableRequest) => {
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
  const failures: string[] = [];

  for (const provider of providers) {
    try {
      const output = await runProviderChat(provider, { system, user });
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
    } catch (error) {
      const detail = sanitizeAiProviderMessage(error, "fallo sin detalle");
      failures.push(`${provider}: ${detail}`);
      console.error("generateLandingDraft provider failure", { provider, detail, error });
    }
  }

  throwAiProviderFailure(
    new Error(failures.join(" | ") || "Ningún proveedor de IA respondió."),
    "No se pudo generar el borrador. Revisa claves, modelo y conectividad de IA.",
  );
});

export const runAiAssist = onCall(longCallableOptions, async (request: CallableRequest) => {
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

  if (action === "generate_logo") {
    const logoUsage = await assertAndIncrementQuota(
      accountId,
      "logo",
      isRoot ? null : quotaConf.logo,
      isRoot,
    );

    let logoResult: { imageUrl: string; provider: string; prompt: string };
    try {
      const byokKey = account.aiProvider?.mode === "byok"
        && quotaConf.aiByok
        && isActiveStatus(account.status)
        ? await loadByokApiKey(accountId, account as Record<string, unknown>)
        : "";
      logoResult = await generateLogoImage({
        name: String(context.name ?? ""),
        specialty: String(context.specialty ?? ""),
        vertical: String(context.vertical ?? "generic"),
        brief,
        language,
        apiKey: byokKey || undefined,
      });
    } catch (error) {
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

  const system = buildSystemPrompt(language, String(context.vertical ?? "generic"));
  const user = buildUserPrompt({
    action,
    tone,
    fieldPath,
    currentValue,
    brief,
    context,
  });

  let byokProvider: AiProviderId | null = null;
  let apiKey = "";
  let baseUrl = "";
  let model = "";

  const byok = account.aiProvider?.mode === "byok" && quotaConf.aiByok && isActiveStatus(account.status);
  if (lane === "full" && byok && account.aiProvider?.provider) {
    byokProvider = resolveFullProvider(account.aiProvider.provider);
    apiKey = await loadByokApiKey(accountId, account as Record<string, unknown>);
    baseUrl = String(account.aiProvider.baseUrl ?? "");
    model = String(account.aiProvider.model ?? "");
  }

  const preferredForChain = byokProvider
    || (preferredEngine === "gemini" || preferredEngine === "groq" || preferredEngine === "ollama"
      || preferredEngine === "openai" || preferredEngine === "anthropic" || preferredEngine === "openai_compatible"
      ? preferredEngine
      : null)
    || (lane === "full" ? resolveFullProvider() : null);

  // Prefer chosen engine; on quota/rate-limit OR connectivity failure continue the chain.
  // Lite without an explicit engine still retries any provider failure (legacy behavior).
  const providerChain = buildProviderFallbackChain({
    preferred: preferredForChain,
    includeFullDefault: lane === "full" && !byokProvider,
  });
  const retryAnyFailure = !byokProvider || (lane === "lite" && !preferredEngine);

  let result: Record<string, unknown> | null = null;
  let usedProvider: string = providerChain[0] || "gemini";
  const failures: string[] = [];

  try {
    for (let index = 0; index < providerChain.length; index += 1) {
      const candidate = providerChain[index];
      const chatRequest = candidate === byokProvider
        ? { system, user, apiKey, baseUrl, model }
        : { system, user };
      try {
        const out = await runProviderChat(candidate, chatRequest);
        // Mock means the adapter could not reach a real model — keep walking the chain.
        if (out.provider === "mock" && index < providerChain.length - 1) {
          failures.push(`${candidate}: respuesta mock (sin proveedor real)`);
          console.warn("runAiAssist skipping mock result", { candidate, failures });
          continue;
        }
        result = out.result;
        usedProvider = out.provider;
        if (index > 0) {
          console.warn("runAiAssist fell back after provider failure", {
            usedProvider,
            failures,
          });
        }
        break;
      } catch (error) {
        const detail = sanitizeAiProviderMessage(error, "fallo sin detalle");
        failures.push(`${candidate}: ${detail}`);
        console.error("runAiAssist provider failure", { candidate, detail, error });
        const canRetry = index < providerChain.length - 1
          && (
            retryAnyFailure
            || isQuotaOrRateLimitError(error)
            || isProviderConnectivityError(error)
          );
        if (!canRetry) {
          throw error;
        }
      }
    }
    if (!result || usedProvider === "mock") {
      throw new Error(failures.join(" | ") || "Ningún proveedor de IA respondió.");
    }
  } catch (error) {
    console.error("runAiAssist provider failure", error);
    throwAiProviderFailure(
      error,
      "Error al generar con IA. Revisa el proveedor configurado (API key, modelo, cuota).",
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

/** Agency+/root: store BYOK provider settings (api key in secrets/ only). */
export const setAiProviderConfig = onCall(callableOptions, async (request: CallableRequest) => {
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

  let apiKeyLast4 = String(previous.apiKeyLast4 ?? "").trim();
  let hasKey = false;

  if (clearKey) {
    await saveByokApiKey(accountId, "");
    apiKeyLast4 = "";
    hasKey = false;
  } else if (apiKey) {
    await saveByokApiKey(accountId, apiKey);
    apiKeyLast4 = apiKey.slice(-4);
    hasKey = true;
  } else {
    const existing = await loadByokApiKey(accountId, account);
    hasKey = Boolean(existing);
    if (hasKey && !apiKeyLast4 && existing) apiKeyLast4 = existing.slice(-4);
  }

  const next: Record<string, unknown> = {
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
    aiProvider: {
      ...next,
      apiKey: FieldValue.delete(),
    },
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

export const getAiAssistUsage = onCall(callableOptions, async (request: CallableRequest) => {
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
  const logoSnap = await getFirestore()
    .collection(BILLING_ACCOUNTS_COLLECTION)
    .doc(accountId)
    .collection(AI_USAGE_SUBCOLLECTION)
    .doc(`${period}-logo`)
    .get();
  const logoGenerations = Number(logoSnap.data()?.generations ?? 0) || 0;
  const logoLimit = isRoot ? null : PLAN_QUOTAS[planId].logo;
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
