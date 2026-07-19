"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCmsUser = exports.generateCmsUserInvitation = exports.createCmsUser = void 0;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const node_crypto_1 = require("node:crypto");
(0, app_1.initializeApp)();
const USERS_COLLECTION = "users";
const VALID_ROLES = new Set(["root", "admin", "user"]);
function normalizeRole(role) {
    const value = String(role !== null && role !== void 0 ? role : "").trim().toLowerCase();
    return VALID_ROLES.has(value) ? value : null;
}
function normalizePageIdList(values) {
    if (!Array.isArray(values))
        return [];
    return [...new Set(values.map((value) => String(value !== null && value !== void 0 ? value : "").trim()).filter(Boolean))];
}
function buildUserProfileData(payload = {}) {
    var _a, _b, _c;
    const role = normalizeRole(payload.role);
    if (!role) {
        throw new https_1.HttpsError("invalid-argument", "Selecciona un rol válido.");
    }
    const email = String((_a = payload.email) !== null && _a !== void 0 ? _a : "").trim().toLowerCase();
    if (!email) {
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
    return {
        email,
        displayName: String((_c = payload.displayName) !== null && _c !== void 0 ? _c : "").trim(),
        role,
        assignedPageIds: role === "admin" ? assignedPageIds : [],
        pageId: role === "user" ? pageId : "",
        updatedAt: new Date().toISOString(),
    };
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
const callableOptions = {
    cors: true,
    invoker: "public",
};
function getAdminPublicUrl() {
    var _a;
    return String((_a = process.env.ADMIN_PUBLIC_URL) !== null && _a !== void 0 ? _a : "http://localhost:5173").trim().replace(/\/+$/, "");
}
async function generateInvitationLink(email) {
    var _a;
    const loginUrl = new URL("/login", getAdminPublicUrl());
    loginUrl.searchParams.set("email", email);
    try {
        return await (0, auth_1.getAuth)().generatePasswordResetLink(email, {
            url: loginUrl.toString(),
            handleCodeInApp: false,
        });
    }
    catch (error) {
        console.error("generateCmsUserInvitation error:", (_a = error === null || error === void 0 ? void 0 : error.code) !== null && _a !== void 0 ? _a : "unknown");
        throw new https_1.HttpsError("internal", "No se pudo generar el enlace de invitación.");
    }
}
exports.createCmsUser = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b;
    await assertRootCaller(request);
    const profileData = buildUserProfileData((_a = request.data) !== null && _a !== void 0 ? _a : {});
    const auth = (0, auth_1.getAuth)();
    const db = (0, firestore_1.getFirestore)();
    const password = (0, node_crypto_1.randomBytes)(32).toString("base64url");
    let userRecord;
    try {
        userRecord = await auth.createUser({
            email: profileData.email,
            password,
            displayName: profileData.displayName || undefined,
            emailVerified: false,
        });
    }
    catch (error) {
        const code = error === null || error === void 0 ? void 0 : error.code;
        if (code === "auth/email-already-exists") {
            throw new https_1.HttpsError("already-exists", "Ya existe un usuario con ese email.");
        }
        if (code === "auth/invalid-password") {
            throw new https_1.HttpsError("invalid-argument", "La contraseña no cumple los requisitos de Firebase.");
        }
        console.error("createCmsUser auth error:", error);
        throw new https_1.HttpsError("internal", "No se pudo crear el usuario en Authentication.");
    }
    try {
        await db.collection(USERS_COLLECTION).doc(userRecord.uid).set(Object.assign(Object.assign({}, profileData), { createdAt: firestore_1.FieldValue.serverTimestamp() }));
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
    const invitationLink = ((_b = request.data) === null || _b === void 0 ? void 0 : _b.createInvitation) === true
        ? await generateInvitationLink(profileData.email)
        : null;
    return {
        uid: userRecord.uid,
        email: profileData.email,
        role: profileData.role,
        invitationLink,
    };
});
exports.generateCmsUserInvitation = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c;
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
    return {
        uid,
        email: userRecord.email,
        displayName: (_c = userRecord.displayName) !== null && _c !== void 0 ? _c : "",
        invitationLink: await generateInvitationLink(userRecord.email),
    };
});
exports.deleteCmsUser = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b;
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
//# sourceMappingURL=cmsUsers.js.map