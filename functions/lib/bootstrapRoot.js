"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureBootstrapRoot = void 0;
/**
 * First-root bootstrap via Admin SDK.
 * Client self-create of role=root is blocked in firestore.rules (F01).
 */
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
const USERS_COLLECTION = "users";
function bootstrapRootEmail() {
    var _a;
    return String((_a = process.env.BOOTSTRAP_ROOT_EMAIL) !== null && _a !== void 0 ? _a : "").trim().toLowerCase();
}
function normalizeProfile(uid, data = {}) {
    var _a, _b, _c, _d, _e, _f, _g;
    return {
        uid,
        email: String((_a = data.email) !== null && _a !== void 0 ? _a : "").trim().toLowerCase(),
        displayName: String((_b = data.displayName) !== null && _b !== void 0 ? _b : "").trim(),
        role: String((_c = data.role) !== null && _c !== void 0 ? _c : "").trim().toLowerCase(),
        accountId: String((_d = data.accountId) !== null && _d !== void 0 ? _d : "").trim(),
        assignedPageIds: Array.isArray(data.assignedPageIds) ? data.assignedPageIds : [],
        pageId: String((_e = data.pageId) !== null && _e !== void 0 ? _e : "").trim(),
        isDemo: data.isDemo === true,
        disabled: data.disabled === true,
        updatedAt: (_f = data.updatedAt) !== null && _f !== void 0 ? _f : null,
        createdAt: (_g = data.createdAt) !== null && _g !== void 0 ? _g : null,
    };
}
const callableOptions = {
    cors: true,
    invoker: "public",
};
/**
 * Ensures the allowlisted bootstrap email has a users/{uid} doc with role root.
 * Other signed-in users without a profile get permission-denied (invite-only).
 */
exports.ensureBootstrapRoot = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c, _d, _e, _f;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const uid = request.auth.uid;
    const email = String((_b = request.auth.token.email) !== null && _b !== void 0 ? _b : "").trim().toLowerCase();
    const allowed = bootstrapRootEmail();
    const ref = (0, firestore_1.getFirestore)().collection(USERS_COLLECTION).doc(uid);
    const existing = await ref.get();
    if (existing.exists) {
        const data = ((_c = existing.data()) !== null && _c !== void 0 ? _c : {});
        // Upgrade allowlisted email to root if somehow not root yet.
        if (allowed && email === allowed && data.role !== "root") {
            const now = new Date().toISOString();
            const profile = {
                email,
                displayName: String((_e = (_d = request.auth.token.name) !== null && _d !== void 0 ? _d : data.displayName) !== null && _e !== void 0 ? _e : "").trim(),
                role: "root",
                assignedPageIds: [],
                pageId: "",
                isDemo: false,
                createdAt: data.createdAt || now,
                updatedAt: now,
            };
            await ref.set(profile, { merge: true });
            return normalizeProfile(uid, profile);
        }
        return normalizeProfile(uid, data);
    }
    if (!allowed || !email || email !== allowed) {
        throw new https_1.HttpsError("permission-denied", "No tienes un perfil CMS. Pide una invitación a un administrador.");
    }
    const now = new Date().toISOString();
    const profile = {
        email,
        displayName: String((_f = request.auth.token.name) !== null && _f !== void 0 ? _f : "").trim(),
        role: "root",
        assignedPageIds: [],
        pageId: "",
        isDemo: false,
        createdAt: now,
        updatedAt: now,
    };
    await ref.set(profile, { merge: true });
    return normalizeProfile(uid, profile);
});
//# sourceMappingURL=bootstrapRoot.js.map