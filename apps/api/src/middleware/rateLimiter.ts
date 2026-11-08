import rateLimit from 'express-rate-limit'
import { Request, Response } from 'express'
import { getRedis } from '../lib/redis'

// Store Redis pour le rate limiting distribué
class RedisStore {
  private prefix: string

  constructor(prefix: string = 'rl:') {
    this.prefix = prefix
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const redis = getRedis()
    const redisKey = `${this.prefix}${key}`
    const ttl = 60 // 1 minute par défaut

    const multi = redis.multi()
    multi.incr(redisKey)
    multi.expire(redisKey, ttl)
    const results = await multi.exec()

    const hits = (results?.[0]?.[1] as number) || 1
    const resetTime = new Date(Date.now() + ttl * 1000)

    return { totalHits: hits, resetTime }
  }

  async decrement(key: string): Promise<void> {
    const redis = getRedis()
    await redis.decr(`${this.prefix}${key}`)
  }

  async resetKey(key: string): Promise<void> {
    const redis = getRedis()
    await redis.del(`${this.prefix}${key}`)
  }
}

const errorHandler = (_req: Request, res: Response): void => {
  res.status(429).json({
    error: 'Trop de requêtes. Réessayez dans quelques instants.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: res.getHeader('Retry-After'),
  })
}

// ── Rate limiters ─────────────────────────────────────────────

// Limiter global — toutes les routes
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: errorHandler,
})

// Limiter strict pour l'authentification
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => `auth:${req.ip}`,
  handler: errorHandler,
})

// Limiter pour les recherches
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.SEARCH_RATE_LIMIT_MAX || '20'),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) =>
    `search:${req.user?.userId || req.apiKey?.userId || req.ip}`,
  handler: errorHandler,
})

// Limiter pour l'envoi d'emails (mot de passe oublié, vérification)
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => `email:${req.ip}:${req.body?.email || ''}`,
  handler: errorHandler,
})

// Limiter pour les webhooks Stripe
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})

// Limiter pour l'API publique par clé
export const apiKeyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) =>
    `apikey:${req.apiKey?.id || req.headers['x-api-key'] || req.ip}`,
  handler: errorHandler,
})
