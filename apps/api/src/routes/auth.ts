import { Router, Request, Response } from 'express'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { authRateLimiter } from '../middleware/rateLimiter'
import { sanitizeInput } from '../utils/sanitize'
import { sendEmail } from '../services/emailService'
import { generateVerificationToken } from '../utils/tokens'

const router = Router()

// ── Helpers ───────────────────────────────────────────────────────────────────

function getIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'] as string | undefined
  return forwarded?.split(',')[0]?.trim() || req.ip || 'unknown'
}

function getUserAgent(req: Request): string {
  return (req.headers['user-agent'] as string | undefined) || 'unknown'
}

function signAccess(userId: string, role: string): string {
  return jwt.sign(
    { sub: userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  )
}

function signRefresh(userId: string): string {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  )
}

const REFRESH_COOKIE = 'adw_refresh'
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
}

// ── POST /auth/register ───────────────────────────────────────────────────────

const registerSchema = z.object({
  email:    z.string().email().max(255),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(128),
})

router.post('/register', authRateLimiter, async (req: Request, res: Response) => {
  const ip = getIp(req)

  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.errors[0]?.message ?? 'Donnees invalides',
      code: 'VALIDATION_ERROR',
    })
  }

  const { email, username, password } = parsed.data
  const normalizedEmail = sanitizeInput(email.toLowerCase().trim())
  const normalizedUsername = sanitizeInput(username.trim())

  // Check for existing account
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: normalizedEmail },
        { username: normalizedUsername },
      ],
    },
  })

  if (existing) {
    const field = existing.email === normalizedEmail ? 'email' : 'username'
    return res.status(409).json({
      error: `Ce ${field} est deja utilise`,
      code: 'ALREADY_EXISTS',
    })
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: parseInt(process.env.ARGON2_MEMORY_COST || '65536'),
    timeCost: parseInt(process.env.ARGON2_TIME_COST || '3'),
    parallelism: parseInt(process.env.ARGON2_PARALLELISM || '4'),
  })

  const verificationToken = generateVerificationToken()

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      username: normalizedUsername,
      passwordHash,
      emailVerificationToken: verificationToken,
      subscription: {
        create: {
          plan: 'FREE',
          status: 'ACTIVE',
          searchesPerDay: 100,
          searchesUsedToday: 0,
          lastResetAt: new Date(),
        },
      },
    },
    select: { id: true, email: true, username: true, role: true },
  })

  // Log registration activity
  await prisma.ipLog.create({
    data: {
      userId: user.id,
      ipAddress: ip,
      action: 'REGISTER',
      details: { userAgent: getUserAgent(req) },
    },
  }).catch(() => {})

  // Send verification email (non-blocking)
  sendEmail({
    to: user.email,
    subject: 'Verifiez votre adresse email — ADW Searcher',
    template: 'email-verification',
    data: { username: user.username, token: verificationToken },
  }).catch(() => {})

  const accessToken  = signAccess(user.id, user.role)
  const refreshToken = signRefresh(user.id)

  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  })

  res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS)

  res.status(201).json({
    user,
    accessToken,
    message: 'Compte cree avec succes. Verifiez votre email.',
  })
})

// ── POST /auth/login ──────────────────────────────────────────────────────────

const loginSchema = z.object({
  email:    z.string().email().max(255),
  password: z.string().min(1).max(128),
  totpCode: z.string().length(6).optional(),
})

router.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  const ip = getIp(req)

  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Email ou mot de passe invalide',
      code: 'VALIDATION_ERROR',
    })
  }

  const { email, password, totpCode } = parsed.data
  const normalizedEmail = email.toLowerCase().trim()

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { subscription: { select: { plan: true, status: true, searchesPerDay: true, searchesUsedToday: true } } },
  })

  if (!user) {
    // Log failed login (no userId — user not found)
    await prisma.ipLog.create({
      data: {
        ipAddress: ip,
        action: 'FAILED_LOGIN',
        details: { email: normalizedEmail, reason: 'USER_NOT_FOUND', userAgent: getUserAgent(req) },
      },
    }).catch(() => {})

    return res.status(401).json({
      error: 'Email ou mot de passe incorrect',
      code: 'INVALID_CREDENTIALS',
    })
  }

  const passwordValid = await argon2.verify(user.passwordHash, password)

  if (!passwordValid) {
    await prisma.ipLog.create({
      data: {
        userId: user.id,
        ipAddress: ip,
        action: 'FAILED_LOGIN',
        details: { reason: 'INVALID_PASSWORD', userAgent: getUserAgent(req) },
      },
    }).catch(() => {})

    // Increment failed attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: { increment: 1 },
        lastFailedLoginAt: new Date(),
      },
    }).catch(() => {})

    return res.status(401).json({
      error: 'Email ou mot de passe incorrect',
      code: 'INVALID_CREDENTIALS',
    })
  }

  if (!user.isActive) {
    await prisma.ipLog.create({
      data: {
        userId: user.id,
        ipAddress: ip,
        action: 'FAILED_LOGIN',
        details: { reason: 'ACCOUNT_SUSPENDED', userAgent: getUserAgent(req) },
      },
    }).catch(() => {})

    return res.status(403).json({
      error: 'Votre compte est suspendu. Contactez le support.',
      code: 'ACCOUNT_SUSPENDED',
    })
  }

  // 2FA check
  if (user.twoFactorEnabled) {
    if (!totpCode) {
      return res.status(200).json({ requiresTwoFactor: true })
    }
    const { verifyTotp } = await import('../utils/totp')
    const valid = verifyTotp(user.twoFactorSecret!, totpCode)
    if (!valid) {
      await prisma.ipLog.create({
        data: {
          userId: user.id,
          ipAddress: ip,
          action: 'FAILED_LOGIN',
          details: { reason: 'INVALID_2FA', userAgent: getUserAgent(req) },
        },
      }).catch(() => {})

      return res.status(401).json({
        error: 'Code de verification invalide',
        code: 'INVALID_2FA',
      })
    }
  }

  // Reset failed login counter
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lastLoginAt: new Date() },
  })

  // Log successful login
  await prisma.ipLog.create({
    data: {
      userId: user.id,
      ipAddress: ip,
      action: 'LOGIN',
      details: {
        userAgent: getUserAgent(req),
        twoFactorUsed: user.twoFactorEnabled,
      },
    },
  }).catch(() => {})

  const accessToken  = signAccess(user.id, user.role)
  const refreshToken = signRefresh(user.id)

  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  })

  res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS)

  res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      subscription: user.subscription,
    },
    accessToken,
  })
})

// ── POST /auth/logout ─────────────────────────────────────────────────────────

router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  const ip = getIp(req)
  const refreshToken = req.cookies?.[REFRESH_COOKIE]

  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => {})
  }

  // Log logout
  await prisma.ipLog.create({
    data: {
      userId: req.user!.id,
      ipAddress: ip,
      action: 'LOGOUT',
      details: { userAgent: getUserAgent(req) },
    },
  }).catch(() => {})

  res.clearCookie(REFRESH_COOKIE, { path: '/' })
  res.json({ success: true })
})

// ── POST /auth/refresh ────────────────────────────────────────────────────────

router.post('/refresh', async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE]
  if (!token) {
    return res.status(401).json({ error: 'Token manquant', code: 'NO_REFRESH_TOKEN' })
  }

  let payload: { sub: string }
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { sub: string }
  } catch {
    res.clearCookie(REFRESH_COOKIE, { path: '/' })
    return res.status(401).json({ error: 'Token invalide', code: 'INVALID_REFRESH_TOKEN' })
  }

  const stored = await prisma.refreshToken.findFirst({
    where: { token, userId: payload.sub },
  })

  if (!stored) {
    res.clearCookie(REFRESH_COOKIE, { path: '/' })
    return res.status(401).json({ error: 'Token revoque', code: 'TOKEN_REVOKED' })
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, isActive: true },
  })

  if (!user || !user.isActive) {
    res.clearCookie(REFRESH_COOKIE, { path: '/' })
    return res.status(403).json({ error: 'Compte inactif', code: 'ACCOUNT_INACTIVE' })
  }

  // Rotate refresh token
  const newRefresh = signRefresh(user.id)
  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { id: stored.id } }),
    prisma.refreshToken.create({
      data: { userId: user.id, token: newRefresh, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    }),
  ])

  res.cookie(REFRESH_COOKIE, newRefresh, COOKIE_OPTS)
  res.json({ accessToken: signAccess(user.id, user.role) })
})

// ── GET /auth/me ──────────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      twoFactorEnabled: true,
      createdAt: true,
      lastLoginAt: true,
      subscription: {
        select: {
          plan: true,
          status: true,
          currentPeriodEnd: true,
          searchesPerDay: true,
          searchesUsedToday: true,
          lastResetAt: true,
        },
      },
    },
  })

  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable', code: 'USER_NOT_FOUND' })
  }

  res.json(user)
})

// ── POST /auth/verify-email ───────────────────────────────────────────────────

router.post('/verify-email', async (req: Request, res: Response) => {
  const { token } = req.body
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token requis', code: 'MISSING_TOKEN' })
  }

  const user = await prisma.user.findFirst({
    where: { emailVerificationToken: token },
  })

  if (!user) {
    return res.status(400).json({ error: 'Token invalide ou expire', code: 'INVALID_TOKEN' })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true, emailVerificationToken: null },
  })

  res.json({ success: true })
})

// ── POST /auth/forgot-password ────────────────────────────────────────────────

router.post('/forgot-password', authRateLimiter, async (req: Request, res: Response) => {
  const { email } = req.body
  if (!email) {
    return res.status(400).json({ error: 'Email requis', code: 'MISSING_EMAIL' })
  }

  const user = await prisma.user.findUnique({
    where: { email: sanitizeInput(email.toLowerCase().trim()) },
  })

  // Always respond success to prevent user enumeration
  if (user) {
    const token = generateVerificationToken()
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: new Date(Date.now() + 3600_000) },
    })

    sendEmail({
      to: user.email,
      subject: 'Reinitialisation de votre mot de passe — ADW Searcher',
      template: 'password-reset',
      data: { username: user.username, token },
    }).catch(() => {})
  }

  res.json({ success: true, message: 'Si ce compte existe, un email a ete envoye.' })
})

// ── POST /auth/reset-password ─────────────────────────────────────────────────

router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body
  if (!token || !password || password.length < 8) {
    return res.status(400).json({ error: 'Token et mot de passe requis (min 8 car.)', code: 'VALIDATION_ERROR' })
  }

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: { gt: new Date() },
    },
  })

  if (!user) {
    return res.status(400).json({ error: 'Token invalide ou expire', code: 'INVALID_TOKEN' })
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: parseInt(process.env.ARGON2_MEMORY_COST || '65536'),
    timeCost: parseInt(process.env.ARGON2_TIME_COST || '3'),
    parallelism: parseInt(process.env.ARGON2_PARALLELISM || '4'),
  })

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
  })

  // Revoke all refresh tokens on password reset
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } })

  res.json({ success: true })
})

export default router
