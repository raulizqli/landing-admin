/**
 * Transactional email for CMS auth flows (approval, password reset, invitations).
 * Uses Resend when RESEND_API_KEY is set; also queues Firestore `mail` docs
 * for the Firebase "Trigger Email" extension if installed.
 */

import { getFirestore } from "firebase-admin/firestore";

export interface SendTransactionalEmailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
  purpose?: string;
}

export interface ApprovalEmailPayload {
  to: string;
  displayName?: string;
  loginUrl: string;
}

export interface PasswordResetEmailPayload {
  to: string;
  resetLink: string;
  displayName?: string;
}

export interface InvitationEmailPayload {
  to: string;
  invitationLink: string;
  displayName?: string;
}

function adminPublicLoginUrl(): string {
  const base = String(process.env.ADMIN_PUBLIC_URL ?? "http://localhost:5173")
    .trim()
    .replace(/\/+$/, "");
  return `${base}/login`;
}

function displayNameOrDefault(displayName: unknown): string {
  return String(displayName ?? "").trim() || "hola";
}

export function buildApprovalEmailContent(payload: ApprovalEmailPayload) {
  const name = displayNameOrDefault(payload.displayName);
  const loginUrl = String(payload.loginUrl || adminPublicLoginUrl()).trim();
  const subject = "Tu acceso a Toqua fue aprobado";
  const text = [
    `${name},`,
    "",
    "Tu solicitud de acceso al panel de Toqua fue aprobada.",
    "Ya puedes iniciar sesión con el email y la contraseña que registraste:",
    loginUrl,
    "",
    "Si no solicitaste esta cuenta, ignora este mensaje.",
  ].join("\n");
  const html = `
    <p>${name},</p>
    <p>Tu solicitud de acceso al panel de <strong>Toqua</strong> fue aprobada.</p>
    <p>Ya puedes iniciar sesión con el email y la contraseña que registraste:</p>
    <p><a href="${loginUrl}">${loginUrl}</a></p>
    <p style="color:#666;font-size:12px">Si no solicitaste esta cuenta, ignora este mensaje.</p>
  `.trim();
  return { subject, text, html, loginUrl };
}

export function buildPasswordResetEmailContent(payload: PasswordResetEmailPayload) {
  const name = displayNameOrDefault(payload.displayName);
  const resetLink = String(payload.resetLink ?? "").trim();
  const subject = "Restablece tu contraseña de Toqua";
  const text = [
    `${name},`,
    "",
    "Recibimos una solicitud para restablecer la contraseña de tu cuenta en Toqua.",
    "Si fuiste tú, abre este enlace para elegir una nueva contraseña:",
    resetLink,
    "",
    "Si no solicitaste este cambio, ignora este mensaje.",
  ].join("\n");
  const html = `
    <p>${name},</p>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Toqua</strong>.</p>
    <p>Si fuiste tú, abre este enlace para elegir una nueva contraseña:</p>
    <p><a href="${resetLink}">${resetLink}</a></p>
    <p style="color:#666;font-size:12px">Si no solicitaste este cambio, ignora este mensaje.</p>
  `.trim();
  return { subject, text, html, resetLink };
}

export function buildInvitationEmailContent(payload: InvitationEmailPayload) {
  const name = displayNameOrDefault(payload.displayName);
  const invitationLink = String(payload.invitationLink ?? "").trim();
  const loginUrl = adminPublicLoginUrl();
  const subject = "Invitación a Toqua";
  const text = [
    `${name},`,
    "",
    "Te invitaron al panel de Toqua.",
    "Abre este enlace para crear tu contraseña y acceder:",
    invitationLink,
    "",
    `Después podrás iniciar sesión en: ${loginUrl}`,
    "",
    "Si no esperabas esta invitación, ignora este mensaje.",
  ].join("\n");
  const html = `
    <p>${name},</p>
    <p>Te invitaron al panel de <strong>Toqua</strong>.</p>
    <p>Abre este enlace para crear tu contraseña y acceder:</p>
    <p><a href="${invitationLink}">${invitationLink}</a></p>
    <p>Después podrás iniciar sesión en <a href="${loginUrl}">${loginUrl}</a>.</p>
    <p style="color:#666;font-size:12px">Si no esperabas esta invitación, ignora este mensaje.</p>
  `.trim();
  return { subject, text, html, invitationLink };
}

export type EmailSendResult = {
  sent: boolean;
  reason:
    | "resend"
    | "missing_resend_config"
    | "resend_error"
    | "send_error"
    | "missing_to"
    | "missing_reset_link"
    | "missing_invitation_link";
  emailError?: string;
};

function parseResendErrorMessage(status: number, body: string): string {
  const trimmed = String(body ?? "").trim().slice(0, 400);
  try {
    const json = JSON.parse(trimmed) as { message?: unknown };
    const message = String(json.message ?? "").trim();
    if (message) return message.slice(0, 240);
  } catch {
    // body is not JSON
  }
  if (trimmed) return `HTTP ${status}: ${trimmed.slice(0, 180)}`;
  return `HTTP ${status}`;
}

async function sendViaResend(to: string, subject: string, text: string, html: string): Promise<EmailSendResult> {
  const apiKey = String(process.env.RESEND_API_KEY ?? "").trim();
  const from = String(process.env.APPROVAL_EMAIL_FROM ?? process.env.RESEND_FROM ?? "").trim();
  if (!apiKey || !from) {
    return { sent: false, reason: "missing_resend_config" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const emailError = parseResendErrorMessage(response.status, body);
    console.error("Resend email failed:", response.status, body);
    return { sent: false, reason: "resend_error", emailError };
  }

  return { sent: true, reason: "resend" };
}

export async function sendTransactionalEmail(payload: SendTransactionalEmailPayload): Promise<EmailSendResult> {
  const to = String(payload.to ?? "").trim().toLowerCase();
  if (!to) {
    return { sent: false, reason: "missing_to" };
  }

  const subject = String(payload.subject ?? "").trim();
  const text = String(payload.text ?? "");
  const html = String(payload.html ?? "");
  const purpose = String(payload.purpose ?? "transactional").trim() || "transactional";

  try {
    await getFirestore().collection("mail").add({
      to: [to],
      message: { subject, text, html },
      createdAt: new Date().toISOString(),
      purpose,
    });
  } catch (error) {
    console.error("mail queue write failed:", error);
  }

  try {
    return await sendViaResend(to, subject, text, html);
  } catch (error) {
    console.error("sendTransactionalEmail error:", error);
    return { sent: false, reason: "send_error", emailError: "No se pudo contactar el servicio de correo." };
  }
}

export async function sendAccessApprovedEmail(payload: ApprovalEmailPayload): Promise<EmailSendResult & { loginUrl?: string }> {
  const to = String(payload.to ?? "").trim().toLowerCase();
  if (!to) {
    return { sent: false, reason: "missing_to" };
  }

  const { subject, text, html, loginUrl } = buildApprovalEmailContent({
    ...payload,
    to,
    loginUrl: payload.loginUrl || adminPublicLoginUrl(),
  });

  const result = await sendTransactionalEmail({
    to,
    subject,
    text,
    html,
    purpose: "cms_access_approved",
  });

  return { ...result, loginUrl };
}

export async function sendPasswordResetEmail(payload: PasswordResetEmailPayload): Promise<EmailSendResult> {
  const to = String(payload.to ?? "").trim().toLowerCase();
  if (!to) {
    return { sent: false, reason: "missing_to" };
  }

  const resetLink = String(payload.resetLink ?? "").trim();
  if (!resetLink) {
    return { sent: false, reason: "missing_reset_link" };
  }

  const { subject, text, html } = buildPasswordResetEmailContent({
    ...payload,
    to,
    resetLink,
  });

  return sendTransactionalEmail({
    to,
    subject,
    text,
    html,
    purpose: "cms_password_reset",
  });
}

export async function sendInvitationEmail(payload: InvitationEmailPayload): Promise<EmailSendResult> {
  const to = String(payload.to ?? "").trim().toLowerCase();
  if (!to) {
    return { sent: false, reason: "missing_to" };
  }

  const invitationLink = String(payload.invitationLink ?? "").trim();
  if (!invitationLink) {
    return { sent: false, reason: "missing_invitation_link" };
  }

  const { subject, text, html } = buildInvitationEmailContent({
    ...payload,
    to,
    invitationLink,
  });

  return sendTransactionalEmail({
    to,
    subject,
    text,
    html,
    purpose: "cms_user_invitation",
  });
}
