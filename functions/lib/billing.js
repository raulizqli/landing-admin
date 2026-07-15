"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mercadoPagoBillingWebhook = exports.stripeBillingWebhook = exports.createBillingCheckout = exports.setBillingPlanManual = exports.ensureBillingAccount = void 0;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const stripe_1 = __importDefault(require("stripe"));
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
const USERS_COLLECTION = "users";
const BILLING_ACCOUNTS_COLLECTION = "billingAccounts";
const VALID_PLANS = new Set(["starter", "pro", "agency", "enterprise"]);
const PLAN_AMOUNTS_MXN = {
    starter: 349,
    pro: 899,
    agency: 2499,
};
function normalizePlanId(value) {
    const id = String(value !== null && value !== void 0 ? value : "").trim().toLowerCase();
    return VALID_PLANS.has(id) ? id : "starter";
}
function adminPublicUrl() {
    var _a, _b;
    return String((_b = (_a = process.env.ADMIN_PUBLIC_URL) !== null && _a !== void 0 ? _a : process.env.VITE_ADMIN_PUBLIC_URL) !== null && _b !== void 0 ? _b : "http://localhost:5173")
        .trim()
        .replace(/\/$/, "");
}
function getStripe() {
    var _a;
    const key = String((_a = process.env.STRIPE_SECRET_KEY) !== null && _a !== void 0 ? _a : "").trim();
    if (!key) {
        throw new https_1.HttpsError("failed-precondition", "STRIPE_SECRET_KEY no está configurada.");
    }
    return new stripe_1.default(key);
}
function stripePriceIdForPlan(planId) {
    var _a;
    const map = {
        starter: process.env.STRIPE_PRICE_STARTER,
        pro: process.env.STRIPE_PRICE_PRO,
        agency: process.env.STRIPE_PRICE_AGENCY,
        enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
    };
    const priceId = String((_a = map[planId]) !== null && _a !== void 0 ? _a : "").trim();
    if (!priceId) {
        throw new https_1.HttpsError("failed-precondition", `Falta STRIPE_PRICE_${planId.toUpperCase()} en el entorno de Functions.`);
    }
    return priceId;
}
function mercadoPagoToken() {
    var _a;
    const token = String((_a = process.env.MERCADOPAGO_ACCESS_TOKEN) !== null && _a !== void 0 ? _a : "").trim();
    if (!token) {
        throw new https_1.HttpsError("failed-precondition", "MERCADOPAGO_ACCESS_TOKEN no está configurada.");
    }
    return token;
}
async function getCallerProfile(uid) {
    var _a;
    const snap = await (0, firestore_1.getFirestore)().collection(USERS_COLLECTION).doc(uid).get();
    if (!snap.exists) {
        throw new https_1.HttpsError("permission-denied", "Perfil de usuario no encontrado.");
    }
    return Object.assign({ uid }, ((_a = snap.data()) !== null && _a !== void 0 ? _a : {}));
}
async function loadOrCreateAccountForUser(profile) {
    var _a, _b, _c;
    const db = (0, firestore_1.getFirestore)();
    const accountId = String((_a = profile.accountId) !== null && _a !== void 0 ? _a : profile.uid).trim();
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
            mercadoPagoPayerEmail: String((_b = profile.email) !== null && _b !== void 0 ? _b : "").trim().toLowerCase(),
            pageIds: [],
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            createdAt: now,
            updatedAt: now,
        };
        await ref.set(account);
        await db.collection(USERS_COLLECTION).doc(profile.uid).set({ accountId, updatedAt: now }, { merge: true });
        return Object.assign({ id: accountId }, account);
    }
    if (!profile.accountId) {
        await db.collection(USERS_COLLECTION).doc(profile.uid).set({ accountId, updatedAt: now }, { merge: true });
    }
    return Object.assign({ id: accountId }, ((_c = snap.data()) !== null && _c !== void 0 ? _c : {}));
}
async function applyPlanToAccount(accountId, patch) {
    var _a;
    const ref = (0, firestore_1.getFirestore)().collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId);
    await ref.set(Object.assign(Object.assign({}, patch), { updatedAt: new Date().toISOString() }), { merge: true });
    const snap = await ref.get();
    return Object.assign({ id: accountId }, ((_a = snap.data()) !== null && _a !== void 0 ? _a : {}));
}
exports.ensureBillingAccount = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const profile = await getCallerProfile(request.auth.uid);
    const account = await loadOrCreateAccountForUser(profile);
    return { account };
});
exports.setBillingPlanManual = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d, _e, _f;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const profile = await getCallerProfile(request.auth.uid);
    if (profile.role !== "root") {
        throw new https_1.HttpsError("permission-denied", "Solo root puede activar planes manualmente.");
    }
    const accountId = String((_c = (_b = request.data) === null || _b === void 0 ? void 0 : _b.accountId) !== null && _c !== void 0 ? _c : "").trim();
    const planId = normalizePlanId((_d = request.data) === null || _d === void 0 ? void 0 : _d.planId);
    const status = String((_f = (_e = request.data) === null || _e === void 0 ? void 0 : _e.status) !== null && _f !== void 0 ? _f : "active").trim() || "active";
    if (!accountId) {
        throw new https_1.HttpsError("invalid-argument", "accountId es obligatorio.");
    }
    const account = await applyPlanToAccount(accountId, {
        plan: planId,
        status,
        provider: "manual",
    });
    return { account };
});
exports.createBillingCheckout = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const planId = normalizePlanId((_b = request.data) === null || _b === void 0 ? void 0 : _b.planId);
    const provider = String((_d = (_c = request.data) === null || _c === void 0 ? void 0 : _c.provider) !== null && _d !== void 0 ? _d : "").trim().toLowerCase();
    const locale = String((_f = (_e = request.data) === null || _e === void 0 ? void 0 : _e.locale) !== null && _f !== void 0 ? _f : "es").trim().toLowerCase().startsWith("en")
        ? "en"
        : "es";
    const currency = String((_h = (_g = request.data) === null || _g === void 0 ? void 0 : _g.currency) !== null && _h !== void 0 ? _h : "usd").trim().toLowerCase() === "mxn"
        ? "mxn"
        : "usd";
    const successPath = String((_k = (_j = request.data) === null || _j === void 0 ? void 0 : _j.successPath) !== null && _k !== void 0 ? _k : "/?billing=success").trim() || "/?billing=success";
    const cancelPath = String((_m = (_l = request.data) === null || _l === void 0 ? void 0 : _l.cancelPath) !== null && _m !== void 0 ? _m : "/?billing=cancel").trim() || "/?billing=cancel";
    if (provider !== "stripe" && provider !== "mercadopago") {
        throw new https_1.HttpsError("invalid-argument", "provider debe ser stripe o mercadopago.");
    }
    if (planId === "enterprise") {
        throw new https_1.HttpsError("failed-precondition", "Enterprise se activa con ventas o manualmente por root.");
    }
    const profile = await getCallerProfile(request.auth.uid);
    const account = await loadOrCreateAccountForUser(profile);
    const base = adminPublicUrl();
    const successUrl = `${base}${successPath.startsWith("/") ? successPath : `/${successPath}`}`;
    const cancelUrl = `${base}${cancelPath.startsWith("/") ? cancelPath : `/${cancelPath}`}`;
    if (provider === "stripe") {
        const stripe = getStripe();
        let customerId = String((_o = account.stripeCustomerId) !== null && _o !== void 0 ? _o : "").trim();
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: String((_q = (_p = profile.email) !== null && _p !== void 0 ? _p : request.auth.token.email) !== null && _q !== void 0 ? _q : "").trim() || undefined,
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
        throw new https_1.HttpsError("invalid-argument", "Plan sin precio MXN para Mercado Pago.");
    }
    const payerEmail = String(account.mercadoPagoPayerEmail
        || profile.email
        || request.auth.token.email
        || "").trim().toLowerCase();
    if (!payerEmail) {
        throw new https_1.HttpsError("failed-precondition", "Necesitamos el email del pagador para Mercado Pago.");
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
    const payload = await response.json();
    if (!response.ok) {
        throw new https_1.HttpsError("internal", `Mercado Pago: ${(payload === null || payload === void 0 ? void 0 : payload.message) || response.statusText || response.status}`);
    }
    const url = payload.init_point || payload.sandbox_init_point;
    if (!url) {
        throw new https_1.HttpsError("internal", "Mercado Pago no devolvió init_point.");
    }
    await applyPlanToAccount(account.id, {
        provider: "mercadopago",
        currency: "mxn",
        plan: planId,
        status: "incomplete",
        mercadoPagoPreapprovalId: String((_r = payload.id) !== null && _r !== void 0 ? _r : ""),
        mercadoPagoPayerEmail: payerEmail,
    });
    return { url, provider: "mercadopago", preapprovalId: payload.id };
});
function planFromStripePrice(priceId) {
    var _a, _b, _c, _d;
    const entries = [
        ["starter", String((_a = process.env.STRIPE_PRICE_STARTER) !== null && _a !== void 0 ? _a : "").trim()],
        ["pro", String((_b = process.env.STRIPE_PRICE_PRO) !== null && _b !== void 0 ? _b : "").trim()],
        ["agency", String((_c = process.env.STRIPE_PRICE_AGENCY) !== null && _c !== void 0 ? _c : "").trim()],
        ["enterprise", String((_d = process.env.STRIPE_PRICE_ENTERPRISE) !== null && _d !== void 0 ? _d : "").trim()],
    ];
    for (const [planId, envPrice] of entries) {
        if (envPrice && envPrice === priceId)
            return planId;
    }
    return null;
}
exports.stripeBillingWebhook = (0, https_1.onRequest)({ cors: false }, async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    if (req.method !== "POST") {
        res.status(405).send("Method not allowed");
        return;
    }
    const stripe = getStripe();
    const webhookSecret = String((_a = process.env.STRIPE_WEBHOOK_SECRET) !== null && _a !== void 0 ? _a : "").trim();
    let event;
    try {
        if (webhookSecret) {
            const signature = req.headers["stripe-signature"];
            if (!signature || Array.isArray(signature)) {
                res.status(400).send("Missing stripe-signature");
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rawBody = (_b = req.rawBody) !== null && _b !== void 0 ? _b : JSON.stringify(req.body);
            event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        }
        else {
            event = req.body;
        }
    }
    catch (error) {
        console.error("Stripe webhook signature error", error);
        res.status(400).send("Invalid signature");
        return;
    }
    try {
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const accountId = String(session.client_reference_id || ((_c = session.metadata) === null || _c === void 0 ? void 0 : _c.accountId) || "").trim();
            const planId = normalizePlanId((_d = session.metadata) === null || _d === void 0 ? void 0 : _d.planId);
            if (accountId) {
                await applyPlanToAccount(accountId, {
                    plan: planId,
                    status: "active",
                    provider: "stripe",
                    stripeCustomerId: String((_e = session.customer) !== null && _e !== void 0 ? _e : ""),
                    stripeSubscriptionId: String((_f = session.subscription) !== null && _f !== void 0 ? _f : ""),
                });
            }
        }
        if (event.type === "customer.subscription.updated"
            || event.type === "customer.subscription.deleted") {
            const subscription = event.data.object;
            const accountId = String((_h = (_g = subscription.metadata) === null || _g === void 0 ? void 0 : _g.accountId) !== null && _h !== void 0 ? _h : "").trim();
            const priceId = (_l = (_k = (_j = subscription.items.data[0]) === null || _j === void 0 ? void 0 : _j.price) === null || _k === void 0 ? void 0 : _k.id) !== null && _l !== void 0 ? _l : "";
            const planId = normalizePlanId(((_m = subscription.metadata) === null || _m === void 0 ? void 0 : _m.planId) || planFromStripePrice(priceId) || "starter");
            const statusMap = {
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
                const periodEnd = subscription.current_period_end;
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
    }
    catch (error) {
        console.error("Stripe webhook handler error", error);
        res.status(500).send("Webhook handler failed");
    }
});
exports.mercadoPagoBillingWebhook = (0, https_1.onRequest)({ cors: false }, async (req, res) => {
    var _a, _b, _c, _d, _e;
    if (req.method !== "POST" && req.method !== "GET") {
        res.status(405).send("Method not allowed");
        return;
    }
    try {
        const type = String(req.query.type || ((_a = req.body) === null || _a === void 0 ? void 0 : _a.type) || "").trim();
        const dataId = String(req.query["data.id"] || ((_c = (_b = req.body) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.id) || req.query.id || "").trim();
        if (type.includes("preapproval") && dataId) {
            const response = await fetch(`https://api.mercadopago.com/preapproval/${dataId}`, {
                headers: { Authorization: `Bearer ${mercadoPagoToken()}` },
            });
            const preapproval = await response.json();
            if (response.ok && preapproval.external_reference) {
                const [accountId, planFromRef] = String(preapproval.external_reference).split(":");
                const planId = normalizePlanId(planFromRef);
                const statusRaw = String((_d = preapproval.status) !== null && _d !== void 0 ? _d : "").toLowerCase();
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
                        mercadoPagoPreapprovalId: String((_e = preapproval.id) !== null && _e !== void 0 ? _e : dataId),
                    });
                }
            }
        }
        // Acknowledge always so MP doesn't retry forever on non-actionable topics
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error("Mercado Pago webhook error", error);
        res.status(500).json({ error: "handler_failed" });
    }
});
//# sourceMappingURL=billing.js.map