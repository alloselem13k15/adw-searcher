import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { createClient } from 'redis'
import { applySecurityMiddleware } from './middleware/security'
import { globalRateLimiter } from './middleware/rateLimiter'
import authRoutes from './routes/auth'
import usersRoutes from './routes/users'
import searchRoutes from './routes/search'
import billingRoutes from './routes/billing'
import ticketsRoutes from './routes/tickets'
import adminRoutes from './routes/admin'
import ownerRoutes from './routes/owner'

const app = express()
const PORT = process.env.PORT ?? 4000

// ── Redis ─────────────────────────────────────────────────────────────────────
export const redis = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' })
redis.on('error', err => console.error('[Redis]', err))
redis.connect().then(() => console.log('[Redis] Connected'))

// ── Security middleware ───────────────────────────────────────────────────────
applySecurityMiddleware(app)

// ── Body parsers ──────────────────────────────────────────────────────────────
// Raw body for Stripe webhook signature verification — must come before json parser
app.use('/billing/webhook', express.raw({ type: 'application/json' }))

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.WEB_URL ?? 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-CSRF-Token'],
}))

// ── Global rate limit ─────────────────────────────────────────────────────────
app.use(globalRateLimiter)

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Maintenance check ─────────────────────────────────────────────────────────
app.use(async (req, res, next) => {
  // Skip for auth routes and health
  if (req.path.startsWith('/auth') || req.path === '/health') return next()
  if (req.path.startsWith('/owner')) return next() // Owner can always access

  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    const maintenance = await prisma.systemSetting.findUnique({ where: { key: 'MAINTENANCE_MODE' } })
    if (maintenance?.value === 'true') {
      const message = await prisma.systemSetting.findUnique({ where: { key: 'MAINTENANCE_MESSAGE' } })
      return res.status(503).json({
        error: 'maintenance',
        message: message?.value ?? 'La plateforme est en maintenance.',
      })
    }
  } catch {}

  next()
})

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes)
app.use('/users', usersRoutes)
app.use('/search', searchRoutes)
app.use('/billing', billingRoutes)
app.use('/tickets', ticketsRoutes)
app.use('/admin', adminRoutes)
app.use('/owner', ownerRoutes)

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route introuvable' })
})

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err)
  const status = err.status ?? err.statusCode ?? 500
  res.status(status).json({ error: err.message ?? 'Erreur interne du serveur' })
})

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[API] ADW Intelligence API running on port ${PORT}`)
  console.log(`[API] Environment: ${process.env.NODE_ENV ?? 'development'}`)
})

export default app
