import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'

export interface AuthPayload {
  userId: string
  email: string
  role: string
  sessionId: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload
      apiKey?: { id: string; userId: string; permissions: string[] }
    }
  }
}

// ── Middleware d'authentification JWT ─────────────────────────
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies?.access_token

    if (!token) {
      res.status(401).json({ error: 'Token manquant', code: 'MISSING_TOKEN' })
      return
    }

    const secret = process.env.JWT_SECRET!
    let payload: AuthPayload

    try {
      payload = jwt.verify(token, secret) as AuthPayload
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: 'Token expiré', code: 'TOKEN_EXPIRED' })
      } else {
        res.status(401).json({ error: 'Token invalide', code: 'INVALID_TOKEN' })
      }
      return
    }

    // Vérifier que la session est toujours valide
    const session = await prisma.session.findFirst({
      where: {
        id: payload.sessionId,
        userId: payload.userId,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
    })

    if (!session) {
      res.status(401).json({ error: 'Session expirée', code: 'SESSION_EXPIRED' })
      return
    }

    // Vérifier que l'utilisateur est actif
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, status: true, role: true },
    })

    if (!user || user.status !== 'ACTIVE') {
      res.status(403).json({
        error: 'Compte suspendu ou inexistant',
        code: 'ACCOUNT_INACTIVE',
      })
      return
    }

    req.user = { ...payload, role: user.role }
    next()
  } catch (error) {
    logger.error('Erreur middleware auth:', error)
    res.status(500).json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' })
  }
}

// ── Middleware d'authentification par clé API ─────────────────
export async function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = req.headers['x-api-key'] as string
    if (!apiKey) {
      res.status(401).json({ error: 'Clé API manquante', code: 'MISSING_API_KEY' })
      return
    }

    // Extraire le préfixe et vérifier le format
    if (!apiKey.startsWith('adw_')) {
      res.status(401).json({ error: 'Format de clé invalide', code: 'INVALID_KEY_FORMAT' })
      return
    }

    // Hacher la clé pour comparaison (la clé complète est hachée en base)
    const { createHash } = await import('crypto')
    const keyHash = createHash('sha256').update(apiKey).digest('hex')

    const storedKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        user: {
          select: { id: true, status: true, role: true },
        },
      },
    })

    if (!storedKey || storedKey.revokedAt) {
      res.status(401).json({ error: 'Clé API invalide', code: 'INVALID_API_KEY' })
      return
    }

    if (storedKey.expiresAt && storedKey.expiresAt < new Date()) {
      res.status(401).json({ error: 'Clé API expirée', code: 'EXPIRED_API_KEY' })
      return
    }

    if (storedKey.user.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Compte inactif', code: 'ACCOUNT_INACTIVE' })
      return
    }

    // Mettre à jour lastUsedAt en arrière-plan
    prisma.apiKey
      .update({
        where: { id: storedKey.id },
        data: { lastUsedAt: new Date(), usageCount: { increment: 1 } },
      })
      .catch(() => {})

    req.apiKey = {
      id: storedKey.id,
      userId: storedKey.userId,
      permissions: storedKey.permissions,
    }

    req.user = {
      userId: storedKey.userId,
      email: storedKey.user.role,
      role: storedKey.user.role,
      sessionId: storedKey.id,
    }

    next()
  } catch (error) {
    logger.error('Erreur middleware apiKey:', error)
    res.status(500).json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' })
  }
}

// ── Vérification des rôles ────────────────────────────────────
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Non authentifié', code: 'UNAUTHENTICATED' })
      return
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Accès refusé — permissions insuffisantes',
        code: 'INSUFFICIENT_PERMISSIONS',
      })
      return
    }
    next()
  }
}

export const requireAdmin = requireRole('ADMIN', 'OWNER')
export const requireOwner = requireRole('OWNER')

// ── Authentification optionnelle ──────────────────────────────
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (token) {
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as AuthPayload
      req.user = payload
    } catch {
      // Ignorer les erreurs — auth optionnelle
    }
  }
  next()
}
