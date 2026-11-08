import { Router, Request, Response } from 'express'
import { PrismaClient, Role } from '@prisma/client'
import { requireAuth, requireRole } from '../middleware/auth'
import { sanitizeInput } from '../middleware/security'
import { z } from 'zod'

const router = Router()
const prisma = new PrismaClient()

const isOwner = requireRole('OWNER')

async function audit(adminId: string, action: string, details: object = {}) {
  await prisma.auditLog.create({ data: { adminId, action, details } }).catch(() => {})
}

// ── Stats ─────────────────────────────────────────────────────────────────────

router.get('/stats', requireAuth, isOwner, async (req: Request, res: Response) => {
  const [totalUsers, totalSearches, planDistribution] = await Promise.all([
    prisma.user.count(),
    prisma.searchHistory.count(),
    prisma.user.groupBy({ by: ['plan'], _count: true }),
  ])

  // MRR calculation based on subscriptions
  const planPrices: Record<string, number> = { FREE: 0, BASIC: 19, PREMIUM: 49, BUSINESS: 149 }
  const paidUsers = await prisma.user.groupBy({ by: ['plan'], _count: true, where: { plan: { not: 'FREE' }, isActive: true } })
  const mrr = paidUsers.reduce((sum, p) => sum + (planPrices[p.plan] ?? 0) * p._count, 0)

  // System health (basic checks)
  let apiStatus = 'operational'
  let dbStatus = 'operational'
  try { await prisma.$queryRaw`SELECT 1`; dbStatus = 'operational' }
  catch { dbStatus = 'degraded' }

  res.json({
    data: {
      totalUsers,
      totalSearches,
      mrr,
      arr: mrr * 12,
      planDistribution,
      systemHealth: { api: apiStatus, db: dbStatus, redis: 'operational' },
    },
  })
})

// ── Revenue ───────────────────────────────────────────────────────────────────

router.get('/revenue', requireAuth, isOwner, async (req: Request, res: Response) => {
  const planPrices: Record<string, number> = { FREE: 0, BASIC: 19, PREMIUM: 49, BUSINESS: 149 }

  const paidUsers = await prisma.user.groupBy({
    by: ['plan'],
    _count: true,
    where: { isActive: true, plan: { not: 'FREE' } },
  })

  const revenueByPlan: Record<string, { count: number; revenue: number }> = {}
  for (const p of paidUsers) {
    revenueByPlan[p.plan] = {
      count: p._count,
      revenue: (planPrices[p.plan] ?? 0) * p._count,
    }
  }

  const mrr = Object.values(revenueByPlan).reduce((s, p) => s + p.revenue, 0)
  const paidSubscribers = Object.values(revenueByPlan).reduce((s, p) => s + p.count, 0)

  // Recent subscriptions as proxy for invoices
  const recentPaid = await prisma.user.findMany({
    where: { plan: { not: 'FREE' }, isActive: true },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    select: { id: true, username: true, plan: true, updatedAt: true },
  })

  res.json({
    data: {
      mrr,
      arr: mrr * 12,
      mrrChange: 0, // Would need historical data
      revenueThisMonth: mrr,
      paidSubscribers,
      revenueByPlan,
      recentInvoices: recentPaid.map(u => ({
        id: u.id,
        user: { username: u.username },
        plan: u.plan,
        amount: planPrices[u.plan] ?? 0,
        createdAt: u.updatedAt,
      })),
    },
  })
})

// ── Admin management ──────────────────────────────────────────────────────────

router.get('/admins', requireAuth, isOwner, async (req: Request, res: Response) => {
  const admins = await prisma.user.findMany({
    where: { role: { in: [Role.ADMIN, Role.OWNER] } },
    select: {
      id: true, username: true, email: true, role: true,
      isActive: true, createdAt: true,
    },
    orderBy: { role: 'asc' },
  })
  res.json({ data: admins })
})

router.post('/admins/promote', requireAuth, isOwner, async (req: Request, res: Response) => {
  const schema = z.object({ email: z.string().email() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Email invalide' })

  const target = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!target) return res.status(404).json({ error: 'Utilisateur introuvable' })
  if (target.role !== Role.USER) return res.status(400).json({ error: 'Cet utilisateur a déjà un rôle élevé' })

  await prisma.user.update({ where: { id: target.id }, data: { role: Role.ADMIN } })

  await audit(req.user!.id, 'ADMIN_PROMOTED', { targetId: target.id, email: parsed.data.email })

  await prisma.notification.create({
    data: {
      userId: target.id,
      type: 'SYSTEM',
      title: 'Rôle administrateur accordé',
      message: 'Vous avez été promu administrateur sur la plateforme ADW Intelligence.',
    },
  })

  res.json({ message: `${target.username} promu administrateur` })
})

router.post('/admins/:id/demote', requireAuth, isOwner, async (req: Request, res: Response) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!target) return res.status(404).json({ error: 'Introuvable' })
  if (target.role === Role.OWNER) return res.status(403).json({ error: 'Impossible de rétrograder le propriétaire' })
  if (target.role !== Role.ADMIN) return res.status(400).json({ error: 'Cet utilisateur n\'est pas administrateur' })

  await prisma.user.update({ where: { id: target.id }, data: { role: Role.USER } })
  await audit(req.user!.id, 'ADMIN_DEMOTED', { targetId: target.id })
  res.json({ message: `${target.username} rétrogradé` })
})

// ── Maintenance ───────────────────────────────────────────────────────────────

router.get('/maintenance', requireAuth, isOwner, async (req: Request, res: Response) => {
  const setting = await prisma.systemSetting.findUnique({ where: { key: 'MAINTENANCE_MODE' } })
  const message = await prisma.systemSetting.findUnique({ where: { key: 'MAINTENANCE_MESSAGE' } })
  const enabledAt = await prisma.systemSetting.findUnique({ where: { key: 'MAINTENANCE_ENABLED_AT' } })

  res.json({
    data: {
      enabled: setting?.value === 'true',
      message: message?.value ?? '',
      enabledAt: enabledAt?.value ? new Date(enabledAt.value) : null,
    },
  })
})

router.post('/maintenance/enable', requireAuth, isOwner, async (req: Request, res: Response) => {
  const schema = z.object({ message: z.string().max(500).optional() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid' })

  await Promise.all([
    prisma.systemSetting.upsert({
      where: { key: 'MAINTENANCE_MODE' },
      update: { value: 'true' },
      create: { key: 'MAINTENANCE_MODE', value: 'true' },
    }),
    prisma.systemSetting.upsert({
      where: { key: 'MAINTENANCE_ENABLED_AT' },
      update: { value: new Date().toISOString() },
      create: { key: 'MAINTENANCE_ENABLED_AT', value: new Date().toISOString() },
    }),
  ])

  if (parsed.data.message) {
    await prisma.systemSetting.upsert({
      where: { key: 'MAINTENANCE_MESSAGE' },
      update: { value: sanitizeInput(parsed.data.message) },
      create: { key: 'MAINTENANCE_MESSAGE', value: sanitizeInput(parsed.data.message) },
    })
  }

  await audit(req.user!.id, 'MAINTENANCE_ENABLED', { message: parsed.data.message })
  res.json({ message: 'Maintenance activée' })
})

router.post('/maintenance/disable', requireAuth, isOwner, async (req: Request, res: Response) => {
  await prisma.systemSetting.upsert({
    where: { key: 'MAINTENANCE_MODE' },
    update: { value: 'false' },
    create: { key: 'MAINTENANCE_MODE', value: 'false' },
  })
  await audit(req.user!.id, 'MAINTENANCE_DISABLED', {})
  res.json({ message: 'Maintenance désactivée' })
})

// ── System settings ───────────────────────────────────────────────────────────

router.get('/settings', requireAuth, isOwner, async (req: Request, res: Response) => {
  const settings = await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } })
  res.json({ data: settings })
})

router.put('/settings/:key', requireAuth, isOwner, async (req: Request, res: Response) => {
  const schema = z.object({ value: z.string().max(2000) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Valeur invalide' })

  const setting = await prisma.systemSetting.upsert({
    where: { key: req.params.key },
    update: { value: sanitizeInput(parsed.data.value) },
    create: { key: req.params.key, value: sanitizeInput(parsed.data.value) },
  })

  await audit(req.user!.id, 'SETTING_UPDATED', { key: req.params.key, value: parsed.data.value })
  res.json({ data: setting })
})

router.delete('/settings/:key', requireAuth, isOwner, async (req: Request, res: Response) => {
  await prisma.systemSetting.delete({ where: { key: req.params.key } }).catch(() => {})
  res.json({ message: 'Supprimé' })
})

// ── All audit logs (owner sees everything) ────────────────────────────────────

router.get('/audit-logs', requireAuth, isOwner, async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = parseInt(req.query.limit as string) || 50
  const skip = (page - 1) * limit
  const search = req.query.search as string
  const action = req.query.action as string

  const where: any = {}
  if (search) where.admin = { username: { contains: search, mode: 'insensitive' } }
  if (action) where.action = action

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { admin: { select: { id: true, username: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ])

  res.json({ data: logs, total, page, totalPages: Math.ceil(total / limit) })
})

export default router
