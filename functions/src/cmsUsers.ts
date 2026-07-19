import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { randomBytes } from "node:crypto";

initializeApp();

const USERS_COLLECTION = "users";
const VALID_ROLES = new Set(["root", "admin", "user"]);

type CmsRole = "root" | "admin" | "user";

interface UserProfilePayload {
  email?: string;
  displayName?: string;
  role?: string;
  assignedPageIds?: string[];
  pageId?: string;
}

interface CreateUserPayload extends UserProfilePayload {
  createInvitation?: boolean;
}

interface GenerateInvitationPayload {
  uid?: string;
}

function normalizeRole(role: unknown): CmsRole | null {
  const value = String(role ?? "").trim().toLowerCase();
  return VALID_ROLES.has(value) ? (value as CmsRole) : null;
}

function normalizePageIdList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function buildUserProfileData(payload: UserProfilePayload = {}) {
  const role = normalizeRole(payload.role);
  if (!role) {
    throw new HttpsError("invalid-argument", "Selecciona un rol válido.");
  }

  const email = String(payload.email ?? "").trim().toLowerCase();
  if (!email) {
    throw new HttpsError("invalid-argument", "El email es obligatorio.");
  }

  const assignedPageIds = normalizePageIdList(payload.assignedPageIds);
  const pageId = String(payload.pageId ?? "").trim();

  if (role === "admin" && assignedPageIds.length === 0) {
    throw new HttpsError("invalid-argument", "Un admin debe tener al menos una página asignada.");
  }

  if (role === "user" && !pageId) {
    throw new HttpsError("invalid-argument", "Un usuario regular debe tener una página asignada.");
  }

  return {
    email,
    displayName: String(payload.displayName ?? "").trim(),
    role,
    assignedPageIds: role === "admin" ? assignedPageIds : [],
    pageId: role === "user" ? pageId : "",
    updatedAt: new Date().toISOString(),
  };
}

async function assertRootCaller(request: CallableRequest) {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }

  const callerDoc = await getFirestore()
    .collection(USERS_COLLECTION)
    .doc(request.auth.uid)
    .get();

  if (!callerDoc.exists || callerDoc.data()?.role !== "root") {
    throw new HttpsError("permission-denied", "Solo un usuario root puede gestionar cuentas.");
  }

  return request.auth.uid;
}

const callableOptions = {
  cors: true,
  invoker: "public",
};

function getAdminPublicUrl() {
  return String(process.env.ADMIN_PUBLIC_URL ?? "http://localhost:5173").trim().replace(/\/+$/, "");
}

async function generateInvitationLink(email: string) {
  const loginUrl = new URL("/login", getAdminPublicUrl());
  loginUrl.searchParams.set("email", email);

  try {
    return await getAuth().generatePasswordResetLink(email, {
      url: loginUrl.toString(),
      handleCodeInApp: false,
    });
  } catch (error) {
    console.error("generateCmsUserInvitation error:", (error as { code?: string })?.code ?? "unknown");
    throw new HttpsError("internal", "No se pudo generar el enlace de invitación.");
  }
}

export const createCmsUser = onCall(
  callableOptions,
  async (request: CallableRequest<CreateUserPayload>) => {
    await assertRootCaller(request);

    const profileData = buildUserProfileData(request.data ?? {});
    const auth = getAuth();
    const db = getFirestore();
    const password = randomBytes(32).toString("base64url");

    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: profileData.email,
        password,
        displayName: profileData.displayName || undefined,
        emailVerified: false,
      });
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === "auth/email-already-exists") {
        throw new HttpsError("already-exists", "Ya existe un usuario con ese email.");
      }
      if (code === "auth/invalid-password") {
        throw new HttpsError("invalid-argument", "La contraseña no cumple los requisitos de Firebase.");
      }
      console.error("createCmsUser auth error:", error);
      throw new HttpsError("internal", "No se pudo crear el usuario en Authentication.");
    }

    try {
      await db.collection(USERS_COLLECTION).doc(userRecord.uid).set({
        ...profileData,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      try {
        await auth.deleteUser(userRecord.uid);
      } catch (rollbackError) {
        console.error("createCmsUser rollback error:", rollbackError);
      }
      console.error("createCmsUser firestore error:", error);
      throw new HttpsError("internal", "No se pudo guardar el perfil de acceso.");
    }

    const invitationLink = request.data?.createInvitation === true
      ? await generateInvitationLink(profileData.email)
      : null;

    return {
      uid: userRecord.uid,
      email: profileData.email,
      role: profileData.role,
      invitationLink,
    };
  },
);

export const generateCmsUserInvitation = onCall(
  callableOptions,
  async (request: CallableRequest<GenerateInvitationPayload>) => {
    await assertRootCaller(request);

    const uid = String(request.data?.uid ?? "").trim();
    if (!uid) {
      throw new HttpsError("invalid-argument", "El UID es obligatorio.");
    }

    let userRecord;
    try {
      userRecord = await getAuth().getUser(uid);
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === "auth/user-not-found") {
        throw new HttpsError("not-found", "El usuario no existe en Authentication.");
      }
      throw new HttpsError("internal", "No se pudo consultar el usuario.");
    }

    if (!userRecord.email) {
      throw new HttpsError("failed-precondition", "El usuario no tiene un email asociado.");
    }

    return {
      uid,
      email: userRecord.email,
      displayName: userRecord.displayName ?? "",
      invitationLink: await generateInvitationLink(userRecord.email),
    };
  },
);

export const deleteCmsUser = onCall(
  callableOptions,
  async (request: CallableRequest<{ uid?: string }>) => {
    const callerUid = await assertRootCaller(request);

    const uid = String(request.data?.uid ?? "").trim();
    if (!uid) {
      throw new HttpsError("invalid-argument", "El UID es obligatorio.");
    }

    if (uid === callerUid) {
      throw new HttpsError("failed-precondition", "No puedes eliminar tu propia cuenta root.");
    }

    const auth = getAuth();
    const db = getFirestore();

    try {
      await db.collection(USERS_COLLECTION).doc(uid).delete();
    } catch (error) {
      console.error("deleteCmsUser firestore error:", error);
      throw new HttpsError("internal", "No se pudo eliminar el perfil de acceso.");
    }

    try {
      await auth.deleteUser(uid);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code !== "auth/user-not-found") {
        console.error("deleteCmsUser auth error:", error);
        throw new HttpsError("internal", "Se eliminó el perfil, pero no la cuenta de Authentication.");
      }
    }

    return { uid };
  },
);
