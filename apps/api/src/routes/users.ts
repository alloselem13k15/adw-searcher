import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'
import * as OTPAuth from 'otpauth'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import crypto from 'crypto'
import { requireAuth } from '../middleware/auth'
import { sanitizeInput } from '../middleware/security'
import { z } from 'zod'

const router = Router()
const prisma = new PrismaClient()

// ── Profile ───────────────────────────────────────────────────────────────────

router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, email: true, username: true, role: true,
      plan: true, credits: true, emailVerified: true,
      twoFactorEnabled: true, createdAt: true, updatedAt: true,
      _count: { select: { searchHistory: true, apiKeys: true } },
    },
  })
  res.json({ data: user })
})

router.patch('/profile', requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message })

  const { username } = parsed.data

  if (username) {
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing && existing.id !== req.user!.id) {
      return res.status(409).json({ error: 'Ce nom d\'utilisateur est déjà pris' })
    }
  }

  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: { username },
    select: { id: true, email: true, username: true, role: true, plan: true, credits: true },
  })

  res.json({ data: updated })
})

router.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8).max(128),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message })

  const { currentPassword, newPassword } = parsed.data

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

  const valid = await argon2.verify(user.password, currentPassword)
  if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect' })

  const hashed = await argon2.hash(newPassword, {
    type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4,
  })

  await prisma.user.update({ where: { id: req.user!.id }, data: { password: hashed } })

  // Invalidate all refresh tokens
  await prisma.refreshToken.deleteMany({ where: { userId: req.user!.id } })

  res.json({ message: 'Mot de passe mis à jour' })
})

// ── 2FA ──────────────────────────────────────────────────────────────────────

router.post('/2fa/setup', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user) return res.status(404).json({ error: 'Introuvable' })
  if (user.twoFactorEnabled) return res.status(400).json({ error: '2FA déjà activé' })

  const secret = authenticator.generateSecret()
  const totp = new OTPAuth.TOTP({
    issuer: 'ADW Intelligence',
    label: user.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  })

  const otpAuthUrl = totp.toString()
  const qrCode = await QRCode.toDataURL(otpAuthUrl)

  const backupCodes = Array.from({ length: 8 }, () =>
    crypto.randomBytes(5).toString('hex').toUpperCase()
  )
  const hashedBackupCodes = await Promise.all(backupCodes.map(c => argon2.hash(c)))

  await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      twoFactorSecret: secret,
      twoFactorBackupCodes: hashedBackupCodes,
    },
  })

  res.json({ data: { qrCode, secret, backupCodes } })
})

router.post('/2fa/verify', requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({ code: z.string().length(6) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Code invalide' })

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user?.twoFactorSecret) return res.status(400).json({ error: 'Setup 2FA requis' })

  const isValid = authenticator.verify({ token: parsed.data.code, secret: user.twoFactorSecret })
  if (!isValid) return res.status(401).json({ error: 'Code incorrect' })

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { twoFactorEnabled: true },
  })

  res.json({ message: '2FA activé avec succès' })
})

router.post('/2fa/disable', requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({ code: z.string() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Code requis' })

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    return res.status(400).json({ error: '2FA non activé' })
  }

  const totpValid = authenticator.verify({ token: parsed.data.code, secret: user.twoFactorSecret })

  if (!totpValid) {
    // Try backup codes
    let backupValid = false
    for (const hashed of (user.twoFactorBackupCodes ?? [])) {
      if (await argon2.verify(hashed, parsed.data.code)) { backupValid = true; break }
    }
    if (!backupValid) return res.status(401).json({ error: 'Code incorrect' })
  }

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: [] },
  })

  res.json({ message: '2FA désactivé' })
})

// ── Sessions ──────────────────────────────────────────────────────────────────

router.get('/sessions', requireAuth, async (req: Request, res: Response) => {
  const sessions = await prisma.refreshToken.findMany({
    where: { userId: req.user!.id, expiresAt: { gt: new Date() } },
    select: { id: true, createdAt: true, expiresAt: true, userAgent: true, ipAddress: true },
    orderBy: { createdAt: 'desc' },
  })

  const currentToken = req.cookies?.refresh_token
  const sessionsWithCurrent = sessions.map(s => ({
    ...s,
    isCurrent: false, // We'd need to store token hash to match precisely
  }))

  res.json({ data: sessionsWithCurrent })
})

router.delete('/sessions/:id', requireAuth, async (req: Request, res: Response) => {
  await prisma.refreshToken.deleteMany({
    where: { id: req.params.id, userId: req.user!.id },
  })
  res.json({ message: 'Session révoquée' })
})

router.delete('/sessions', requireAuth, async (req: Request, res: Response) => {
  await prisma.refreshToken.deleteMany({ where: { userId: req.user!.id } })
  res.json({ message: 'Toutes les sessions révoquées' })
})

// ── Notifications ─────────────────────────────────────────────────────────────

router.get('/notifications', requireAuth, async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = 20
  const skip = (page - 1) * limit

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId: req.user!.id } }),
  ])

  const unreadCount = await prisma.notification.count({
    where: { userId: req.user!.id, read: false },
  })

  res.json({ data: notifications, total, unreadCount, page, totalPages: Math.ceil(total / limit) })
})

router.patch('/notifications/:id/read', requireAuth, async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: { read: true },
  })
  res.json({ message: 'OK' })
})

router.post('/notifications/read-all', requireAuth, async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, read: false },
    data: { read: true },
  })
  res.json({ message: 'OK' })
})

// ── API Keys ──────────────────────────────────────────────────────────────────

router.get('/api-keys', requireAuth, async (req: Request, res: Response) => {
  const keys = await prisma.apiKey.findMany({
    where: { userId: req.user!.id },
    select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, createdAt: true, isActive: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ data: keys })
})

router.post('/api-keys', requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({ name: z.string().min(1).max(60) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message })

  const count = await prisma.apiKey.count({ where: { userId: req.user!.id } })
  if (count >= 10) return res.status(400).json({ error: 'Maximum 10 clés API par compte' })

  const rawKey = `adw_${crypto.randomBytes(32).toString('hex')}`
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
  const keyPrefix = rawKey.slice(0, 10)

  const key = await prisma.apiKey.create({
    data: {
      userId: req.user!.id,
      name: sanitizeInput(parsed.data.name),
      keyHash,
      keyPrefix,
    },
  })

  res.status(201).json({ data: { id: key.id, name: key.name, key: rawKey, keyPrefix } })
})

router.delete('/api-keys/:id', requireAuth, async (req: Request, res: Response) => {
  await prisma.apiKey.deleteMany({
    where: { id: req.params.id, userId: req.user!.id },
  })
  res.json({ message: 'Clé supprimée' })
})

// ── GDPR ──────────────────────────────────────────────────────────────────────

router.get('/gdpr/export', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      searchHistory: { orderBy: { createdAt: 'desc' }, take: 1000 },
      tickets: { include: { messages: true } },
      notifications: { take: 500 },
    },
  })

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: {
      id: user!.id,
      email: user!.email,
      username: user!.username,
      role: user!.role,
      plan: user!.plan,
      createdAt: user!.createdAt,
    },
    searchHistory: user!.searchHistory.map(h => ({
      type: h.searchType,
      query: h.query,
      creditsUsed: h.creditsUsed,
      date: h.createdAt,
    })),
    supportTickets: user!.tickets.map(t => ({
      subject: t.subject,
      status: t.status,
      createdAt: t.createdAt,
      messages: t.messages.map(m => ({ content: m.content, createdAt: m.createdAt })),
    })),
  }

  res.setHeader('Content-Disposition', 'attachment; filename=adw-data-export.json')
  res.setHeader('Content-Type', 'application/json')
  res.json(exportData)
})

router.post('/gdpr/delete', requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({ confirmation: z.literal('SUPPRIMER') })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Confirmation invalide' })

  // Soft-delete: anonymize the account
  const anonymized = `deleted_${Date.now()}`
  await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      email: `${anonymized}@deleted.adw`,
      username: anonymized,
      password: 'DELETED',
      isActive: false,
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  })

  // Delete tokens
  await prisma.refreshToken.deleteMany({ where: { userId: req.user!.id } })
  await prisma.apiKey.deleteMany({ where: { userId: req.user!.id } })

  res.clearCookie('refresh_token')
  res.json({ message: 'Compte supprimé' })
})

// ── Search history ────────────────────────────────────────────────────────────

router.get('/search-history', requireAuth, async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = parseInt(req.query.limit as string) || 10
  const skip = (page - 1) * limit

  const [history, total] = await Promise.all([
    prisma.searchHistory.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.searchHistory.count({ where: { userId: req.user!.id } }),
  ])

  res.json({ data: history, total, page, totalPages: Math.ceil(total / limit) })
})

export default router
