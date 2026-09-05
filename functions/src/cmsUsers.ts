import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, type Firestore } from "firebase-admin/firestore";
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { sensitiveCallableOptions } from "./callableOptions.js";
import {
  sendAccessApprovedEmail,
  sendInvitationEmail,
  sendPasswordResetEmail,
  type EmailSendResult,
} from "./approvalEmail.js";
import {
  isValidEmail,
  normalizeApprovalStatus,
  normalizeEmail,
  normalizeMxUsPhone,
  type PhoneCountry,
} from "./contactValidation.js";

initializeApp();

const USERS_COLLECTION = "users";
const BILLING_ACCOUNTS_COLLECTION = "billingAccounts";
const VALID_ROLES = new Set(["root", "admin", "user"]);
const VALID_PLANS = new Set(["starter", "pro", "agency", "enterprise"]);

type CmsRole = "root" | "admin" | "user";

interface UserProfilePayload {
  email?: string;
  displayName?: string;
  role?: string;
  assignedPageIds?: string[];
  pageId?: string;
  isDemo?: boolean;
}

interface CreateUserPayload extends UserProfilePayload {
  createInvitation?: boolean;
  phone?: string;
}

interface RequestAccessPayload {
  email?: string;
  password?: string;
  displayName?: string;
  phone?: string;
  phoneCountry?: string;
}

interface ApproveAccessPayload {
  uid?: string;
  role?: string;
  assignedPageIds?: string[];
  pageId?: string;
  displayName?: string;
}

interface RejectAccessPayload {
  uid?: string;
}

interface GenerateInvitationPayload {
  uid?: string;
}

interface RequestPasswordResetPayload {
  email?: string;
}

interface UpdateUserPayload extends UserProfilePayload {
  uid?: string;
  disabled?: boolean;
}

function normalizeRole(role: unknown): CmsRole | null {
  const value = String(role ?? "").trim().toLowerCase();
  return VALID_ROLES.has(value) ? (value as CmsRole) : null;
}

function normalizePageIdList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function normalizePlanId(value: unknown): string {
  const plan = String(value ?? "").trim().toLowerCase();
  return VALID_PLANS.has(plan) ? plan : "starter";
}

function getAuthErrorCode(error: unknown): string {
  const err = error as { code?: string; errorInfo?: { code?: string }; message?: string };
  return String(err?.errorInfo?.code || err?.code || "").trim();
}

function toMillis(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "object" && value !== null && typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function pageIdsFromProfile(data: {
  role?: string;
  assignedPageIds?: unknown;
  pageId?: unknown;
}): string[] {
  const fromList = normalizePageIdList(data.assignedPageIds);
  const single = String(data.pageId ?? "").trim();
  return normalizePageIdList([...fromList, ...(single ? [single] : [])]);
}

function buildUserProfileData(payload: UserProfilePayload = {}, { requireEmail = true } = {}) {
  const role = normalizeRole(payload.role);
  if (!role) {
    throw new HttpsError("invalid-argument", "Selecciona un rol válido.");
  }

  const email = String(payload.email ?? "").trim().toLowerCase();
  if (requireEmail && !email) {
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

  const data: Record<string, unknown> = {
    displayName: String(payload.displayName ?? "").trim(),
    role,
    assignedPageIds: role === "admin" ? assignedPageIds : [],
    pageId: role === "user" ? pageId : "",
    // Root accounts cannot be demo users.
    isDemo: role === "root" ? false : payload.isDemo === true,
    updatedAt: new Date().toISOString(),
  };

  if (email) data.email = email;

  return data;
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

const callableOptions = sensitiveCallableOptions();
/** Public self-registration from /login (App Check not available before sign-in). */
const publicRegistrationOptions = sensitiveCallableOptions({ enforceAppCheck: false });

function getAdminPublicUrl() {
  return String(process.env.ADMIN_PUBLIC_URL ?? "http://localhost:5173").trim().replace(/\/+$/, "");
}

function getFirebaseProjectId(): string {
  const fromEnv = String(process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || "").trim();
  if (fromEnv) return fromEnv;
  try {
    const config = JSON.parse(String(process.env.FIREBASE_CONFIG || "{}"));
    return String(config.projectId || "").trim();
  } catch {
    return "";
  }
}

function buildLoginContinueUrl(base: string, email: string): string {
  const loginUrl = new URL("/login", base.endsWith("/") ? base : `${base}/`);
  loginUrl.searchParams.set("email", email);
  return loginUrl.toString();
}

function getAuthLinkDomain(): string | null {
  const explicit = String(process.env.AUTH_LINK_DOMAIN ?? "").trim();
  if (!explicit) return null;
  return explicit.replace(/^https?:\/\//, "").split("/")[0].toLowerCase() || null;
}

/**
 * Continue URLs for password-reset invitation links.
 * Domains must be in Firebase Auth → Authorized domains.
 *
 * The returned link host is still landing-admin-9452e.firebaseapp.com unless
 * AUTH_LINK_DOMAIN is set and verified under Auth → Templates → Customize domain.
 */
function invitationContinueUrlCandidates(email: string): string[] {
  const candidates: string[] = [];
  const primary = getAdminPublicUrl();
  if (primary) candidates.push(buildLoginContinueUrl(primary, email));

  const projectId = getFirebaseProjectId();
  if (projectId) {
    candidates.push(buildLoginContinueUrl(`https://${projectId}.web.app`, email));
    candidates.push(buildLoginContinueUrl(`https://${projectId}.firebaseapp.com`, email));
  }

  // Deduplicate while preserving order.
  return [...new Set(candidates)];
}

async function generateInvitationLink(email: string) {
  const auth = getAuth();
  const continueUrls = invitationContinueUrlCandidates(email);
  const linkDomain = getAuthLinkDomain();
  const errors: string[] = [];

  for (const url of continueUrls) {
    const settingsVariants: Array<{
      url: string;
      handleCodeInApp: boolean;
      linkDomain?: string;
    }> = linkDomain
      ? [
        { url, handleCodeInApp: false, linkDomain },
        { url, handleCodeInApp: false },
      ]
      : [{ url, handleCodeInApp: false }];

    for (const settings of settingsVariants) {
      try {
        return await auth.generatePasswordResetLink(email, settings);
      } catch (error) {
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
  } catch (error) {
    const code = getAuthErrorCode(error);
    console.error("generateCmsUserInvitation default link failed:", code || "unknown", error);
    errors.push(`${code || "unknown"} @ default`);
    throw new HttpsError(
      "internal",
      `No se pudo generar el enlace de invitación (${errors[0] || code || "unknown"}). `
        + "Añade el dominio de ADMIN_PUBLIC_URL en Authentication → Authorized domains.",
    );
  }
}

async function resolveBillingSummary(
  db: Firestore,
  uid: string,
  accountId: string,
  profilePageIds: string[],
) {
  const candidates = [accountId, uid].filter(Boolean);
  let plan = "starter";
  let planStatus = "incomplete";
  let billingPageIds: string[] = [];

  for (const id of candidates) {
    const snap = await db.collection(BILLING_ACCOUNTS_COLLECTION).doc(id).get();
    if (!snap.exists) continue;
    const data = snap.data() ?? {};
    plan = normalizePlanId(data.plan);
    planStatus = String(data.status ?? "incomplete").trim().toLowerCase() || "incomplete";
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

export const createCmsUser = onCall(
  callableOptions,
  async (request: CallableRequest<CreateUserPayload>) => {
    await assertRootCaller(request);

    const profileData = buildUserProfileData(request.data ?? {});
    const auth = getAuth();
    const db = getFirestore();

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
    } catch (error: unknown) {
      const code = getAuthErrorCode(error);
      if (code === "auth/email-already-exists") {
        throw new HttpsError("already-exists", "Ya existe un usuario con ese email.");
      }
      if (code === "auth/invalid-email") {
        throw new HttpsError("invalid-argument", "El email no es válido.");
      }
      if (code === "auth/invalid-password") {
        throw new HttpsError(
          "invalid-argument",
          "No se pudo crear la cuenta (política de contraseña). Intenta de nuevo o revisa Authentication.",
        );
      }
      console.error("createCmsUser auth error:", code || "unknown", error);
      throw new HttpsError("internal", "No se pudo crear el usuario en Authentication.");
    }

    try {
      await db.collection(USERS_COLLECTION).doc(userRecord.uid).set({
        ...profileData,
        approvalStatus: "approved",
        phone: String(request.data?.phone ?? "").trim(),
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

    let invitationLink: string | null = null;
    let invitationError: string | null = null;
    let invitationEmailSent = false;
    let invitationEmailReason: string | null = null;
    let invitationEmailError: string | null = null;
    if (request.data?.createInvitation === true) {
      try {
        invitationLink = await generateInvitationLink(String(profileData.email));
        const emailResult = await sendInvitationEmail({
          to: String(profileData.email),
          invitationLink,
          displayName: String(profileData.displayName || ""),
        });
        invitationEmailSent = emailResult.sent === true;
        invitationEmailReason = emailResult.reason ?? null;
        invitationEmailError = emailResult.emailError ?? null;
      } catch (error) {
        invitationError = error instanceof HttpsError
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
      invitationEmailError,
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

    const invitationLink = await generateInvitationLink(userRecord.email);
    const emailResult = await sendInvitationEmail({
      to: userRecord.email,
      invitationLink,
      displayName: userRecord.displayName ?? "",
    });

    return {
      uid,
      email: userRecord.email,
      displayName: userRecord.displayName ?? "",
      invitationLink,
      emailSent: emailResult.sent === true,
      emailReason: emailResult.reason ?? null,
      emailError: emailResult.emailError ?? null,
    };
  },
);

/**
 * Public password reset: generates Admin SDK link and sends via Resend.
 * Always returns success to avoid email enumeration.
 */
export const requestPasswordResetEmail = onCall(
  publicRegistrationOptions,
  async (request: CallableRequest<RequestPasswordResetPayload>) => {
    const email = normalizeEmail(request.data?.email);
    if (!isValidEmail(email)) {
      throw new HttpsError("invalid-argument", "El email no es válido.");
    }

    try {
      const userRecord = await getAuth().getUserByEmail(email);
      const resetLink = await generateInvitationLink(email);
      const emailResult = await sendPasswordResetEmail({
        to: email,
        resetLink,
        displayName: userRecord.displayName ?? "",
      });

      if (emailResult.sent !== true) {
        console.error(
          "requestPasswordResetEmail: link generated but email not sent:",
          emailResult.reason,
        );
      }
    } catch (error: unknown) {
      const code = getAuthErrorCode(error);
      if (code === "auth/user-not-found") {
        // Enumeration protection: pretend success.
        return { ok: true };
      }
      if (error instanceof HttpsError) {
        throw error;
      }
      console.error("requestPasswordResetEmail error:", code || "unknown", error);
      throw new HttpsError("internal", "No se pudo enviar el correo de recuperación.");
    }

    return { ok: true };
  },
);

function resolvePasswordStatus(userRecord: {
  providerData?: Array<{ providerId?: string }>;
  passwordHash?: string;
}): "confirmed" | "pending" {
  const hasPasswordProvider = (userRecord.providerData || []).some(
    (provider) => provider.providerId === "password",
  );
  if (hasPasswordProvider || Boolean(userRecord.passwordHash)) {
    return "confirmed";
  }
  return "pending";
}

export const listCmsUsers = onCall(callableOptions, async (request: CallableRequest) => {
  await assertRootCaller(request);

  const db = getFirestore();
  const auth = getAuth();
  const snapshot = await db.collection(USERS_COLLECTION).get();

  const users = await Promise.all(
    snapshot.docs.map(async (userDoc) => {
      const data = userDoc.data() ?? {};
      const uid = userDoc.id;
      let passwordStatus: "confirmed" | "pending" | "unknown" = "unknown";
      let disabled = false;
      let lastSignInAt: string | null = null;

      try {
        const authUser = await auth.getUser(uid);
        passwordStatus = resolvePasswordStatus(authUser);
        disabled = authUser.disabled === true;
        lastSignInAt = authUser.metadata?.lastSignInTime
          ? new Date(authUser.metadata.lastSignInTime).toISOString()
          : null;
      } catch (error: unknown) {
        if (getAuthErrorCode(error) !== "auth/user-not-found") {
          console.error("listCmsUsers auth lookup error:", uid, error);
        }
        passwordStatus = "pending";
      }

      const profilePageIds = pageIdsFromProfile(data);
      const accountId = String(data.accountId ?? "").trim();
      const billing = await resolveBillingSummary(db, uid, accountId, profilePageIds);
      const role = String(data.role ?? "").trim().toLowerCase();

      return {
        uid,
        email: String(data.email ?? "").trim().toLowerCase(),
        displayName: String(data.displayName ?? "").trim(),
        phone: String(data.phone ?? "").trim(),
        role,
        assignedPageIds: normalizePageIdList(data.assignedPageIds),
        pageId: String(data.pageId ?? "").trim(),
        accountId,
        isDemo: data.isDemo === true,
        approvalStatus: normalizeApprovalStatus(data.approvalStatus, { hasRole: Boolean(role) }),
        passwordStatus,
        disabled,
        lastSignInAt,
        pageCount: billing.pageCount,
        plan: billing.plan,
        planStatus: billing.planStatus,
        subscriptionLabel: billing.subscriptionLabel,
        requestedAt: data.requestedAt ?? null,
        createdAt: data.createdAt ?? null,
        createdAtMs: toMillis(data.requestedAt ?? data.createdAt),
        updatedAt: data.updatedAt ?? null,
      };
    }),
  );

  users.sort((a, b) => {
    if (b.createdAtMs !== a.createdAtMs) return b.createdAtMs - a.createdAtMs;
    return a.email.localeCompare(b.email);
  });

  return { users, total: users.length };
});

export const updateCmsUser = onCall(
  callableOptions,
  async (request: CallableRequest<UpdateUserPayload>) => {
    const callerUid = await assertRootCaller(request);
    const uid = String(request.data?.uid ?? "").trim();
    if (!uid) {
      throw new HttpsError("invalid-argument", "El UID es obligatorio.");
    }

    const db = getFirestore();
    const auth = getAuth();
    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    const existing = await userRef.get();
    if (!existing.exists) {
      throw new HttpsError("not-found", "No existe el perfil de acceso.");
    }

    const current = existing.data() ?? {};
    const targetIsRoot = normalizeRole(current.role) === "root";
    const wantsDemoOnly = request.data?.isDemo !== undefined
      && request.data?.displayName === undefined
      && request.data?.role === undefined
      && request.data?.assignedPageIds === undefined
      && request.data?.pageId === undefined
      && request.data?.disabled === undefined;

    try {
      if (targetIsRoot && wantsDemoOnly) {
        throw new HttpsError(
          "failed-precondition",
          "No se puede marcar como demo a un usuario root.",
        );
      }

      if (targetIsRoot && typeof request.data?.disabled === "boolean") {
        throw new HttpsError(
          "failed-precondition",
          "No se puede bloquear ni desbloquear a un usuario root.",
        );
      }

      if (wantsDemoOnly) {
        await userRef.set({
          isDemo: request.data?.isDemo === true,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        return { uid, isDemo: request.data?.isDemo === true };
      }

      const hasProfilePatch = [
        request.data?.displayName,
        request.data?.role,
        request.data?.assignedPageIds,
        request.data?.pageId,
        request.data?.isDemo,
      ].some((value) => value !== undefined);

      if (hasProfilePatch) {
        const profileData = buildUserProfileData({
          email: String(current.email ?? ""),
          displayName: request.data?.displayName !== undefined
            ? request.data.displayName
            : current.displayName,
          role: request.data?.role !== undefined ? request.data.role : current.role,
          assignedPageIds: request.data?.assignedPageIds !== undefined
            ? request.data.assignedPageIds
            : current.assignedPageIds,
          pageId: request.data?.pageId !== undefined ? request.data.pageId : current.pageId,
          isDemo: request.data?.isDemo !== undefined
            ? request.data.isDemo === true
            : current.isDemo === true,
        }, { requireEmail: false });

        // Keep existing email; do not allow email changes from this endpoint.
        delete profileData.email;
        await userRef.set(profileData, { merge: true });

        if (profileData.displayName) {
          try {
            await auth.updateUser(uid, { displayName: String(profileData.displayName) });
          } catch (error) {
            console.error("updateCmsUser auth displayName error:", error);
          }
        }
      }

      if (typeof request.data?.disabled === "boolean") {
        if (uid === callerUid && request.data.disabled) {
          throw new HttpsError("failed-precondition", "No puedes bloquear tu propia cuenta root.");
        }
        try {
          await auth.updateUser(uid, { disabled: request.data.disabled });
        } catch (error: unknown) {
          if (getAuthErrorCode(error) === "auth/user-not-found") {
            throw new HttpsError("not-found", "El usuario no existe en Authentication.");
          }
          console.error("updateCmsUser disable error:", error);
          throw new HttpsError("internal", "No se pudo actualizar el estado de bloqueo.");
        }
        await userRef.set({
          disabled: request.data.disabled,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }

      return { uid };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error("updateCmsUser unexpected error:", error);
      throw new HttpsError("internal", "No se pudo actualizar el usuario.");
    }
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
    const targetSnap = await db.collection(USERS_COLLECTION).doc(uid).get();
    if (targetSnap.exists && normalizeRole(targetSnap.data()?.role) === "root") {
      throw new HttpsError(
        "failed-precondition",
        "No se puede eliminar a un usuario root.",
      );
    }

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

/**
 * Public self-registration: creates Auth user + pending profile.
 * Login is gated until root calls approveCmsAccess.
 */
export const requestCmsAccess = onCall(
  publicRegistrationOptions,
  async (request: CallableRequest<RequestAccessPayload>) => {
    const email = normalizeEmail(request.data?.email);
    const password = String(request.data?.password ?? "");
    const displayName = String(request.data?.displayName ?? "").trim();
    const phoneCountryRaw = String(request.data?.phoneCountry ?? "").trim().toLowerCase();
    const phoneCountry: "" | PhoneCountry =
      phoneCountryRaw === "mx" || phoneCountryRaw === "us" ? phoneCountryRaw : "";

    if (!isValidEmail(email)) {
      throw new HttpsError("invalid-argument", "El email no es válido.");
    }
    if (password.length < 6) {
      throw new HttpsError("invalid-argument", "La contraseña debe tener al menos 6 caracteres.");
    }

    const phoneResult = normalizeMxUsPhone(request.data?.phone, phoneCountry);
    if (!phoneResult.ok) {
      throw new HttpsError(
        "invalid-argument",
        "El teléfono no es válido. Usa un número de México (+52) o Estados Unidos (+1).",
      );
    }

    const auth = getAuth();
    const db = getFirestore();

    let userRecord;
    try {
      userRecord = await auth.createUser({
        email,
        password,
        displayName: displayName || undefined,
        emailVerified: false,
        disabled: false,
      });
    } catch (error: unknown) {
      const code = getAuthErrorCode(error);
      if (code === "auth/email-already-exists") {
        throw new HttpsError("already-exists", "Ya existe una cuenta con ese email.");
      }
      if (code === "auth/invalid-email") {
        throw new HttpsError("invalid-argument", "El email no es válido.");
      }
      if (code === "auth/invalid-password" || code === "auth/weak-password") {
        throw new HttpsError(
          "invalid-argument",
          "La contraseña no cumple la política de seguridad.",
        );
      }
      console.error("requestCmsAccess auth error:", code || "unknown", error);
      throw new HttpsError("internal", "No se pudo crear la cuenta.");
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
        requestedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      try {
        await auth.deleteUser(userRecord.uid);
      } catch (rollbackError) {
        console.error("requestCmsAccess rollback error:", rollbackError);
      }
      console.error("requestCmsAccess firestore error:", error);
      throw new HttpsError("internal", "No se pudo guardar la solicitud de acceso.");
    }

    return {
      uid: userRecord.uid,
      email,
      approvalStatus: "pending",
    };
  },
);

export const approveCmsAccess = onCall(
  callableOptions,
  async (request: CallableRequest<ApproveAccessPayload>) => {
    await assertRootCaller(request);

    const uid = String(request.data?.uid ?? "").trim();
    if (!uid) {
      throw new HttpsError("invalid-argument", "El UID es obligatorio.");
    }

    const db = getFirestore();
    const auth = getAuth();
    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    const existing = await userRef.get();
    if (!existing.exists) {
      throw new HttpsError("not-found", "No existe la solicitud de acceso.");
    }

    const current = existing.data() ?? {};
    const currentStatus = normalizeApprovalStatus(current.approvalStatus, {
      hasRole: Boolean(normalizeRole(current.role)),
    });
    if (currentStatus === "approved" && normalizeRole(current.role)) {
      throw new HttpsError("failed-precondition", "Esta cuenta ya está aprobada.");
    }
    if (normalizeRole(current.role) === "root") {
      throw new HttpsError("failed-precondition", "No se puede reprocesar una cuenta root.");
    }

    const profileData = buildUserProfileData({
      email: String(current.email ?? ""),
      displayName: request.data?.displayName !== undefined
        ? request.data.displayName
        : current.displayName,
      role: request.data?.role,
      assignedPageIds: request.data?.assignedPageIds,
      pageId: request.data?.pageId,
      isDemo: false,
    }, { requireEmail: false });

    delete profileData.email;

    try {
      await auth.updateUser(uid, {
        disabled: false,
        displayName: String(profileData.displayName || current.displayName || "") || undefined,
      });
    } catch (error: unknown) {
      if (getAuthErrorCode(error) === "auth/user-not-found") {
        throw new HttpsError("not-found", "El usuario no existe en Authentication.");
      }
      console.error("approveCmsAccess auth error:", error);
      throw new HttpsError("internal", "No se pudo habilitar la cuenta.");
    }

    await userRef.set({
      ...profileData,
      approvalStatus: "approved",
      disabled: false,
      approvedAt: FieldValue.serverTimestamp(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    const email = normalizeEmail(current.email);
    let emailResult: EmailSendResult = { sent: false, reason: "missing_to" };
    if (email) {
      emailResult = await sendAccessApprovedEmail({
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
      emailReason: emailResult.reason ?? null,
      emailError: emailResult.emailError ?? null,
    };
  },
);

/** Soft reject: keep Auth + Firestore, disable login. */
export const rejectCmsAccess = onCall(
  callableOptions,
  async (request: CallableRequest<RejectAccessPayload>) => {
    await assertRootCaller(request);

    const uid = String(request.data?.uid ?? "").trim();
    if (!uid) {
      throw new HttpsError("invalid-argument", "El UID es obligatorio.");
    }

    const db = getFirestore();
    const auth = getAuth();
    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    const existing = await userRef.get();
    if (!existing.exists) {
      throw new HttpsError("not-found", "No existe la solicitud de acceso.");
    }

    const current = existing.data() ?? {};
    if (normalizeRole(current.role) === "root") {
      throw new HttpsError("failed-precondition", "No se puede rechazar una cuenta root.");
    }

    try {
      // Soft reject: keep Auth account usable enough to show a clear rejection
      // message after profile load (do not Auth-disable, which maps to "blocked").
      await auth.updateUser(uid, { disabled: false });
    } catch (error: unknown) {
      if (getAuthErrorCode(error) === "auth/user-not-found") {
        throw new HttpsError("not-found", "El usuario no existe en Authentication.");
      }
      console.error("rejectCmsAccess auth error:", error);
      throw new HttpsError("internal", "No se pudo actualizar la cuenta.");
    }

    await userRef.set({
      approvalStatus: "rejected",
      disabled: true,
      rejectedAt: FieldValue.serverTimestamp(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return { uid, approvalStatus: "rejected" };
  },
);
