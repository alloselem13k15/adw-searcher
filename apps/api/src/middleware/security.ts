import { Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import cors from 'cors'

// ── Helmet — Headers de sécurité ──────────────────────────────
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'strict-dynamic'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-site' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
})

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true) // Requêtes serveur-à-serveur
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    callback(new Error(`CORS: origine non autorisée: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Request-ID',
    'X-CSRF-Token',
  ],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24h preflight cache
})

// ── Sanitisation des entrées ──────────────────────────────────
export function sanitizeInput(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // Supprimer les caractères nuls et les caractères de contrôle dangereux
  const sanitize = (obj: unknown): unknown => {
    if (typeof obj === 'string') {
      return obj.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim()
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize)
    }
    if (obj && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
          k,
          sanitize(v),
        ])
      )
    }
    return obj
  }

  if (req.body) req.body = sanitize(req.body)
  if (req.query) req.query = sanitize(req.query) as typeof req.query
  next()
}

// ── Prévention des injections SQL basique ─────────────────────
const SQL_INJECTION_PATTERNS =
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|HAVING|CAST|CONVERT|DECLARE|CURSOR|FETCH|KILL|OPEN|CLOSE)\b)/gi

export function sqlInjectionGuard(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const checkValue = (val: unknown): boolean => {
    if (typeof val === 'string' && SQL_INJECTION_PATTERNS.test(val)) {
      return true
    }
    if (val && typeof val === 'object') {
      return Object.values(val as Record<string, unknown>).some(checkValue)
    }
    return false
  }

  if (checkValue(req.body) || checkValue(req.query)) {
    res.status(400).json({
      error: 'Requête invalide',
      code: 'INVALID_INPUT',
    })
    return
  }
  next()
}

// ── Ajout d'un ID de requête ──────────────────────────────────
export function requestId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  req.headers['x-request-id'] = id
  res.setHeader('X-Request-ID', id)
  next()
}
