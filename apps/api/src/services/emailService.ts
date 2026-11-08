import nodemailer from 'nodemailer'
import { logger } from '../lib/logger'

const appUrl = process.env.APP_URL || 'http://localhost:3000'
const appName = process.env.APP_NAME || 'ADW Intelligence'
const emailFrom = process.env.EMAIL_FROM || `${appName} <noreply@adw-intelligence.com>`

// ── Transport email ───────────────────────────────────────────
function createTransport() {
  if (process.env.RESEND_API_KEY) {
    // Utiliser Resend via SMTP
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY,
      },
    })
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

// ── Template HTML de base ─────────────────────────────────────
function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #050505; color: #F5F5F5; }
    .container { max-width: 600px; margin: 40px auto; background: #101010; border: 1px solid #333; border-radius: 12px; overflow: hidden; }
    .header { padding: 32px 40px; border-bottom: 1px solid #1A1A1A; }
    .logo { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; color: #FFFFFF; }
    .logo span { color: #A1A1A1; }
    .body { padding: 40px; }
    .title { font-size: 24px; font-weight: 700; margin-bottom: 16px; color: #FFFFFF; }
    .text { font-size: 15px; line-height: 1.6; color: #A1A1A1; margin-bottom: 24px; }
    .button { display: inline-block; padding: 14px 28px; background: #FFFFFF; color: #050505; font-weight: 600; font-size: 14px; text-decoration: none; border-radius: 8px; margin-bottom: 24px; }
    .link { font-size: 13px; color: #777777; word-break: break-all; }
    .footer { padding: 24px 40px; border-top: 1px solid #1A1A1A; font-size: 12px; color: #777777; text-align: center; }
    .divider { height: 1px; background: #1A1A1A; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">ADW<span> Intelligence</span></div>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>${appName} · Email automatique, ne pas répondre.</p>
      <p style="margin-top: 8px;">© ${new Date().getFullYear()} ${appName}. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>`
}

// ── Envoi d'email générique ───────────────────────────────────
async function sendEmail(options: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  try {
    const transport = createTransport()
    await transport.sendMail({
      from: emailFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
    logger.info(`Email envoyé à ${options.to}: ${options.subject}`)
  } catch (error) {
    logger.error('Erreur envoi email:', error)
    throw error
  }
}

// ── Email de vérification ─────────────────────────────────────
export async function sendEmailVerification(
  email: string,
  firstName: string,
  token: string
): Promise<void> {
  const verifyUrl = `${appUrl}/verify-email?token=${token}`

  await sendEmail({
    to: email,
    subject: `Vérifiez votre adresse email — ${appName}`,
    html: baseTemplate(`
      <p class="title">Bonjour ${firstName},</p>
      <p class="text">Merci de vous être inscrit sur ${appName}. Cliquez sur le bouton ci-dessous pour vérifier votre adresse email et activer votre compte.</p>
      <a href="${verifyUrl}" class="button">Vérifier mon email</a>
      <div class="divider"></div>
      <p class="text">Si vous n'avez pas créé de compte, ignorez cet email.</p>
      <p class="link">Lien : ${verifyUrl}</p>
    `),
  })
}

// ── Email de réinitialisation du mot de passe ─────────────────
export async function sendPasswordReset(
  email: string,
  firstName: string,
  token: string
): Promise<void> {
  const resetUrl = `${appUrl}/reset-password?token=${token}`

  await sendEmail({
    to: email,
    subject: `Réinitialisation de votre mot de passe — ${appName}`,
    html: baseTemplate(`
      <p class="title">Réinitialisation du mot de passe</p>
      <p class="text">Bonjour ${firstName}, vous avez demandé la réinitialisation de votre mot de passe. Ce lien est valide 1 heure.</p>
      <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
      <div class="divider"></div>
      <p class="text">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email et votre mot de passe restera inchangé.</p>
      <p class="link">Lien : ${resetUrl}</p>
    `),
  })
}

// ── Alerte de nouvelle connexion ──────────────────────────────
export async function sendNewLoginAlert(
  email: string,
  firstName: string,
  details: { ipAddress?: string; location?: string; device?: string }
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Nouvelle connexion détectée — ${appName}`,
    html: baseTemplate(`
      <p class="title">Nouvelle connexion à votre compte</p>
      <p class="text">Bonjour ${firstName}, une connexion à votre compte ${appName} a été détectée depuis un nouvel appareil ou emplacement.</p>
      <div class="divider"></div>
      <p class="text">
        <strong style="color: #F5F5F5">IP :</strong> ${details.ipAddress || 'Inconnue'}<br>
        <strong style="color: #F5F5F5">Appareil :</strong> ${details.device || 'Inconnu'}<br>
        <strong style="color: #F5F5F5">Heure :</strong> ${new Date().toLocaleString('fr-FR')}
      </p>
      <div class="divider"></div>
      <p class="text">Si ce n'était pas vous, réinitialisez immédiatement votre mot de passe et activez l'authentification à deux facteurs.</p>
      <a href="${appUrl}/dashboard/security" class="button">Sécuriser mon compte</a>
    `),
  })
}

// ── Email de ticket créé ───────────────────────────────────────
export async function sendTicketCreated(
  email: string,
  firstName: string,
  ticketId: string,
  subject: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Ticket #${ticketId} créé — ${appName}`,
    html: baseTemplate(`
      <p class="title">Ticket de support créé</p>
      <p class="text">Bonjour ${firstName}, votre ticket "${subject}" a bien été créé. Notre équipe reviendra vers vous dans les meilleurs délais.</p>
      <a href="${appUrl}/dashboard/support/${ticketId}" class="button">Voir mon ticket</a>
    `),
  })
}
