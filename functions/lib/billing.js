"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mercadoPagoBillingWebhook = exports.stripeBillingWebhook = exports.createBillingCheckout = exports.setBillingPlanManual = exports.ensureBillingAccount = void 0;
const node_crypto_1 = require("node:crypto");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const stripe_1 = __importDefault(require("stripe"));
const siteAccessSync_js_1 = require("./siteAccessSync.js");
const callableOptions_js_1 = require("./callableOptions.js");
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
const USERS_COLLECTION = "users";
const BILLING_ACCOUNTS_COLLECTION = "billingAccounts";
const callableOptions = (0, callableOptions_js_1.sensitiveCallableOptions)();
const VALID_PLANS = new Set(["starter", "pro", "agency", "enterprise"]);
const PLAN_AMOUNTS_MXN = {
    starter: 189,
    pro: 469,
    agency: 1399,
};
/** Keep in sync with BILLING_ANNUAL_DISCOUNT in packages/landing-core/src/billingPlans.js */
const BILLING_ANNUAL_DISCOUNT = 0.2;
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
function normalizeInterval(value) {
    return String(value !== null && value !== void 0 ? value : "").trim().toLowerCase() === "year" ? "year" : "month";
}
function yearlyAmountFromMonthly(monthly) {
    return Math.round(monthly * 12 * (1 - BILLING_ANNUAL_DISCOUNT));
}
function mercadoPagoAmountMxn(planId, interval) {
    const monthly = PLAN_AMOUNTS_MXN[planId];
    if (!monthly)
        return undefined;
    return interval === "year" ? yearlyAmountFromMonthly(monthly) : monthly;
}
function stripePriceEnvCandidates(planId, currency = "usd", interval = "month") {
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
function stripePriceIdForPlan(planId, currency = "usd", interval = "month") {
    var _a;
    for (const envKey of stripePriceEnvCandidates(planId, currency, interval)) {
        const priceId = String((_a = process.env[envKey]) !== null && _a !== void 0 ? _a : "").trim();
        if (priceId)
            return priceId;
    }
    if (interval === "year") {
        throw new https_1.HttpsError("failed-precondition", `Falta STRIPE_PRICE_${planId.toUpperCase()}_${currency.toUpperCase()}_YEARLY en Functions.`);
    }
    throw new https_1.HttpsError("failed-precondition", `Falta STRIPE_PRICE_${planId.toUpperCase()}_${currency.toUpperCase()} (o STRIPE_PRICE_${planId.toUpperCase()}) en Functions.`);
}
function allConfiguredStripePriceIds() {
    var _a;
    const plans = ["starter", "pro", "agency", "enterprise"];
    const currencies = ["usd", "mxn"];
    const intervals = ["month", "year"];
    const entries = [];
    for (const planId of plans) {
        for (const currency of currencies) {
            for (const interval of intervals) {
                for (const envKey of stripePriceEnvCandidates(planId, currency, interval)) {
                    const priceId = String((_a = process.env[envKey]) !== null && _a !== void 0 ? _a : "").trim();
                    if (priceId)
                        entries.push({ planId, priceId, interval });
                }
            }
        }
    }
    return entries;
}
function mercadoPagoToken() {
    var _a;
    const token = String((_a = process.env.MERCADOPAGO_ACCESS_TOKEN) !== null && _a !== void 0 ? _a : "").trim();
    if (!token) {
        throw new https_1.HttpsError("failed-precondition", "MERCADOPAGO_ACCESS_TOKEN no está configurada.");
    }
    return token;
}
function headerValue(req, name) {
    var _a, _b;
    const raw = (_a = req.headers[name]) !== null && _a !== void 0 ? _a : req.headers[name.toLowerCase()];
    if (Array.isArray(raw))
        return String((_b = raw[0]) !== null && _b !== void 0 ? _b : "").trim();
    return String(raw !== null && raw !== void 0 ? raw : "").trim();
}
/**
 * Mercado Pago Webhooks signature (HMAC-SHA256).
 * Manifest: id:{data.id};request-id:{x-request-id};ts:{ts}; (omit missing parts).
 * Fail closed outside the emulator when MERCADOPAGO_WEBHOOK_SECRET is unset (F06).
 */
function assertMercadoPagoWebhookSignature(req) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const secret = String((_b = (_a = process.env.MERCADOPAGO_WEBHOOK_SECRET) !== null && _a !== void 0 ? _a : process.env.MERCADOPAGO_ACCESS_WEBHOOK_TOKEN) !== null && _b !== void 0 ? _b : "").trim();
    const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
    if (!secret) {
        if (isEmulator)
            return;
        throw new Error("MERCADOPAGO_WEBHOOK_SECRET is not configured");
    }
    const xSignature = headerValue(req, "x-signature");
    const xRequestId = headerValue(req, "x-request-id");
    if (!xSignature) {
        throw new Error("Missing x-signature");
    }
    const parts = Object.fromEntries(xSignature.split(",").map((part) => {
        const [key, ...rest] = part.trim().split("=");
        return [String(key || "").trim(), rest.join("=").trim()];
    }));
    const ts = String((_c = parts.ts) !== null && _c !== void 0 ? _c : "").trim();
    const v1 = String((_d = parts.v1) !== null && _d !== void 0 ? _d : "").trim();
    if (!ts || !v1) {
        throw new Error("Invalid x-signature format");
    }
    let dataId = String((_j = (_h = (_e = req.query["data.id"]) !== null && _e !== void 0 ? _e : (_g = (_f = req.body) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.id) !== null && _h !== void 0 ? _h : req.query.id) !== null && _j !== void 0 ? _j : "").trim();
    if (dataId && /^[a-zA-Z0-9]+$/.test(dataId)) {
        dataId = dataId.toLowerCase();
    }
    let manifest = "";
    if (dataId)
        manifest += `id:${dataId};`;
    if (xRequestId)
        manifest += `request-id:${xRequestId};`;
    manifest += `ts:${ts};`;
    const expected = (0, node_crypto_1.createHmac)("sha256", secret).update(manifest).digest("hex");
    const expectedBuf = Buffer.from(expected, "utf8");
    const providedBuf = Buffer.from(v1, "utf8");
    if (expectedBuf.length !== providedBuf.length
        || !(0, node_crypto_1.timingSafeEqual)(expectedBuf, providedBuf)) {
        throw new Error("Invalid Mercado Pago webhook signature");
    }
}
async function getCallerProfile(uid) {
    var _a;
    const snap = await (0, firestore_1.getFirestore)().collection(USERS_COLLECTION).doc(uid).get();
    if (!snap.exists) {
        throw new https_1.HttpsError("permission-denied", "Perfil de usuario no encontrado.");
    }
    return Object.assign({ uid }, ((_a = snap.data()) !== null && _a !== void 0 ? _a : {}));
}
function normalizePageIdList(values) {
    if (!Array.isArray(values))
        return [];
    return [...new Set(values.map((value) => String(value !== null && value !== void 0 ? value : "").trim()).filter(Boolean))];
}
function pageIdsFromProfile(profile) {
    var _a;
    const fromList = normalizePageIdList(profile.assignedPageIds);
    const single = String((_a = profile.pageId) !== null && _a !== void 0 ? _a : "").trim();
    return normalizePageIdList([...fromList, single]);
}
async function loadOrCreateAccountForUser(profile) {
    var _a, _b, _c;
    const db = (0, firestore_1.getFirestore)();
    const accountId = String((_a = profile.accountId) !== null && _a !== void 0 ? _a : profile.uid).trim();
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
            mercadoPagoPayerEmail: String((_b = profile.email) !== null && _b !== void 0 ? _b : "").trim().toLowerCase(),
            pageIds: profilePageIds,
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
    const data = (_c = snap.data()) !== null && _c !== void 0 ? _c : {};
    const existingPageIds = normalizePageIdList(data.pageIds);
    const mergedPageIds = normalizePageIdList([...existingPageIds, ...profilePageIds]);
    const needsPageSync = mergedPageIds.length !== existingPageIds.length
        || mergedPageIds.some((id) => !existingPageIds.includes(id));
    if (needsPageSync) {
        await ref.set({
            pageIds: mergedPageIds,
            updatedAt: now,
        }, { merge: true });
        return Object.assign(Object.assign({ id: accountId }, data), { pageIds: mergedPageIds, updatedAt: now });
    }
    return Object.assign({ id: accountId }, data);
}
async function applyPlanToAccount(accountId, patch) {
    return (0, siteAccessSync_js_1.applyBillingPatchWithSiteAccess)(accountId, patch);
}
exports.ensureBillingAccount = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const profile = await getCallerProfile(request.auth.uid);
    const account = await loadOrCreateAccountForUser(profile);
    return { account };
});
exports.setBillingPlanManual = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const profile = await getCallerProfile(request.auth.uid);
    if (profile.role !== "root") {
        throw new https_1.HttpsError("permission-denied", "Solo root puede activar planes manualmente.");
    }
    const targetUid = String((_c = (_b = request.data) === null || _b === void 0 ? void 0 : _b.uid) !== null && _c !== void 0 ? _c : "").trim();
    let accountId = String((_e = (_d = request.data) === null || _d === void 0 ? void 0 : _d.accountId) !== null && _e !== void 0 ? _e : "").trim();
    const planId = normalizePlanId((_f = request.data) === null || _f === void 0 ? void 0 : _f.planId);
    const status = String((_h = (_g = request.data) === null || _g === void 0 ? void 0 : _g.status) !== null && _h !== void 0 ? _h : "active").trim() || "active";
    if (targetUid) {
        const targetProfile = await getCallerProfile(targetUid);
        const ensured = await loadOrCreateAccountForUser(targetProfile);
        accountId = ensured.id;
    }
    else if (accountId) {
        const db = (0, firestore_1.getFirestore)();
        const existing = await db.collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId).get();
        if (!existing.exists) {
            // Common case: accountId defaults to the owner's Firebase uid.
            try {
                const ownerProfile = await getCallerProfile(accountId);
                const ensured = await loadOrCreateAccountForUser(ownerProfile);
                accountId = ensured.id;
            }
            catch (error) {
                if (error instanceof https_1.HttpsError && error.code === "permission-denied") {
                    throw new https_1.HttpsError("not-found", `No existe billingAccounts/${accountId} ni un usuario con ese uid.`);
                }
                throw error;
            }
        }
    }
    else {
        throw new https_1.HttpsError("invalid-argument", "accountId o uid es obligatorio.");
    }
    const account = await applyPlanToAccount(accountId, {
        plan: planId,
        status,
        provider: "manual",
    });
    return { account };
});
exports.createBillingCheckout = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
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
    const interval = normalizeInterval((_j = request.data) === null || _j === void 0 ? void 0 : _j.interval);
    const successPath = String((_l = (_k = request.data) === null || _k === void 0 ? void 0 : _k.successPath) !== null && _l !== void 0 ? _l : "/?billing=success").trim() || "/?billing=success";
    const cancelPath = String((_o = (_m = request.data) === null || _m === void 0 ? void 0 : _m.cancelPath) !== null && _o !== void 0 ? _o : "/?billing=cancel").trim() || "/?billing=cancel";
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
        let customerId = String((_p = account.stripeCustomerId) !== null && _p !== void 0 ? _p : "").trim();
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: String((_r = (_q = profile.email) !== null && _q !== void 0 ? _q : request.auth.token.email) !== null && _r !== void 0 ? _r : "").trim() || undefined,
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
        billingInterval: interval,
        plan: planId,
        status: "incomplete",
        mercadoPagoPreapprovalId: String((_s = payload.id) !== null && _s !== void 0 ? _s : ""),
        mercadoPagoPayerEmail: payerEmail,
    });
    return { url, provider: "mercadopago", preapprovalId: payload.id };
});
function planFromStripePrice(priceId) {
    for (const entry of allConfiguredStripePriceIds()) {
        if (entry.priceId === priceId)
            return { planId: entry.planId, interval: entry.interval };
    }
    return null;
}
function intervalFromStripePrice(price) {
    var _a;
    if (!price || typeof price === "string")
        return null;
    const recurring = (_a = price.recurring) === null || _a === void 0 ? void 0 : _a.interval;
    if (recurring === "year")
        return "year";
    if (recurring === "month")
        return "month";
    return null;
}
exports.stripeBillingWebhook = (0, https_1.onRequest)({ cors: false }, async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    if (req.method !== "POST") {
        res.status(405).send("Method not allowed");
        return;
    }
    const stripe = getStripe();
    const webhookSecret = String((_a = process.env.STRIPE_WEBHOOK_SECRET) !== null && _a !== void 0 ? _a : "").trim();
    const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
    let event;
    try {
        if (!webhookSecret) {
            // Fail closed outside the emulator (F05): unsigned events must never mutate billing.
            if (!isEmulator) {
                console.error("Stripe webhook rejected: STRIPE_WEBHOOK_SECRET is not configured");
                res.status(500).send("Webhook secret not configured");
                return;
            }
            event = req.body;
        }
        else {
            const signature = req.headers["stripe-signature"];
            if (!signature || Array.isArray(signature)) {
                res.status(400).send("Missing stripe-signature");
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rawBody = (_b = req.rawBody) !== null && _b !== void 0 ? _b : JSON.stringify(req.body);
            event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
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
            const interval = normalizeInterval((_e = session.metadata) === null || _e === void 0 ? void 0 : _e.interval);
            if (accountId) {
                await applyPlanToAccount(accountId, {
                    plan: planId,
                    status: "active",
                    provider: "stripe",
                    billingInterval: interval,
                    stripeCustomerId: String((_f = session.customer) !== null && _f !== void 0 ? _f : ""),
                    stripeSubscriptionId: String((_g = session.subscription) !== null && _g !== void 0 ? _g : ""),
                });
            }
        }
        if (event.type === "customer.subscription.updated"
            || event.type === "customer.subscription.deleted") {
            const subscription = event.data.object;
            const accountId = String((_j = (_h = subscription.metadata) === null || _h === void 0 ? void 0 : _h.accountId) !== null && _j !== void 0 ? _j : "").trim();
            const price = (_k = subscription.items.data[0]) === null || _k === void 0 ? void 0 : _k.price;
            const priceId = typeof price === "string" ? price : (_l = price === null || price === void 0 ? void 0 : price.id) !== null && _l !== void 0 ? _l : "";
            const fromPrice = planFromStripePrice(priceId);
            const planId = normalizePlanId(((_m = subscription.metadata) === null || _m === void 0 ? void 0 : _m.planId) || (fromPrice === null || fromPrice === void 0 ? void 0 : fromPrice.planId) || "starter");
            const interval = normalizeInterval(((_o = subscription.metadata) === null || _o === void 0 ? void 0 : _o.interval)
                || (fromPrice === null || fromPrice === void 0 ? void 0 : fromPrice.interval)
                || intervalFromStripePrice(price)
                || "month");
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
    }
    catch (error) {
        console.error("Stripe webhook handler error", error);
        res.status(500).send("Webhook handler failed");
    }
});
exports.mercadoPagoBillingWebhook = (0, https_1.onRequest)({ cors: false }, async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (req.method !== "POST" && req.method !== "GET") {
        res.status(405).send("Method not allowed");
        return;
    }
    try {
        assertMercadoPagoWebhookSignature(req);
    }
    catch (error) {
        console.error("Mercado Pago webhook signature error", error);
        res.status(401).send("Invalid signature");
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
                const [accountId, planFromRef, intervalFromRef] = String(preapproval.external_reference).split(":");
                const planId = normalizePlanId(planFromRef);
                const fromRecurring = ((_d = preapproval.auto_recurring) === null || _d === void 0 ? void 0 : _d.frequency) === 12
                    && String((_f = (_e = preapproval.auto_recurring) === null || _e === void 0 ? void 0 : _e.frequency_type) !== null && _f !== void 0 ? _f : "").toLowerCase() === "months"
                    ? "year"
                    : "month";
                const interval = normalizeInterval(intervalFromRef || fromRecurring);
                const statusRaw = String((_g = preapproval.status) !== null && _g !== void 0 ? _g : "").toLowerCase();
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
                        mercadoPagoPreapprovalId: String((_h = preapproval.id) !== null && _h !== void 0 ? _h : dataId),
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