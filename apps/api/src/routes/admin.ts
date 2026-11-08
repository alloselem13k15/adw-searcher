import { Router, Request, Response } from 'express'
import { PrismaClient, Prisma } from '@prisma/client'
import { requireAuth, requireRole } from '../middleware/auth'
import { sanitizeInput } from '../utils/sanitize'
import { audit } from '../utils/audit'

const router = Router()
const prisma = new PrismaClient()

const isAdmin = requireRole('ADMIN')

// ── GET /admin/stats ──────────────────────────────────────────────────────────

router.get('/stats', requireAuth, isAdmin, async (_req: Request, res: Response) => {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalUsers,
    activeUsers,
    searchesToday,
    searchesThisMonth,
    openTickets,
    totalIpLogsToday,
    uniqueIpsToday,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.searchHistory.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.searchHistory.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.ticket?.count({ where: { status: 'OPEN' } }).catch(() => 0) ?? 0,
    prisma.ipLog.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.ipLog
      .groupBy({ by: ['ipAddress'], where: { createdAt: { gte: startOfDay } } })
      .then(r => r.length),
  ])

  res.json({
    totalUsers,
    activeUsers,
    searchesToday,
    searchesThisMonth,
    openTickets,
    totalIpLogsToday,
    uniqueIpsToday,
    MRR: 0, // Version en attendant — tarifs non encore definis
  })
})

// ── GET /admin/users ──────────────────────────────────────────────────────────

router.get('/users', requireAuth, isAdmin, async (req: Request, res: Response) => {
  const page   = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit  = Math.min(100, parseInt(req.query.limit as string) || 20)
  const skip   = (page - 1) * limit
  const search = req.query.search ? sanitizeInput(req.query.search as string) : undefined

  const where: Prisma.UserWhereInput = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            searchesPerDay: true,
            searchesUsedToday: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ])

  res.json({ data: users, total, page, totalPages: Math.ceil(total / limit) })
})

// ── PATCH /admin/users/:id ────────────────────────────────────────────────────

router.patch('/users/:id', requireAuth, isAdmin, async (req: Request, res: Response) => {
  const { id } = req.params
  const { isActive, role } = req.body

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
      ...(role ? { role } : {}),
    },
    select: { id: true, email: true, role: true, isActive: true },
  })

  await audit(req, 'USER_UPDATED', { targetUserId: id, changes: { isActive, role } })

  res.json(user)
})

// ── DELETE /admin/users/:id ───────────────────────────────────────────────────

router.delete('/users/:id', requireAuth, requireRole('OWNER'), async (req: Request, res: Response) => {
  const { id } = req.params

  await prisma.user.delete({ where: { id } })
  await audit(req, 'USER_DELETED', { targetUserId: id })

  res.json({ success: true })
})

// ── GET /admin/logs ───────────────────────────────────────────────────────────
// Combined activity log: IpLog entries with optional SearchHistory details.
// Query params:
//   action   - filter by action type (LOGIN|REGISTER|SEARCH|LOGOUT|FAILED_LOGIN|all)
//   ip       - filter by IP address substring
//   userId   - filter by user ID
//   from     - ISO date string — createdAt >= from
//   to       - ISO date string — createdAt <= to
//   page     - default 1
//   limit    - default 50, max 200

router.get('/logs', requireAuth, isAdmin, async (req: Request, res: Response) => {
  const page   = Math.max(1, parseInt(req.query.page  as string) || 1)
  const limit  = Math.min(200, parseInt(req.query.limit as string) || 50)
  const skip   = (page - 1) * limit
  const action = req.query.action as string | undefined
  const ip     = req.query.ip     as string | undefined
  const userId = req.query.userId as string | undefined
  const from   = req.query.from   as string | undefined
  const to     = req.query.to     as string | undefined

  const where: Prisma.IpLogWhereInput = {
    ...(action && action !== 'all' ? { action: action as Prisma.EnumActionFilter } : {}),
    ...(ip ? { ipAddress: { contains: ip } } : {}),
    ...(userId ? { userId } : {}),
    ...((from || to)
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to   ? { lte: new Date(to)   } : {}),
          },
        }
      : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.ipLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, email: true, username: true, role: true },
        },
      },
    }),
    prisma.ipLog.count({ where }),
  ])

  // For SEARCH log entries, attach the matching SearchHistory record
  const searchLogs = logs.filter(l => l.action === 'SEARCH' && l.userId)
  const historyMap: Record<string, unknown> = {}

  if (searchLogs.length > 0) {
    const histories = await prisma.searchHistory.findMany({
      where: {
        userId: { in: searchLogs.map(l => l.userId!).filter(Boolean) },
        createdAt: {
          gte: new Date(Date.now() - 60_000), // within 1 minute of the log
        },
      },
      orderBy: { createdAt: 'desc' },
      take: searchLogs.length * 2,
      select: {
        id: true,
        userId: true,
        query: true,
        queryParams: true,
        resultsCount: true,
        createdAt: true,
      },
    })

    for (const h of histories) {
      if (h.userId && !historyMap[h.userId]) {
        historyMap[h.userId] = h
      }
    }
  }

  const enriched = logs.map(log => ({
    ...log,
    searchHistory: log.action === 'SEARCH' && log.userId
      ? (historyMap[log.userId] ?? null)
      : null,
  }))

  res.json({
    data: enriched,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
})

// ── GET /admin/search-history ─────────────────────────────────────────────────
// Full search history across all users, with user info.

router.get('/search-history', requireAuth, isAdmin, async (req: Request, res: Response) => {
  const page   = Math.max(1, parseInt(req.query.page  as string) || 1)
  const limit  = Math.min(200, parseInt(req.query.limit as string) || 50)
  const skip   = (page - 1) * limit
  const userId = req.query.userId as string | undefined
  const search = req.query.search ? sanitizeInput(req.query.search as string) : undefined

  const where: Prisma.SearchHistoryWhereInput = {
    ...(userId ? { userId } : {}),
    ...(search
      ? { query: { contains: search, mode: 'insensitive' } }
      : {}),
  }

  const [history, total] = await Promise.all([
    prisma.searchHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, email: true, username: true, role: true },
        },
      },
    }),
    prisma.searchHistory.count({ where }),
  ])

  res.json({
    data: history,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
})

// ── GET /admin/audit-logs ─────────────────────────────────────────────────────

router.get('/audit-logs', requireAuth, isAdmin, async (req: Request, res: Response) => {
  const page  = Math.max(1, parseInt(req.query.page  as string) || 1)
  const limit = Math.min(200, parseInt(req.query.limit as string) || 50)
  const skip  = (page - 1) * limit

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, email: true, username: true } },
      },
    }),
    prisma.auditLog.count(),
  ])

  res.json({ data: logs, total, page, totalPages: Math.ceil(total / limit) })
})

// ── GET /admin/tickets ────────────────────────────────────────────────────────

router.get('/tickets', requireAuth, isAdmin, async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined
  const page   = Math.max(1, parseInt(req.query.page  as string) || 1)
  const limit  = Math.min(100, parseInt(req.query.limit as string) || 20)
  const skip   = (page - 1) * limit

  const where: Prisma.TicketWhereInput = status && status !== 'all'
    ? { status: status as Prisma.EnumTicketStatusFilter }
    : {}

  const [tickets, total] = await Promise.all([
    prisma.ticket?.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { user: { select: { id: true, email: true, username: true } } },
    }).catch(() => []) ?? [],
    prisma.ticket?.count({ where }).catch(() => 0) ?? 0,
  ])

  res.json({ data: tickets, total, page, totalPages: Math.ceil(total / limit) })
})

export default router
