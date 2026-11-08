import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '../middleware/auth'
import { sanitizeInput } from '../middleware/security'
import { z } from 'zod'

const router = Router()
const prisma = new PrismaClient()

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = 10
  const skip = (page - 1) * limit

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where: { userId: req.user!.id },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      include: { _count: { select: { messages: true } } },
    }),
    prisma.supportTicket.count({ where: { userId: req.user!.id } }),
  ])

  res.json({ data: tickets, total, page, totalPages: Math.ceil(total / limit) })
})

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({
    subject: z.string().min(5).max(200),
    message: z.string().min(10).max(5000),
    category: z.enum(['TECHNICAL', 'BILLING', 'ACCOUNT', 'API', 'OTHER']),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message })

  const openCount = await prisma.supportTicket.count({
    where: { userId: req.user!.id, status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_USER'] } },
  })
  if (openCount >= 5) return res.status(400).json({ error: 'Maximum 5 tickets ouverts simultanément' })

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: req.user!.id,
      subject: sanitizeInput(parsed.data.subject),
      category: parsed.data.category,
      priority: parsed.data.priority,
      messages: {
        create: {
          authorId: req.user!.id,
          content: sanitizeInput(parsed.data.message),
        },
      },
    },
    include: { messages: true },
  })

  res.status(201).json({ data: ticket })
})

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, username: true, role: true } } },
      },
    },
  })
  if (!ticket) return res.status(404).json({ error: 'Ticket introuvable' })
  res.json({ data: ticket })
})

router.post('/:id/reply', requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({ message: z.string().min(1).max(5000) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Message invalide' })

  const ticket = await prisma.supportTicket.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  })
  if (!ticket) return res.status(404).json({ error: 'Ticket introuvable' })
  if (['RESOLVED', 'CLOSED'].includes(ticket.status)) {
    return res.status(400).json({ error: 'Ce ticket est fermé' })
  }

  const msg = await prisma.ticketMessage.create({
    data: {
      ticketId: req.params.id,
      authorId: req.user!.id,
      content: sanitizeInput(parsed.data.message),
    },
    include: { author: { select: { id: true, username: true, role: true } } },
  })

  await prisma.supportTicket.update({
    where: { id: req.params.id },
    data: { status: 'OPEN', updatedAt: new Date() },
  })

  res.status(201).json({ data: msg })
})

router.post('/:id/close', requireAuth, async (req: Request, res: Response) => {
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  })
  if (!ticket) return res.status(404).json({ error: 'Ticket introuvable' })

  await prisma.supportTicket.update({
    where: { id: req.params.id },
    data: { status: 'CLOSED' },
  })

  res.json({ message: 'Ticket fermé' })
})

export default router
