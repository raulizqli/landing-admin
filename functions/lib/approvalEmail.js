"use strict";
/**
 * Transactional email for CMS auth flows (approval, password reset, invitations).
 * Uses Resend when RESEND_API_KEY is set; also queues Firestore `mail` docs
 * for the Firebase "Trigger Email" extension if installed.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApprovalEmailContent = buildApprovalEmailContent;
exports.buildPasswordResetEmailContent = buildPasswordResetEmailContent;
exports.buildInvitationEmailContent = buildInvitationEmailContent;
exports.sendTransactionalEmail = sendTransactionalEmail;
exports.sendAccessApprovedEmail = sendAccessApprovedEmail;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
exports.sendInvitationEmail = sendInvitationEmail;
const firestore_1 = require("firebase-admin/firestore");
function adminPublicLoginUrl() {
    var _a;
    const base = String((_a = process.env.ADMIN_PUBLIC_URL) !== null && _a !== void 0 ? _a : "http://localhost:5173")
        .trim()
        .replace(/\/+$/, "");
    return `${base}/login`;
}
function displayNameOrDefault(displayName) {
    return String(displayName !== null && displayName !== void 0 ? displayName : "").trim() || "hola";
}
function buildApprovalEmailContent(payload) {
    const name = displayNameOrDefault(payload.displayName);
    const loginUrl = String(payload.loginUrl || adminPublicLoginUrl()).trim();
    const subject = "Tu acceso a TapSite fue aprobado";
    const text = [
        `${name},`,
        "",
        "Tu solicitud de acceso al panel de TapSite fue aprobada.",
        "Ya puedes iniciar sesión con el email y la contraseña que registraste:",
        loginUrl,
        "",
        "Si no solicitaste esta cuenta, ignora este mensaje.",
    ].join("\n");
    const html = `
    <p>${name},</p>
    <p>Tu solicitud de acceso al panel de <strong>TapSite</strong> fue aprobada.</p>
    <p>Ya puedes iniciar sesión con el email y la contraseña que registraste:</p>
    <p><a href="${loginUrl}">${loginUrl}</a></p>
    <p style="color:#666;font-size:12px">Si no solicitaste esta cuenta, ignora este mensaje.</p>
  `.trim();
    return { subject, text, html, loginUrl };
}
function buildPasswordResetEmailContent(payload) {
    var _a;
    const name = displayNameOrDefault(payload.displayName);
    const resetLink = String((_a = payload.resetLink) !== null && _a !== void 0 ? _a : "").trim();
    const subject = "Restablece tu contraseña de TapSite";
    const text = [
        `${name},`,
        "",
        "Recibimos una solicitud para restablecer la contraseña de tu cuenta en TapSite.",
        "Si fuiste tú, abre este enlace para elegir una nueva contraseña:",
        resetLink,
        "",
        "Si no solicitaste este cambio, ignora este mensaje.",
    ].join("\n");
    const html = `
    <p>${name},</p>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>TapSite</strong>.</p>
    <p>Si fuiste tú, abre este enlace para elegir una nueva contraseña:</p>
    <p><a href="${resetLink}">${resetLink}</a></p>
    <p style="color:#666;font-size:12px">Si no solicitaste este cambio, ignora este mensaje.</p>
  `.trim();
    return { subject, text, html, resetLink };
}
function buildInvitationEmailContent(payload) {
    var _a;
    const name = displayNameOrDefault(payload.displayName);
    const invitationLink = String((_a = payload.invitationLink) !== null && _a !== void 0 ? _a : "").trim();
    const loginUrl = adminPublicLoginUrl();
    const subject = "Invitación a TapSite";
    const text = [
        `${name},`,
        "",
        "Te invitaron al panel de TapSite.",
        "Abre este enlace para crear tu contraseña y acceder:",
        invitationLink,
        "",
        `Después podrás iniciar sesión en: ${loginUrl}`,
        "",
        "Si no esperabas esta invitación, ignora este mensaje.",
    ].join("\n");
    const html = `
    <p>${name},</p>
    <p>Te invitaron al panel de <strong>TapSite</strong>.</p>
    <p>Abre este enlace para crear tu contraseña y acceder:</p>
    <p><a href="${invitationLink}">${invitationLink}</a></p>
    <p>Después podrás iniciar sesión en <a href="${loginUrl}">${loginUrl}</a>.</p>
    <p style="color:#666;font-size:12px">Si no esperabas esta invitación, ignora este mensaje.</p>
  `.trim();
    return { subject, text, html, invitationLink };
}
async function sendViaResend(to, subject, text, html) {
    var _a, _b, _c;
    const apiKey = String((_a = process.env.RESEND_API_KEY) !== null && _a !== void 0 ? _a : "").trim();
    const from = String((_c = (_b = process.env.APPROVAL_EMAIL_FROM) !== null && _b !== void 0 ? _b : process.env.RESEND_FROM) !== null && _c !== void 0 ? _c : "").trim();
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
        console.error("Resend email failed:", response.status, body);
        return { sent: false, reason: "resend_error" };
    }
    return { sent: true, reason: "resend" };
}
async function sendTransactionalEmail(payload) {
    var _a, _b, _c, _d, _e;
    const to = String((_a = payload.to) !== null && _a !== void 0 ? _a : "").trim().toLowerCase();
    if (!to) {
        return { sent: false, reason: "missing_to" };
    }
    const subject = String((_b = payload.subject) !== null && _b !== void 0 ? _b : "").trim();
    const text = String((_c = payload.text) !== null && _c !== void 0 ? _c : "");
    const html = String((_d = payload.html) !== null && _d !== void 0 ? _d : "");
    const purpose = String((_e = payload.purpose) !== null && _e !== void 0 ? _e : "transactional").trim() || "transactional";
    try {
        await (0, firestore_1.getFirestore)().collection("mail").add({
            to: [to],
            message: { subject, text, html },
            createdAt: new Date().toISOString(),
            purpose,
        });
    }
    catch (error) {
        console.error("mail queue write failed:", error);
    }
    try {
        return await sendViaResend(to, subject, text, html);
    }
    catch (error) {
        console.error("sendTransactionalEmail error:", error);
        return { sent: false, reason: "send_error" };
    }
}
async function sendAccessApprovedEmail(payload) {
    var _a;
    const to = String((_a = payload.to) !== null && _a !== void 0 ? _a : "").trim().toLowerCase();
    if (!to) {
        return { sent: false, reason: "missing_to" };
    }
    const { subject, text, html, loginUrl } = buildApprovalEmailContent(Object.assign(Object.assign({}, payload), { to, loginUrl: payload.loginUrl || adminPublicLoginUrl() }));
    const result = await sendTransactionalEmail({
        to,
        subject,
        text,
        html,
        purpose: "cms_access_approved",
    });
    return Object.assign(Object.assign({}, result), { loginUrl });
}
async function sendPasswordResetEmail(payload) {
    var _a, _b;
    const to = String((_a = payload.to) !== null && _a !== void 0 ? _a : "").trim().toLowerCase();
    if (!to) {
        return { sent: false, reason: "missing_to" };
    }
    const resetLink = String((_b = payload.resetLink) !== null && _b !== void 0 ? _b : "").trim();
    if (!resetLink) {
        return { sent: false, reason: "missing_reset_link" };
    }
    const { subject, text, html } = buildPasswordResetEmailContent(Object.assign(Object.assign({}, payload), { to,
        resetLink }));
    return sendTransactionalEmail({
        to,
        subject,
        text,
        html,
        purpose: "cms_password_reset",
    });
}
async function sendInvitationEmail(payload) {
    var _a, _b;
    const to = String((_a = payload.to) !== null && _a !== void 0 ? _a : "").trim().toLowerCase();
    if (!to) {
        return { sent: false, reason: "missing_to" };
    }
    const invitationLink = String((_b = payload.invitationLink) !== null && _b !== void 0 ? _b : "").trim();
    if (!invitationLink) {
        return { sent: false, reason: "missing_invitation_link" };
    }
    const { subject, text, html } = buildInvitationEmailContent(Object.assign(Object.assign({}, payload), { to,
        invitationLink }));
    return sendTransactionalEmail({
        to,
        subject,
        text,
        html,
        purpose: "cms_user_invitation",
    });
}
//# sourceMappingURL=approvalEmail.js.map