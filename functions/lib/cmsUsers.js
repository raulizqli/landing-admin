"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectCmsAccess = exports.approveCmsAccess = exports.requestCmsAccess = exports.deleteCmsUser = exports.updateCmsUser = exports.listCmsUsers = exports.requestPasswordResetEmail = exports.generateCmsUserInvitation = exports.createCmsUser = void 0;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const callableOptions_js_1 = require("./callableOptions.js");
const approvalEmail_js_1 = require("./approvalEmail.js");
const contactValidation_js_1 = require("./contactValidation.js");
(0, app_1.initializeApp)();
const USERS_COLLECTION = "users";
const BILLING_ACCOUNTS_COLLECTION = "billingAccounts";
const VALID_ROLES = new Set(["root", "admin", "user"]);
const VALID_PLANS = new Set(["starter", "pro", "agency", "enterprise"]);
function normalizeRole(role) {
    const value = String(role !== null && role !== void 0 ? role : "").trim().toLowerCase();
    return VALID_ROLES.has(value) ? value : null;
}
function normalizePageIdList(values) {
    if (!Array.isArray(values))
        return [];
    return [...new Set(values.map((value) => String(value !== null && value !== void 0 ? value : "").trim()).filter(Boolean))];
}
function normalizePlanId(value) {
    const plan = String(value !== null && value !== void 0 ? value : "").trim().toLowerCase();
    return VALID_PLANS.has(plan) ? plan : "starter";
}
function getAuthErrorCode(error) {
    var _a;
    const err = error;
    return String(((_a = err === null || err === void 0 ? void 0 : err.errorInfo) === null || _a === void 0 ? void 0 : _a.code) || (err === null || err === void 0 ? void 0 : err.code) || "").trim();
}
function toMillis(value) {
    if (!value)
        return 0;
    if (typeof value === "object" && value !== null && typeof value.toMillis === "function") {
        return value.toMillis();
    }
    if (typeof value === "string" || typeof value === "number") {
        const parsed = new Date(value).getTime();
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
}
function pageIdsFromProfile(data) {
    var _a;
    const fromList = normalizePageIdList(data.assignedPageIds);
    const single = String((_a = data.pageId) !== null && _a !== void 0 ? _a : "").trim();
    return normalizePageIdList([...fromList, ...(single ? [single] : [])]);
}
function buildUserProfileData(payload = {}, { requireEmail = true } = {}) {
    var _a, _b, _c;
    const role = normalizeRole(payload.role);
    if (!role) {
        throw new https_1.HttpsError("invalid-argument", "Selecciona un rol válido.");
    }
    const email = String((_a = payload.email) !== null && _a !== void 0 ? _a : "").trim().toLowerCase();
    if (requireEmail && !email) {
        throw new https_1.HttpsError("invalid-argument", "El email es obligatorio.");
    }
    const assignedPageIds = normalizePageIdList(payload.assignedPageIds);
    const pageId = String((_b = payload.pageId) !== null && _b !== void 0 ? _b : "").trim();
    if (role === "admin" && assignedPageIds.length === 0) {
        throw new https_1.HttpsError("invalid-argument", "Un admin debe tener al menos una página asignada.");
    }
    if (role === "user" && !pageId) {
        throw new https_1.HttpsError("invalid-argument", "Un usuario regular debe tener una página asignada.");
    }
    const data = {
        displayName: String((_c = payload.displayName) !== null && _c !== void 0 ? _c : "").trim(),
        role,
        assignedPageIds: role === "admin" ? assignedPageIds : [],
        pageId: role === "user" ? pageId : "",
        // Root accounts cannot be demo users.
        isDemo: role === "root" ? false : payload.isDemo === true,
        updatedAt: new Date().toISOString(),
    };
    if (email)
        data.email = email;
    return data;
}
async function assertRootCaller(request) {
    var _a, _b;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const callerDoc = await (0, firestore_1.getFirestore)()
        .collection(USERS_COLLECTION)
        .doc(request.auth.uid)
        .get();
    if (!callerDoc.exists || ((_b = callerDoc.data()) === null || _b === void 0 ? void 0 : _b.role) !== "root") {
        throw new https_1.HttpsError("permission-denied", "Solo un usuario root puede gestionar cuentas.");
    }
    return request.auth.uid;
}
const callableOptions = (0, callableOptions_js_1.sensitiveCallableOptions)();
/** Public self-registration from /login (App Check not available before sign-in). */
const publicRegistrationOptions = (0, callableOptions_js_1.sensitiveCallableOptions)({ enforceAppCheck: false });
function getAdminPublicUrl() {
    var _a;
    return String((_a = process.env.ADMIN_PUBLIC_URL) !== null && _a !== void 0 ? _a : "http://localhost:5173").trim().replace(/\/+$/, "");
}
function getFirebaseProjectId() {
    const fromEnv = String(process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || "").trim();
    if (fromEnv)
        return fromEnv;
    try {
        const config = JSON.parse(String(process.env.FIREBASE_CONFIG || "{}"));
        return String(config.projectId || "").trim();
    }
    catch (_a) {
        return "";
    }
}
function buildLoginContinueUrl(base, email) {
    const loginUrl = new URL("/login", base.endsWith("/") ? base : `${base}/`);
    loginUrl.searchParams.set("email", email);
    return loginUrl.toString();
}
function getAuthLinkDomain() {
    var _a;
    const explicit = String((_a = process.env.AUTH_LINK_DOMAIN) !== null && _a !== void 0 ? _a : "").trim();
    if (!explicit)
        return null;
    return explicit.replace(/^https?:\/\//, "").split("/")[0].toLowerCase() || null;
}
/**
 * Continue URLs for password-reset invitation links.
 * Domains must be in Firebase Auth → Authorized domains.
 *
 * The returned link host is still landing-admin-9452e.firebaseapp.com unless
 * AUTH_LINK_DOMAIN is set and verified under Auth → Templates → Customize domain.
 */
function invitationContinueUrlCandidates(email) {
    const candidates = [];
    const primary = getAdminPublicUrl();
    if (primary)
        candidates.push(buildLoginContinueUrl(primary, email));
    const projectId = getFirebaseProjectId();
    if (projectId) {
        candidates.push(buildLoginContinueUrl(`https://${projectId}.web.app`, email));
        candidates.push(buildLoginContinueUrl(`https://${projectId}.firebaseapp.com`, email));
    }
    // Deduplicate while preserving order.
    return [...new Set(candidates)];
}
async function generateInvitationLink(email) {
    const auth = (0, auth_1.getAuth)();
    const continueUrls = invitationContinueUrlCandidates(email);
    const linkDomain = getAuthLinkDomain();
    const errors = [];
    for (const url of continueUrls) {
        const settingsVariants = linkDomain
            ? [
                { url, handleCodeInApp: false, linkDomain },
                { url, handleCodeInApp: false },
            ]
            : [{ url, handleCodeInApp: false }];
        for (const settings of settingsVariants) {
            try {
                return await auth.generatePasswordResetLink(email, settings);
            }
            catch (error) {
                const code = getAuthErrorCode(error);
                const label = settings.linkDomain
                    ? `${url} + linkDomain=${settings.linkDomain}`
                    : url;
                console.error("generateCmsUserInvitation attempt failed:", code || "unknown", label, error);
                errors.push(`${code || "unknown"} @ ${label}`);
            }
        }
    }
    // Last resort: Firebase default action handler (no custom continue URL).
    try {
        return await auth.generatePasswordResetLink(email);
    }
    catch (error) {
        const code = getAuthErrorCode(error);
        console.error("generateCmsUserInvitation default link failed:", code || "unknown", error);
        errors.push(`${code || "unknown"} @ default`);
        throw new https_1.HttpsError("internal", `No se pudo generar el enlace de invitación (${errors[0] || code || "unknown"}). `
            + "Añade el dominio de ADMIN_PUBLIC_URL en Authentication → Authorized domains.");
    }
}
async function resolveBillingSummary(db, uid, accountId, profilePageIds) {
    var _a, _b;
    const candidates = [accountId, uid].filter(Boolean);
    let plan = "starter";
    let planStatus = "incomplete";
    let billingPageIds = [];
    for (const id of candidates) {
        const snap = await db.collection(BILLING_ACCOUNTS_COLLECTION).doc(id).get();
        if (!snap.exists)
            continue;
        const data = (_a = snap.data()) !== null && _a !== void 0 ? _a : {};
        plan = normalizePlanId(data.plan);
        planStatus = String((_b = data.status) !== null && _b !== void 0 ? _b : "incomplete").trim().toLowerCase() || "incomplete";
        billingPageIds = normalizePageIdList(data.pageIds);
        break;
    }
    const pageCount = [...new Set([...billingPageIds, ...profilePageIds])].length;
    const freeTier = !["active", "trialing"].includes(planStatus);
    return {
        plan,
        planStatus,
        pageCount,
        subscriptionLabel: freeTier ? `Free (${plan})` : plan,
    };
}
exports.createCmsUser = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c, _d, _e;
    await assertRootCaller(request);
    const profileData = buildUserProfileData((_a = request.data) !== null && _a !== void 0 ? _a : {});
    const auth = (0, auth_1.getAuth)();
    const db = (0, firestore_1.getFirestore)();
    let userRecord;
    try {
        // No temporary password: the user sets one via the invitation reset link.
        // Avoids auth/invalid-password when password policies or empty values intervene.
        userRecord = await auth.createUser({
            email: String(profileData.email),
            displayName: String(profileData.displayName || "") || undefined,
            emailVerified: false,
            disabled: false,
        });
    }
    catch (error) {
        const code = getAuthErrorCode(error);
        if (code === "auth/email-already-exists") {
            throw new https_1.HttpsError("already-exists", "Ya existe un usuario con ese email.");
        }
        if (code === "auth/invalid-email") {
            throw new https_1.HttpsError("invalid-argument", "El email no es válido.");
        }
        if (code === "auth/invalid-password") {
            throw new https_1.HttpsError("invalid-argument", "No se pudo crear la cuenta (política de contraseña). Intenta de nuevo o revisa Authentication.");
        }
        console.error("createCmsUser auth error:", code || "unknown", error);
        throw new https_1.HttpsError("internal", "No se pudo crear el usuario en Authentication.");
    }
    try {
        await db.collection(USERS_COLLECTION).doc(userRecord.uid).set(Object.assign(Object.assign({}, profileData), { approvalStatus: "approved", phone: String((_c = (_b = request.data) === null || _b === void 0 ? void 0 : _b.phone) !== null && _c !== void 0 ? _c : "").trim(), createdAt: firestore_1.FieldValue.serverTimestamp() }));
    }
    catch (error) {
        try {
            await auth.deleteUser(userRecord.uid);
        }
        catch (rollbackError) {
            console.error("createCmsUser rollback error:", rollbackError);
        }
        console.error("createCmsUser firestore error:", error);
        throw new https_1.HttpsError("internal", "No se pudo guardar el perfil de acceso.");
    }
    let invitationLink = null;
    let invitationError = null;
    let invitationEmailSent = false;
    let invitationEmailReason = null;
    if (((_d = request.data) === null || _d === void 0 ? void 0 : _d.createInvitation) === true) {
        try {
            invitationLink = await generateInvitationLink(String(profileData.email));
            const emailResult = await (0, approvalEmail_js_1.sendInvitationEmail)({
                to: String(profileData.email),
                invitationLink,
                displayName: String(profileData.displayName || ""),
            });
            invitationEmailSent = emailResult.sent === true;
            invitationEmailReason = (_e = emailResult.reason) !== null && _e !== void 0 ? _e : null;
        }
        catch (error) {
            invitationError = error instanceof https_1.HttpsError
                ? error.message
                : "No se pudo generar el enlace de invitación.";
            console.error("createCmsUser invitation skipped:", invitationError);
        }
    }
    return {
        uid: userRecord.uid,
        email: profileData.email,
        role: profileData.role,
        invitationLink,
        invitationError,
        invitationEmailSent,
        invitationEmailReason,
    };
});
exports.generateCmsUserInvitation = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c, _d, _e;
    await assertRootCaller(request);
    const uid = String((_b = (_a = request.data) === null || _a === void 0 ? void 0 : _a.uid) !== null && _b !== void 0 ? _b : "").trim();
    if (!uid) {
        throw new https_1.HttpsError("invalid-argument", "El UID es obligatorio.");
    }
    let userRecord;
    try {
        userRecord = await (0, auth_1.getAuth)().getUser(uid);
    }
    catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) === "auth/user-not-found") {
            throw new https_1.HttpsError("not-found", "El usuario no existe en Authentication.");
        }
        throw new https_1.HttpsError("internal", "No se pudo consultar el usuario.");
    }
    if (!userRecord.email) {
        throw new https_1.HttpsError("failed-precondition", "El usuario no tiene un email asociado.");
    }
    const invitationLink = await generateInvitationLink(userRecord.email);
    const emailResult = await (0, approvalEmail_js_1.sendInvitationEmail)({
        to: userRecord.email,
        invitationLink,
        displayName: (_c = userRecord.displayName) !== null && _c !== void 0 ? _c : "",
    });
    return {
        uid,
        email: userRecord.email,
        displayName: (_d = userRecord.displayName) !== null && _d !== void 0 ? _d : "",
        invitationLink,
        emailSent: emailResult.sent === true,
        emailReason: (_e = emailResult.reason) !== null && _e !== void 0 ? _e : null,
    };
});
/**
 * Public password reset: generates Admin SDK link and sends via Resend.
 * Always returns success to avoid email enumeration.
 */
exports.requestPasswordResetEmail = (0, https_1.onCall)(publicRegistrationOptions, async (request) => {
    var _a, _b;
    const email = (0, contactValidation_js_1.normalizeEmail)((_a = request.data) === null || _a === void 0 ? void 0 : _a.email);
    if (!(0, contactValidation_js_1.isValidEmail)(email)) {
        throw new https_1.HttpsError("invalid-argument", "El email no es válido.");
    }
    try {
        const userRecord = await (0, auth_1.getAuth)().getUserByEmail(email);
        const resetLink = await generateInvitationLink(email);
        const emailResult = await (0, approvalEmail_js_1.sendPasswordResetEmail)({
            to: email,
            resetLink,
            displayName: (_b = userRecord.displayName) !== null && _b !== void 0 ? _b : "",
        });
        if (emailResult.sent !== true) {
            console.error("requestPasswordResetEmail: link generated but email not sent:", emailResult.reason);
        }
    }
    catch (error) {
        const code = getAuthErrorCode(error);
        if (code === "auth/user-not-found") {
            // Enumeration protection: pretend success.
            return { ok: true };
        }
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        console.error("requestPasswordResetEmail error:", code || "unknown", error);
        throw new https_1.HttpsError("internal", "No se pudo enviar el correo de recuperación.");
    }
    return { ok: true };
});
function resolvePasswordStatus(userRecord) {
    const hasPasswordProvider = (userRecord.providerData || []).some((provider) => provider.providerId === "password");
    if (hasPasswordProvider || Boolean(userRecord.passwordHash)) {
        return "confirmed";
    }
    return "pending";
}
exports.listCmsUsers = (0, https_1.onCall)(callableOptions, async (request) => {
    await assertRootCaller(request);
    const db = (0, firestore_1.getFirestore)();
    const auth = (0, auth_1.getAuth)();
    const snapshot = await db.collection(USERS_COLLECTION).get();
    const users = await Promise.all(snapshot.docs.map(async (userDoc) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        const data = (_a = userDoc.data()) !== null && _a !== void 0 ? _a : {};
        const uid = userDoc.id;
        let passwordStatus = "unknown";
        let disabled = false;
        let lastSignInAt = null;
        try {
            const authUser = await auth.getUser(uid);
            passwordStatus = resolvePasswordStatus(authUser);
            disabled = authUser.disabled === true;
            lastSignInAt = ((_b = authUser.metadata) === null || _b === void 0 ? void 0 : _b.lastSignInTime)
                ? new Date(authUser.metadata.lastSignInTime).toISOString()
                : null;
        }
        catch (error) {
            if (getAuthErrorCode(error) !== "auth/user-not-found") {
                console.error("listCmsUsers auth lookup error:", uid, error);
            }
            passwordStatus = "pending";
        }
        const profilePageIds = pageIdsFromProfile(data);
        const accountId = String((_c = data.accountId) !== null && _c !== void 0 ? _c : "").trim();
        const billing = await resolveBillingSummary(db, uid, accountId, profilePageIds);
        const role = String((_d = data.role) !== null && _d !== void 0 ? _d : "").trim().toLowerCase();
        return {
            uid,
            email: String((_e = data.email) !== null && _e !== void 0 ? _e : "").trim().toLowerCase(),
            displayName: String((_f = data.displayName) !== null && _f !== void 0 ? _f : "").trim(),
            phone: String((_g = data.phone) !== null && _g !== void 0 ? _g : "").trim(),
            role,
            assignedPageIds: normalizePageIdList(data.assignedPageIds),
            pageId: String((_h = data.pageId) !== null && _h !== void 0 ? _h : "").trim(),
            accountId,
            isDemo: data.isDemo === true,
            approvalStatus: (0, contactValidation_js_1.normalizeApprovalStatus)(data.approvalStatus, { hasRole: Boolean(role) }),
            passwordStatus,
            disabled,
            lastSignInAt,
            pageCount: billing.pageCount,
            plan: billing.plan,
            planStatus: billing.planStatus,
            subscriptionLabel: billing.subscriptionLabel,
            requestedAt: (_j = data.requestedAt) !== null && _j !== void 0 ? _j : null,
            createdAt: (_k = data.createdAt) !== null && _k !== void 0 ? _k : null,
            createdAtMs: toMillis((_l = data.requestedAt) !== null && _l !== void 0 ? _l : data.createdAt),
            updatedAt: (_m = data.updatedAt) !== null && _m !== void 0 ? _m : null,
        };
    }));
    users.sort((a, b) => {
        if (b.createdAtMs !== a.createdAtMs)
            return b.createdAtMs - a.createdAtMs;
        return a.email.localeCompare(b.email);
    });
    return { users, total: users.length };
});
exports.updateCmsUser = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
    const callerUid = await assertRootCaller(request);
    const uid = String((_b = (_a = request.data) === null || _a === void 0 ? void 0 : _a.uid) !== null && _b !== void 0 ? _b : "").trim();
    if (!uid) {
        throw new https_1.HttpsError("invalid-argument", "El UID es obligatorio.");
    }
    const db = (0, firestore_1.getFirestore)();
    const auth = (0, auth_1.getAuth)();
    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    const existing = await userRef.get();
    if (!existing.exists) {
        throw new https_1.HttpsError("not-found", "No existe el perfil de acceso.");
    }
    const current = (_c = existing.data()) !== null && _c !== void 0 ? _c : {};
    const targetIsRoot = normalizeRole(current.role) === "root";
    const wantsDemoOnly = ((_d = request.data) === null || _d === void 0 ? void 0 : _d.isDemo) !== undefined
        && ((_e = request.data) === null || _e === void 0 ? void 0 : _e.displayName) === undefined
        && ((_f = request.data) === null || _f === void 0 ? void 0 : _f.role) === undefined
        && ((_g = request.data) === null || _g === void 0 ? void 0 : _g.assignedPageIds) === undefined
        && ((_h = request.data) === null || _h === void 0 ? void 0 : _h.pageId) === undefined
        && ((_j = request.data) === null || _j === void 0 ? void 0 : _j.disabled) === undefined;
    try {
        if (targetIsRoot && wantsDemoOnly) {
            throw new https_1.HttpsError("failed-precondition", "No se puede marcar como demo a un usuario root.");
        }
        if (targetIsRoot && typeof ((_k = request.data) === null || _k === void 0 ? void 0 : _k.disabled) === "boolean") {
            throw new https_1.HttpsError("failed-precondition", "No se puede bloquear ni desbloquear a un usuario root.");
        }
        if (wantsDemoOnly) {
            await userRef.set({
                isDemo: ((_l = request.data) === null || _l === void 0 ? void 0 : _l.isDemo) === true,
                updatedAt: new Date().toISOString(),
            }, { merge: true });
            return { uid, isDemo: ((_m = request.data) === null || _m === void 0 ? void 0 : _m.isDemo) === true };
        }
        const hasProfilePatch = [
            (_o = request.data) === null || _o === void 0 ? void 0 : _o.displayName,
            (_p = request.data) === null || _p === void 0 ? void 0 : _p.role,
            (_q = request.data) === null || _q === void 0 ? void 0 : _q.assignedPageIds,
            (_r = request.data) === null || _r === void 0 ? void 0 : _r.pageId,
            (_s = request.data) === null || _s === void 0 ? void 0 : _s.isDemo,
        ].some((value) => value !== undefined);
        if (hasProfilePatch) {
            const profileData = buildUserProfileData({
                email: String((_t = current.email) !== null && _t !== void 0 ? _t : ""),
                displayName: ((_u = request.data) === null || _u === void 0 ? void 0 : _u.displayName) !== undefined
                    ? request.data.displayName
                    : current.displayName,
                role: ((_v = request.data) === null || _v === void 0 ? void 0 : _v.role) !== undefined ? request.data.role : current.role,
                assignedPageIds: ((_w = request.data) === null || _w === void 0 ? void 0 : _w.assignedPageIds) !== undefined
                    ? request.data.assignedPageIds
                    : current.assignedPageIds,
                pageId: ((_x = request.data) === null || _x === void 0 ? void 0 : _x.pageId) !== undefined ? request.data.pageId : current.pageId,
                isDemo: ((_y = request.data) === null || _y === void 0 ? void 0 : _y.isDemo) !== undefined
                    ? request.data.isDemo === true
                    : current.isDemo === true,
            }, { requireEmail: false });
            // Keep existing email; do not allow email changes from this endpoint.
            delete profileData.email;
            await userRef.set(profileData, { merge: true });
            if (profileData.displayName) {
                try {
                    await auth.updateUser(uid, { displayName: String(profileData.displayName) });
                }
                catch (error) {
                    console.error("updateCmsUser auth displayName error:", error);
                }
            }
        }
        if (typeof ((_z = request.data) === null || _z === void 0 ? void 0 : _z.disabled) === "boolean") {
            if (uid === callerUid && request.data.disabled) {
                throw new https_1.HttpsError("failed-precondition", "No puedes bloquear tu propia cuenta root.");
            }
            try {
                await auth.updateUser(uid, { disabled: request.data.disabled });
            }
            catch (error) {
                if (getAuthErrorCode(error) === "auth/user-not-found") {
                    throw new https_1.HttpsError("not-found", "El usuario no existe en Authentication.");
                }
                console.error("updateCmsUser disable error:", error);
                throw new https_1.HttpsError("internal", "No se pudo actualizar el estado de bloqueo.");
            }
            await userRef.set({
                disabled: request.data.disabled,
                updatedAt: new Date().toISOString(),
            }, { merge: true });
        }
        return { uid };
    }
    catch (error) {
        if (error instanceof https_1.HttpsError)
            throw error;
        console.error("updateCmsUser unexpected error:", error);
        throw new https_1.HttpsError("internal", "No se pudo actualizar el usuario.");
    }
});
exports.deleteCmsUser = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c;
    const callerUid = await assertRootCaller(request);
    const uid = String((_b = (_a = request.data) === null || _a === void 0 ? void 0 : _a.uid) !== null && _b !== void 0 ? _b : "").trim();
    if (!uid) {
        throw new https_1.HttpsError("invalid-argument", "El UID es obligatorio.");
    }
    if (uid === callerUid) {
        throw new https_1.HttpsError("failed-precondition", "No puedes eliminar tu propia cuenta root.");
    }
    const auth = (0, auth_1.getAuth)();
    const db = (0, firestore_1.getFirestore)();
    const targetSnap = await db.collection(USERS_COLLECTION).doc(uid).get();
    if (targetSnap.exists && normalizeRole((_c = targetSnap.data()) === null || _c === void 0 ? void 0 : _c.role) === "root") {
        throw new https_1.HttpsError("failed-precondition", "No se puede eliminar a un usuario root.");
    }
    try {
        await db.collection(USERS_COLLECTION).doc(uid).delete();
    }
    catch (error) {
        console.error("deleteCmsUser firestore error:", error);
        throw new https_1.HttpsError("internal", "No se pudo eliminar el perfil de acceso.");
    }
    try {
        await auth.deleteUser(uid);
    }
    catch (error) {
        const code = error === null || error === void 0 ? void 0 : error.code;
        if (code !== "auth/user-not-found") {
            console.error("deleteCmsUser auth error:", error);
            throw new https_1.HttpsError("internal", "Se eliminó el perfil, pero no la cuenta de Authentication.");
        }
    }
    return { uid };
});
/**
 * Public self-registration: creates Auth user + pending profile.
 * Login is gated until root calls approveCmsAccess.
 */
exports.requestCmsAccess = (0, https_1.onCall)(publicRegistrationOptions, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const email = (0, contactValidation_js_1.normalizeEmail)((_a = request.data) === null || _a === void 0 ? void 0 : _a.email);
    const password = String((_c = (_b = request.data) === null || _b === void 0 ? void 0 : _b.password) !== null && _c !== void 0 ? _c : "");
    const displayName = String((_e = (_d = request.data) === null || _d === void 0 ? void 0 : _d.displayName) !== null && _e !== void 0 ? _e : "").trim();
    const phoneCountryRaw = String((_g = (_f = request.data) === null || _f === void 0 ? void 0 : _f.phoneCountry) !== null && _g !== void 0 ? _g : "").trim().toLowerCase();
    const phoneCountry = phoneCountryRaw === "mx" || phoneCountryRaw === "us" ? phoneCountryRaw : "";
    if (!(0, contactValidation_js_1.isValidEmail)(email)) {
        throw new https_1.HttpsError("invalid-argument", "El email no es válido.");
    }
    if (password.length < 6) {
        throw new https_1.HttpsError("invalid-argument", "La contraseña debe tener al menos 6 caracteres.");
    }
    const phoneResult = (0, contactValidation_js_1.normalizeMxUsPhone)((_h = request.data) === null || _h === void 0 ? void 0 : _h.phone, phoneCountry);
    if (!phoneResult.ok) {
        throw new https_1.HttpsError("invalid-argument", "El teléfono no es válido. Usa un número de México (+52) o Estados Unidos (+1).");
    }
    const auth = (0, auth_1.getAuth)();
    const db = (0, firestore_1.getFirestore)();
    let userRecord;
    try {
        userRecord = await auth.createUser({
            email,
            password,
            displayName: displayName || undefined,
            emailVerified: false,
            disabled: false,
        });
    }
    catch (error) {
        const code = getAuthErrorCode(error);
        if (code === "auth/email-already-exists") {
            throw new https_1.HttpsError("already-exists", "Ya existe una cuenta con ese email.");
        }
        if (code === "auth/invalid-email") {
            throw new https_1.HttpsError("invalid-argument", "El email no es válido.");
        }
        if (code === "auth/invalid-password" || code === "auth/weak-password") {
            throw new https_1.HttpsError("invalid-argument", "La contraseña no cumple la política de seguridad.");
        }
        console.error("requestCmsAccess auth error:", code || "unknown", error);
        throw new https_1.HttpsError("internal", "No se pudo crear la cuenta.");
    }
    try {
        await db.collection(USERS_COLLECTION).doc(userRecord.uid).set({
            email,
            displayName,
            phone: phoneResult.e164,
            phoneCountry: phoneResult.country,
            role: "",
            assignedPageIds: [],
            pageId: "",
            isDemo: false,
            disabled: false,
            approvalStatus: "pending",
            requestedAt: firestore_1.FieldValue.serverTimestamp(),
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: new Date().toISOString(),
        });
    }
    catch (error) {
        try {
            await auth.deleteUser(userRecord.uid);
        }
        catch (rollbackError) {
            console.error("requestCmsAccess rollback error:", rollbackError);
        }
        console.error("requestCmsAccess firestore error:", error);
        throw new https_1.HttpsError("internal", "No se pudo guardar la solicitud de acceso.");
    }
    return {
        uid: userRecord.uid,
        email,
        approvalStatus: "pending",
    };
});
exports.approveCmsAccess = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    await assertRootCaller(request);
    const uid = String((_b = (_a = request.data) === null || _a === void 0 ? void 0 : _a.uid) !== null && _b !== void 0 ? _b : "").trim();
    if (!uid) {
        throw new https_1.HttpsError("invalid-argument", "El UID es obligatorio.");
    }
    const db = (0, firestore_1.getFirestore)();
    const auth = (0, auth_1.getAuth)();
    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    const existing = await userRef.get();
    if (!existing.exists) {
        throw new https_1.HttpsError("not-found", "No existe la solicitud de acceso.");
    }
    const current = (_c = existing.data()) !== null && _c !== void 0 ? _c : {};
    const currentStatus = (0, contactValidation_js_1.normalizeApprovalStatus)(current.approvalStatus, {
        hasRole: Boolean(normalizeRole(current.role)),
    });
    if (currentStatus === "approved" && normalizeRole(current.role)) {
        throw new https_1.HttpsError("failed-precondition", "Esta cuenta ya está aprobada.");
    }
    if (normalizeRole(current.role) === "root") {
        throw new https_1.HttpsError("failed-precondition", "No se puede reprocesar una cuenta root.");
    }
    const profileData = buildUserProfileData({
        email: String((_d = current.email) !== null && _d !== void 0 ? _d : ""),
        displayName: ((_e = request.data) === null || _e === void 0 ? void 0 : _e.displayName) !== undefined
            ? request.data.displayName
            : current.displayName,
        role: (_f = request.data) === null || _f === void 0 ? void 0 : _f.role,
        assignedPageIds: (_g = request.data) === null || _g === void 0 ? void 0 : _g.assignedPageIds,
        pageId: (_h = request.data) === null || _h === void 0 ? void 0 : _h.pageId,
        isDemo: false,
    }, { requireEmail: false });
    delete profileData.email;
    try {
        await auth.updateUser(uid, {
            disabled: false,
            displayName: String(profileData.displayName || current.displayName || "") || undefined,
        });
    }
    catch (error) {
        if (getAuthErrorCode(error) === "auth/user-not-found") {
            throw new https_1.HttpsError("not-found", "El usuario no existe en Authentication.");
        }
        console.error("approveCmsAccess auth error:", error);
        throw new https_1.HttpsError("internal", "No se pudo habilitar la cuenta.");
    }
    await userRef.set(Object.assign(Object.assign({}, profileData), { approvalStatus: "approved", disabled: false, approvedAt: firestore_1.FieldValue.serverTimestamp(), updatedAt: new Date().toISOString() }), { merge: true });
    const email = (0, contactValidation_js_1.normalizeEmail)(current.email);
    let emailResult = { sent: false };
    if (email) {
        emailResult = await (0, approvalEmail_js_1.sendAccessApprovedEmail)({
            to: email,
            displayName: String(profileData.displayName || current.displayName || ""),
            loginUrl: buildLoginContinueUrl(getAdminPublicUrl(), email),
        });
    }
    return {
        uid,
        approvalStatus: "approved",
        role: profileData.role,
        emailSent: emailResult.sent === true,
        emailReason: (_j = emailResult.reason) !== null && _j !== void 0 ? _j : null,
    };
});
/** Soft reject: keep Auth + Firestore, disable login. */
exports.rejectCmsAccess = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c;
    await assertRootCaller(request);
    const uid = String((_b = (_a = request.data) === null || _a === void 0 ? void 0 : _a.uid) !== null && _b !== void 0 ? _b : "").trim();
    if (!uid) {
        throw new https_1.HttpsError("invalid-argument", "El UID es obligatorio.");
    }
    const db = (0, firestore_1.getFirestore)();
    const auth = (0, auth_1.getAuth)();
    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    const existing = await userRef.get();
    if (!existing.exists) {
        throw new https_1.HttpsError("not-found", "No existe la solicitud de acceso.");
    }
    const current = (_c = existing.data()) !== null && _c !== void 0 ? _c : {};
    if (normalizeRole(current.role) === "root") {
        throw new https_1.HttpsError("failed-precondition", "No se puede rechazar una cuenta root.");
    }
    try {
        // Soft reject: keep Auth account usable enough to show a clear rejection
        // message after profile load (do not Auth-disable, which maps to "blocked").
        await auth.updateUser(uid, { disabled: false });
    }
    catch (error) {
        if (getAuthErrorCode(error) === "auth/user-not-found") {
            throw new https_1.HttpsError("not-found", "El usuario no existe en Authentication.");
        }
        console.error("rejectCmsAccess auth error:", error);
        throw new https_1.HttpsError("internal", "No se pudo actualizar la cuenta.");
    }
    await userRef.set({
        approvalStatus: "rejected",
        disabled: true,
        rejectedAt: firestore_1.FieldValue.serverTimestamp(),
        updatedAt: new Date().toISOString(),
    }, { merge: true });
    return { uid, approvalStatus: "rejected" };
});
//# sourceMappingURL=cmsUsers.js.map