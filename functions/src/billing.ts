import { createHmac, timingSafeEqual } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import { onCall, onRequest, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";
import Stripe from "stripe";
import { applyBillingPatchWithSiteAccess } from "./siteAccessSync.js";
import { sensitiveCallableOptions } from "./callableOptions.js";

if (getApps().length === 0) {
  initializeApp();
}

const USERS_COLLECTION = "users";
const BILLING_ACCOUNTS_COLLECTION = "billingAccounts";
const callableOptions = sensitiveCallableOptions();

const VALID_PLANS = new Set(["starter", "pro", "agency", "enterprise"]);

const PLAN_AMOUNTS_MXN: Record<string, number> = {
  starter: 189,
  pro: 469,
  agency: 1399,
};

/** Keep in sync with BILLING_ANNUAL_DISCOUNT in packages/landing-core/src/billingPlans.js */
const BILLING_ANNUAL_DISCOUNT = 0.2;

type BillingInterval = "month" | "year";
type BillingProvider = "stripe" | "mercadopago" | "manual";

interface BillingAccountRecord {
  id: string;
  name?: string;
  ownerUid?: string;
  plan?: string;
  status?: string;
  provider?: string;
  currency?: string;
  billingInterval?: BillingInterval;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  mercadoPagoPreapprovalId?: string;
  mercadoPagoPayerEmail?: string;
  pageIds?: string[];
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

function normalizePlanId(value: unknown): string {
  const id = String(value ?? "").trim().toLowerCase();
  return VALID_PLANS.has(id) ? id : "starter";
}

function adminPublicUrl(): string {
  return String(process.env.ADMIN_PUBLIC_URL ?? process.env.VITE_ADMIN_PUBLIC_URL ?? "http://localhost:5173")
    .trim()
    .replace(/\/$/, "");
}

function getStripe(): Stripe {
  const key = String(process.env.STRIPE_SECRET_KEY ?? "").trim();
  if (!key) {
    throw new HttpsError("failed-precondition", "STRIPE_SECRET_KEY no está configurada.");
  }
  return new Stripe(key);
}

function normalizeInterval(value: unknown): BillingInterval {
  return String(value ?? "").trim().toLowerCase() === "year" ? "year" : "month";
}

function yearlyAmountFromMonthly(monthly: number): number {
  return Math.round(monthly * 12 * (1 - BILLING_ANNUAL_DISCOUNT));
}

function mercadoPagoAmountMxn(planId: string, interval: BillingInterval): number | undefined {
  const monthly = PLAN_AMOUNTS_MXN[planId];
  if (!monthly) return undefined;
  return interval === "year" ? yearlyAmountFromMonthly(monthly) : monthly;
}

function stripePriceEnvCandidates(
  planId: string,
  currency: "usd" | "mxn" = "usd",
  interval: BillingInterval = "month",
): string[] {
  const plan = planId.toUpperCase();
  const cur = currency.toUpperCase();
  if (interval === "year") {
    return [
      `STRIPE_PRICE_${plan}_${cur}_YEARLY`,
      `STRIPE_PRICE_${plan}_YEARLY_${cur}`,
    ];
  }
  return [
    `STRIPE_PRICE_${plan}_${cur}`,
    `STRIPE_PRICE_${plan}`,
  ];
}

function stripePriceIdForPlan(
  planId: string,
  currency: "usd" | "mxn" = "usd",
  interval: BillingInterval = "month",
): string {
  for (const envKey of stripePriceEnvCandidates(planId, currency, interval)) {
    const priceId = String(process.env[envKey] ?? "").trim();
    if (priceId) return priceId;
  }
  if (interval === "year") {
    throw new HttpsError(
      "failed-precondition",
      `Falta STRIPE_PRICE_${planId.toUpperCase()}_${currency.toUpperCase()}_YEARLY en Functions.`,
    );
  }
  throw new HttpsError(
    "failed-precondition",
    `Falta STRIPE_PRICE_${planId.toUpperCase()}_${currency.toUpperCase()} (o STRIPE_PRICE_${planId.toUpperCase()}) en Functions.`,
  );
}

function allConfiguredStripePriceIds(): Array<{
  planId: string;
  priceId: string;
  interval: BillingInterval;
}> {
  const plans = ["starter", "pro", "agency", "enterprise"];
  const currencies: Array<"usd" | "mxn"> = ["usd", "mxn"];
  const intervals: BillingInterval[] = ["month", "year"];
  const entries: Array<{ planId: string; priceId: string; interval: BillingInterval }> = [];
  for (const planId of plans) {
    for (const currency of currencies) {
      for (const interval of intervals) {
        for (const envKey of stripePriceEnvCandidates(planId, currency, interval)) {
          const priceId = String(process.env[envKey] ?? "").trim();
          if (priceId) entries.push({ planId, priceId, interval });
        }
      }
    }
  }
  return entries;
}

function mercadoPagoToken(): string {
  const token = String(process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").trim();
  if (!token) {
    throw new HttpsError("failed-precondition", "MERCADOPAGO_ACCESS_TOKEN no está configurada.");
  }
  return token;
}

function headerValue(req: { headers: Record<string, unknown> }, name: string): string {
  const raw = req.headers[name] ?? req.headers[name.toLowerCase()];
  if (Array.isArray(raw)) return String(raw[0] ?? "").trim();
  return String(raw ?? "").trim();
}

/**
 * Mercado Pago Webhooks signature (HMAC-SHA256).
 * Manifest: id:{data.id};request-id:{x-request-id};ts:{ts}; (omit missing parts).
 * Fail closed outside the emulator when MERCADOPAGO_WEBHOOK_SECRET is unset (F06).
 */
function assertMercadoPagoWebhookSignature(req: {
  headers: Record<string, unknown>;
  query: Record<string, unknown>;
  body?: { data?: { id?: unknown } };
}): void {
  const secret = String(
    process.env.MERCADOPAGO_WEBHOOK_SECRET
      ?? process.env.MERCADOPAGO_ACCESS_WEBHOOK_TOKEN
      ?? "",
  ).trim();
  const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";

  if (!secret) {
    if (isEmulator) return;
    throw new Error("MERCADOPAGO_WEBHOOK_SECRET is not configured");
  }

  const xSignature = headerValue(req, "x-signature");
  const xRequestId = headerValue(req, "x-request-id");
  if (!xSignature) {
    throw new Error("Missing x-signature");
  }

  const parts = Object.fromEntries(
    xSignature.split(",").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [String(key || "").trim(), rest.join("=").trim()];
    }),
  );
  const ts = String(parts.ts ?? "").trim();
  const v1 = String(parts.v1 ?? "").trim();
  if (!ts || !v1) {
    throw new Error("Invalid x-signature format");
  }

  let dataId = String(req.query["data.id"] ?? req.body?.data?.id ?? req.query.id ?? "").trim();
  if (dataId && /^[a-zA-Z0-9]+$/.test(dataId)) {
    dataId = dataId.toLowerCase();
  }

  let manifest = "";
  if (dataId) manifest += `id:${dataId};`;
  if (xRequestId) manifest += `request-id:${xRequestId};`;
  manifest += `ts:${ts};`;

  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(v1, "utf8");
  if (
    expectedBuf.length !== providedBuf.length
    || !timingSafeEqual(expectedBuf, providedBuf)
  ) {
    throw new Error("Invalid Mercado Pago webhook signature");
  }
}

async function getCallerProfile(uid: string) {
  const snap = await getFirestore().collection(USERS_COLLECTION).doc(uid).get();
  if (!snap.exists) {
    throw new HttpsError("permission-denied", "Perfil de usuario no encontrado.");
  }
  return { uid, ...(snap.data() ?? {}) } as {
    uid: string;
    role?: string;
    email?: string;
    displayName?: string;
    accountId?: string;
    assignedPageIds?: unknown;
    pageId?: string;
  };
}

function normalizePageIdList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function pageIdsFromProfile(profile: {
  assignedPageIds?: unknown;
  pageId?: string;
}): string[] {
  const fromList = normalizePageIdList(profile.assignedPageIds);
  const single = String(profile.pageId ?? "").trim();
  return normalizePageIdList([...fromList, single]);
}

async function loadOrCreateAccountForUser(profile: {
  uid: string;
  email?: string;
  displayName?: string;
  accountId?: string;
  assignedPageIds?: unknown;
  pageId?: string;
}): Promise<BillingAccountRecord> {
  const db = getFirestore();
  const accountId = String(profile.accountId ?? profile.uid).trim();
  const ref = db.collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId);
  const snap = await ref.get();
  const now = new Date().toISOString();
  const profilePageIds = pageIdsFromProfile(profile);

  if (!snap.exists) {
    const account = {
      name: String(profile.displayName || profile.email || accountId).trim(),
      ownerUid: profile.uid,
      plan: "starter",
      status: "trialing",
      provider: "",
      currency: "usd",
      stripeCustomerId: "",
      stripeSubscriptionId: "",
      mercadoPagoPreapprovalId: "",
      mercadoPagoPayerEmail: String(profile.email ?? "").trim().toLowerCase(),
      pageIds: profilePageIds,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    };
    await ref.set(account);
    await db.collection(USERS_COLLECTION).doc(profile.uid).set(
      { accountId, updatedAt: now },
      { merge: true },
    );
    return { id: accountId, ...account };
  }

  if (!profile.accountId) {
    await db.collection(USERS_COLLECTION).doc(profile.uid).set(
      { accountId, updatedAt: now },
      { merge: true },
    );
  }

  const data = snap.data() ?? {};
  const existingPageIds = normalizePageIdList(data.pageIds);
  const mergedPageIds = normalizePageIdList([...existingPageIds, ...profilePageIds]);
  const needsPageSync = mergedPageIds.length !== existingPageIds.length
    || mergedPageIds.some((id) => !existingPageIds.includes(id));

  if (needsPageSync) {
    await ref.set(
      {
        pageIds: mergedPageIds,
        updatedAt: now,
      },
      { merge: true },
    );
    return { id: accountId, ...data, pageIds: mergedPageIds, updatedAt: now };
  }

  return { id: accountId, ...data };
}

async function applyPlanToAccount(
  accountId: string,
  patch: Record<string, unknown>,
) {
  return applyBillingPatchWithSiteAccess(accountId, patch);
}

export const ensureBillingAccount = onCall(callableOptions, async (request: CallableRequest) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }
  const profile = await getCallerProfile(request.auth.uid);
  const account = await loadOrCreateAccountForUser(profile);
  return { account };
});

export const setBillingPlanManual = onCall(callableOptions, async (request: CallableRequest) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }
  const profile = await getCallerProfile(request.auth.uid);
  if (profile.role !== "root") {
    throw new HttpsError("permission-denied", "Solo root puede activar planes manualmente.");
  }

  const targetUid = String(request.data?.uid ?? "").trim();
  let accountId = String(request.data?.accountId ?? "").trim();
  const planId = normalizePlanId(request.data?.planId);
  const status = String(request.data?.status ?? "active").trim() || "active";

  if (targetUid) {
    const targetProfile = await getCallerProfile(targetUid);
    const ensured = await loadOrCreateAccountForUser(targetProfile);
    accountId = ensured.id;
  } else if (accountId) {
    const db = getFirestore();
    const existing = await db.collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId).get();
    if (!existing.exists) {
      // Common case: accountId defaults to the owner's Firebase uid.
      try {
        const ownerProfile = await getCallerProfile(accountId);
        const ensured = await loadOrCreateAccountForUser(ownerProfile);
        accountId = ensured.id;
      } catch (error) {
        if (error instanceof HttpsError && error.code === "permission-denied") {
          throw new HttpsError(
            "not-found",
            `No existe billingAccounts/${accountId} ni un usuario con ese uid.`,
          );
        }
        throw error;
      }
    }
  } else {
    throw new HttpsError("invalid-argument", "accountId o uid es obligatorio.");
  }

  const account = await applyPlanToAccount(accountId, {
    plan: planId,
    status,
    provider: "manual" as BillingProvider,
  });
  return { account };
});

export const createBillingCheckout = onCall(callableOptions, async (request: CallableRequest) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }

  const planId = normalizePlanId(request.data?.planId);
  const provider = String(request.data?.provider ?? "").trim().toLowerCase() as BillingProvider;
  const locale = String(request.data?.locale ?? "es").trim().toLowerCase().startsWith("en")
    ? "en"
    : "es";
  const currency = String(request.data?.currency ?? "usd").trim().toLowerCase() === "mxn"
    ? "mxn"
    : "usd";
  const interval = normalizeInterval(request.data?.interval);
  const successPath = String(request.data?.successPath ?? "/?billing=success").trim() || "/?billing=success";
  const cancelPath = String(request.data?.cancelPath ?? "/?billing=cancel").trim() || "/?billing=cancel";

  if (provider !== "stripe" && provider !== "mercadopago") {
    throw new HttpsError("invalid-argument", "provider debe ser stripe o mercadopago.");
  }
  if (planId === "enterprise") {
    throw new HttpsError(
      "failed-precondition",
      "Enterprise se activa con ventas o manualmente por root.",
    );
  }

  const profile = await getCallerProfile(request.auth.uid);
  const account = await loadOrCreateAccountForUser(profile);
  const base = adminPublicUrl();
  const successUrl = `${base}${successPath.startsWith("/") ? successPath : `/${successPath}`}`;
  const cancelUrl = `${base}${cancelPath.startsWith("/") ? cancelPath : `/${cancelPath}`}`;

  if (provider === "stripe") {
    const stripe = getStripe();
    let customerId = String(account.stripeCustomerId ?? "").trim();
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: String(profile.email ?? request.auth.token.email ?? "").trim() || undefined,
        metadata: { accountId: account.id, uid: profile.uid },
      });
      customerId = customer.id;
      await applyPlanToAccount(account.id, { stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: stripePriceIdForPlan(planId, currency, interval), quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: account.id,
      locale: locale === "en" ? "en" : "es",
      // Promotion codes are applied privately (Dashboard / Payment Links), not shown on Checkout.
      metadata: {
        accountId: account.id,
        planId,
        uid: profile.uid,
        currency,
        interval,
      },
      subscription_data: {
        metadata: {
          accountId: account.id,
          planId,
          currency,
          interval,
        },
      },
    });

    await applyPlanToAccount(account.id, {
      provider: "stripe",
      currency,
      billingInterval: interval,
      plan: planId,
      status: "incomplete",
    });

    return { url: session.url, provider: "stripe", sessionId: session.id };
  }

  // Mercado Pago preapproval (subscription)
  const amount = mercadoPagoAmountMxn(planId, interval);
  if (!amount) {
    throw new HttpsError("invalid-argument", "Plan sin precio MXN para Mercado Pago.");
  }

  const payerEmail = String(
    account.mercadoPagoPayerEmail
      || profile.email
      || request.auth.token.email
      || "",
  ).trim().toLowerCase();

  if (!payerEmail) {
    throw new HttpsError("failed-precondition", "Necesitamos el email del pagador para Mercado Pago.");
  }

  const body = {
    reason: `Toqua — ${planId}${interval === "year" ? " anual" : ""}`,
    external_reference: `${account.id}:${planId}:${interval}`,
    payer_email: payerEmail,
    back_url: successUrl,
    auto_recurring: {
      frequency: interval === "year" ? 12 : 1,
      frequency_type: "months",
      transaction_amount: amount,
      currency_id: "MXN",
    },
    status: "pending",
  };

  const response = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mercadoPagoToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json() as {
    id?: string;
    init_point?: string;
    sandbox_init_point?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new HttpsError(
      "internal",
      `Mercado Pago: ${payload?.message || response.statusText || response.status}`,
    );
  }

  const url = payload.init_point || payload.sandbox_init_point;
  if (!url) {
    throw new HttpsError("internal", "Mercado Pago no devolvió init_point.");
  }

  await applyPlanToAccount(account.id, {
    provider: "mercadopago",
    currency: "mxn",
    billingInterval: interval,
    plan: planId,
    status: "incomplete",
    mercadoPagoPreapprovalId: String(payload.id ?? ""),
    mercadoPagoPayerEmail: payerEmail,
  });

  return { url, provider: "mercadopago", preapprovalId: payload.id };
});

function planFromStripePrice(priceId: string): { planId: string; interval: BillingInterval } | null {
  for (const entry of allConfiguredStripePriceIds()) {
    if (entry.priceId === priceId) return { planId: entry.planId, interval: entry.interval };
  }
  return null;
}

function intervalFromStripePrice(price: unknown): BillingInterval | null {
  if (!price || typeof price === "string") return null;
  const recurring = (price as Stripe.Price).recurring?.interval;
  if (recurring === "year") return "year";
  if (recurring === "month") return "month";
  return null;
}

export const stripeBillingWebhook = onRequest({ cors: false }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const stripe = getStripe();
  const webhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET ?? "").trim();
  const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
  let event: Stripe.Event;

  try {
    if (!webhookSecret) {
      // Fail closed outside the emulator (F05): unsigned events must never mutate billing.
      if (!isEmulator) {
        console.error("Stripe webhook rejected: STRIPE_WEBHOOK_SECRET is not configured");
        res.status(500).send("Webhook secret not configured");
        return;
      }
      event = req.body as Stripe.Event;
    } else {
      const signature = req.headers["stripe-signature"];
      if (!signature || Array.isArray(signature)) {
        res.status(400).send("Missing stripe-signature");
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawBody = (req as any).rawBody ?? JSON.stringify(req.body);
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    }
  } catch (error) {
    console.error("Stripe webhook signature error", error);
    res.status(400).send("Invalid signature");
    return;
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const accountId = String(session.client_reference_id || session.metadata?.accountId || "").trim();
      const planId = normalizePlanId(session.metadata?.planId);
      const interval = normalizeInterval(session.metadata?.interval);
      if (accountId) {
        await applyPlanToAccount(accountId, {
          plan: planId,
          status: "active",
          provider: "stripe",
          billingInterval: interval,
          stripeCustomerId: String(session.customer ?? ""),
          stripeSubscriptionId: String(session.subscription ?? ""),
        });
      }
    }

    if (
      event.type === "customer.subscription.updated"
      || event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const accountId = String(subscription.metadata?.accountId ?? "").trim();
      const price = subscription.items.data[0]?.price;
      const priceId = typeof price === "string" ? price : price?.id ?? "";
      const fromPrice = planFromStripePrice(priceId);
      const planId = normalizePlanId(
        subscription.metadata?.planId || fromPrice?.planId || "starter",
      );
      const interval = normalizeInterval(
        subscription.metadata?.interval
          || fromPrice?.interval
          || intervalFromStripePrice(price)
          || "month",
      );
      const statusMap: Record<string, string> = {
        active: "active",
        trialing: "trialing",
        past_due: "past_due",
        canceled: "canceled",
        unpaid: "past_due",
        incomplete: "incomplete",
      };
      const status = event.type === "customer.subscription.deleted"
        ? "canceled"
        : (statusMap[subscription.status] || "incomplete");

      if (accountId) {
        const periodEnd = (subscription as Stripe.Subscription & {
          current_period_end?: number;
        }).current_period_end;
        await applyPlanToAccount(accountId, {
          plan: planId,
          status,
          provider: "stripe",
          billingInterval: interval,
          stripeSubscriptionId: subscription.id,
          cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
          currentPeriodEnd: periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : null,
        });
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler error", error);
    res.status(500).send("Webhook handler failed");
  }
});

export const mercadoPagoBillingWebhook = onRequest({ cors: false }, async (req, res) => {
  if (req.method !== "POST" && req.method !== "GET") {
    res.status(405).send("Method not allowed");
    return;
  }

  try {
    assertMercadoPagoWebhookSignature(req as {
      headers: Record<string, unknown>;
      query: Record<string, unknown>;
      body?: { data?: { id?: unknown } };
    });
  } catch (error) {
    console.error("Mercado Pago webhook signature error", error);
    res.status(401).send("Invalid signature");
    return;
  }

  try {
    const type = String(req.query.type || req.body?.type || "").trim();
    const dataId = String(req.query["data.id"] || req.body?.data?.id || req.query.id || "").trim();

    if (type.includes("preapproval") && dataId) {
      const response = await fetch(`https://api.mercadopago.com/preapproval/${dataId}`, {
        headers: { Authorization: `Bearer ${mercadoPagoToken()}` },
      });
      const preapproval = await response.json() as {
        id?: string;
        status?: string;
        external_reference?: string;
        auto_recurring?: { frequency?: number; frequency_type?: string };
      };

      if (response.ok && preapproval.external_reference) {
        const [accountId, planFromRef, intervalFromRef] = String(preapproval.external_reference).split(":");
        const planId = normalizePlanId(planFromRef);
        const fromRecurring = preapproval.auto_recurring?.frequency === 12
          && String(preapproval.auto_recurring?.frequency_type ?? "").toLowerCase() === "months"
          ? "year"
          : "month";
        const interval = normalizeInterval(intervalFromRef || fromRecurring);
        const statusRaw = String(preapproval.status ?? "").toLowerCase();
        const status = statusRaw === "authorized" || statusRaw === "active"
          ? "active"
          : statusRaw === "paused"
            ? "past_due"
            : statusRaw === "cancelled" || statusRaw === "canceled"
              ? "canceled"
              : "incomplete";

        if (accountId) {
          await applyPlanToAccount(accountId, {
            plan: planId,
            status,
            provider: "mercadopago",
            billingInterval: interval,
            mercadoPagoPreapprovalId: String(preapproval.id ?? dataId),
          });
        }
      }
    }

    // Acknowledge always so MP doesn't retry forever on non-actionable topics
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Mercado Pago webhook error", error);
    res.status(500).json({ error: "handler_failed" });
  }
});
