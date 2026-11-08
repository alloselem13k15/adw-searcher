import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'
import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'
import { deleteCache, setCache } from '../lib/redis'
import type { AuthPayload } from '../middleware/auth'

// ── Configuration Argon2id ────────────────────────────────────
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: parseInt(process.env.ARGON2_MEMORY_COST || '65536'),
  timeCost: parseInt(process.env.ARGON2_TIME_COST || '3'),
  parallelism: parseInt(process.env.ARGON2_PARALLELISM || '4'),
}

// ── Hachage du mot de passe ───────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS)
}

export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  return argon2.verify(hash, password, ARGON2_OPTIONS)
}

// ── Génération des tokens JWT ──────────────────────────────────
export function generateAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    issuer: 'adw-intelligence',
    audience: 'adw-client',
  })
}

export function generateRefreshToken(): string {
  return randomBytes(64).toString('hex')
}

export function generateSecureToken(): string {
  return randomBytes(32).toString('hex')
}

// ── Création d'une session ─────────────────────────────────────
export async function createSession(
  userId: string,
  options: { ipAddress?: string; userAgent?: string } = {}
): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
  // Créer l'entrée de session en base
  const refreshToken = generateRefreshToken()
  const session = await prisma.session.create({
    data: {
      userId,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    },
  })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true },
  })

  const payload: AuthPayload = {
    userId,
    email: user!.email,
    role: user!.role,
    sessionId: session.id,
  }

  const accessToken = generateAccessToken(payload)

  return { accessToken, refreshToken, sessionId: session.id }
}

// ── Révocation d'une session ───────────────────────────────────
export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: { revoked: true },
  })
}

// ── Révocation de toutes les sessions ─────────────────────────
export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  })
  await deleteCache(`user:${userId}:sessions`)
}

// ── Rafraîchissement du token ─────────────────────────────────
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: {
      user: { select: { id: true, email: true, role: true, status: true } },
    },
  })

  if (!session || session.revoked || session.expiresAt < new Date()) {
    return null
  }

  if (session.user.status !== 'ACTIVE') {
    return null
  }

  // Rotation du refresh token (single-use)
  const newRefreshToken = generateRefreshToken()
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.session.update({
    where: { id: session.id },
    data: { refreshToken: newRefreshToken, expiresAt: newExpiresAt },
  })

  const payload: AuthPayload = {
    userId: session.userId,
    email: session.user.email,
    role: session.user.role,
    sessionId: session.id,
  }

  const accessToken = generateAccessToken(payload)

  return { accessToken, refreshToken: newRefreshToken }
}

// ── Génération du token email ──────────────────────────────────
export async function createEmailVerificationToken(
  userId: string
): Promise<string> {
  const token = generateSecureToken()
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerificationToken: token },
  })
  // Stocker aussi en Redis avec TTL de 24h
  await setCache(`email_verification:${token}`, userId, 86400)
  return token
}

// ── Génération du token de réinitialisation ────────────────────
export async function createPasswordResetToken(
  userId: string
): Promise<string> {
  const token = generateSecureToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 heure

  // Invalider les anciens tokens
  await prisma.passwordReset.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  })

  await prisma.passwordReset.create({
    data: { userId, token, expiresAt },
  })

  return token
}

// ── Détection des connexions inhabituelles ────────────────────
export async function detectAnomalousLogin(
  userId: string,
  currentIp: string
): Promise<boolean> {
  const recentLogins = await prisma.loginHistory.findMany({
    where: {
      userId,
      success: true,
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  if (recentLogins.length === 0) return false

  const knownIps = new Set(recentLogins.map((l) => l.ipAddress).filter(Boolean))
  return !knownIps.has(currentIp)
}

// ── Logs de connexion ─────────────────────────────────────────
export async function logLoginAttempt(
  userId: string,
  success: boolean,
  options: {
    ipAddress?: string
    userAgent?: string
    failReason?: string
    twoFactorUsed?: boolean
  } = {}
): Promise<void> {
  try {
    await prisma.loginHistory.create({
      data: {
        userId,
        success,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        failReason: options.failReason,
        twoFactorUsed: options.twoFactorUsed || false,
      },
    })
  } catch (err) {
    logger.error('Erreur log connexion:', err)
  }
}
