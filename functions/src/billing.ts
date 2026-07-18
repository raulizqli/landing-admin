import { getFirestore } from "firebase-admin/firestore";
import { onCall, onRequest, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";
import Stripe from "stripe";
import { applyBillingPatchWithSiteAccess } from "./siteAccessSync.js";

if (getApps().length === 0) {
  initializeApp();
}

const USERS_COLLECTION = "users";
const BILLING_ACCOUNTS_COLLECTION = "billingAccounts";

const VALID_PLANS = new Set(["starter", "pro", "agency", "enterprise"]);

const PLAN_AMOUNTS_MXN: Record<string, number> = {
  starter: 349,
  pro: 899,
  agency: 2499,
};

type BillingProvider = "stripe" | "mercadopago" | "manual";

interface BillingAccountRecord {
  id: string;
  name?: string;
  ownerUid?: string;
  plan?: string;
  status?: string;
  provider?: string;
  currency?: string;
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

function stripePriceIdForPlan(planId: string): string {
  const map: Record<string, string | undefined> = {
    starter: process.env.STRIPE_PRICE_STARTER,
    pro: process.env.STRIPE_PRICE_PRO,
    agency: process.env.STRIPE_PRICE_AGENCY,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  };
  const priceId = String(map[planId] ?? "").trim();
  if (!priceId) {
    throw new HttpsError(
      "failed-precondition",
      `Falta STRIPE_PRICE_${planId.toUpperCase()} en el entorno de Functions.`,
    );
  }
  return priceId;
}

function mercadoPagoToken(): string {
  const token = String(process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").trim();
  if (!token) {
    throw new HttpsError("failed-precondition", "MERCADOPAGO_ACCESS_TOKEN no está configurada.");
  }
  return token;
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
  };
}

async function loadOrCreateAccountForUser(profile: {
  uid: string;
  email?: string;
  displayName?: string;
  accountId?: string;
}): Promise<BillingAccountRecord> {
  const db = getFirestore();
  const accountId = String(profile.accountId ?? profile.uid).trim();
  const ref = db.collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId);
  const snap = await ref.get();
  const now = new Date().toISOString();

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
      pageIds: [],
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

  return { id: accountId, ...(snap.data() ?? {}) };
}

async function applyPlanToAccount(
  accountId: string,
  patch: Record<string, unknown>,
) {
  return applyBillingPatchWithSiteAccess(accountId, patch);
}

export const ensureBillingAccount = onCall(async (request: CallableRequest) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }
  const profile = await getCallerProfile(request.auth.uid);
  const account = await loadOrCreateAccountForUser(profile);
  return { account };
});

export const setBillingPlanManual = onCall(async (request: CallableRequest) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }
  const profile = await getCallerProfile(request.auth.uid);
  if (profile.role !== "root") {
    throw new HttpsError("permission-denied", "Solo root puede activar planes manualmente.");
  }

  const accountId = String(request.data?.accountId ?? "").trim();
  const planId = normalizePlanId(request.data?.planId);
  const status = String(request.data?.status ?? "active").trim() || "active";
  if (!accountId) {
    throw new HttpsError("invalid-argument", "accountId es obligatorio.");
  }

  const account = await applyPlanToAccount(accountId, {
    plan: planId,
    status,
    provider: "manual" as BillingProvider,
  });
  return { account };
});

export const createBillingCheckout = onCall(async (request: CallableRequest) => {
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
      line_items: [{ price: stripePriceIdForPlan(planId), quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: account.id,
      locale: locale === "en" ? "en" : "es",
      metadata: {
        accountId: account.id,
        planId,
        uid: profile.uid,
      },
      subscription_data: {
        metadata: {
          accountId: account.id,
          planId,
        },
      },
    });

    await applyPlanToAccount(account.id, {
      provider: "stripe",
      currency,
      plan: planId,
      status: "incomplete",
    });

    return { url: session.url, provider: "stripe", sessionId: session.id };
  }

  // Mercado Pago preapproval (subscription)
  const amount = PLAN_AMOUNTS_MXN[planId];
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
    reason: `Landing CMS — ${planId}`,
    external_reference: `${account.id}:${planId}`,
    payer_email: payerEmail,
    back_url: successUrl,
    auto_recurring: {
      frequency: 1,
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
    plan: planId,
    status: "incomplete",
    mercadoPagoPreapprovalId: String(payload.id ?? ""),
    mercadoPagoPayerEmail: payerEmail,
  });

  return { url, provider: "mercadopago", preapprovalId: payload.id };
});

function planFromStripePrice(priceId: string): string | null {
  const entries: Array<[string, string]> = [
    ["starter", String(process.env.STRIPE_PRICE_STARTER ?? "").trim()],
    ["pro", String(process.env.STRIPE_PRICE_PRO ?? "").trim()],
    ["agency", String(process.env.STRIPE_PRICE_AGENCY ?? "").trim()],
    ["enterprise", String(process.env.STRIPE_PRICE_ENTERPRISE ?? "").trim()],
  ];
  for (const [planId, envPrice] of entries) {
    if (envPrice && envPrice === priceId) return planId;
  }
  return null;
}

export const stripeBillingWebhook = onRequest({ cors: false }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const stripe = getStripe();
  const webhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET ?? "").trim();
  let event: Stripe.Event;

  try {
    if (webhookSecret) {
      const signature = req.headers["stripe-signature"];
      if (!signature || Array.isArray(signature)) {
        res.status(400).send("Missing stripe-signature");
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawBody = (req as any).rawBody ?? JSON.stringify(req.body);
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      event = req.body as Stripe.Event;
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
      if (accountId) {
        await applyPlanToAccount(accountId, {
          plan: planId,
          status: "active",
          provider: "stripe",
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
      const priceId = subscription.items.data[0]?.price?.id ?? "";
      const planId = normalizePlanId(
        subscription.metadata?.planId || planFromStripePrice(priceId) || "starter",
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
      };

      if (response.ok && preapproval.external_reference) {
        const [accountId, planFromRef] = String(preapproval.external_reference).split(":");
        const planId = normalizePlanId(planFromRef);
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
