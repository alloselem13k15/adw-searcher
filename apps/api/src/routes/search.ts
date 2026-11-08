import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { searchRateLimiter } from '../middleware/rateLimiter'
import { adwSearch } from '../services/searchService'
import { sanitizeInput } from '../utils/sanitize'

const router = Router()

// ── Validation schema for all 40+ ADW search fields ──────────────────────────

const adwSearchSchema = z.object({
  // Identite
  nom_famille:    z.string().max(200).optional(),
  prenom:         z.string().max(200).optional(),
  nom_naissance:  z.string().max(200).optional(),
  nom_affichage:  z.string().max(200).optional(),
  nom_utilisateur:z.string().max(200).optional(),
  genre:          z.string().max(50).optional(),
  civilite:       z.string().max(50).optional(),
  date_naissance: z.string().max(50).optional(),
  annee_naissance:z.string().max(10).optional(),
  jour_naissance: z.string().max(5).optional(),
  mois_naissance: z.string().max(5).optional(),
  // Contact
  email:          z.string().max(500).optional(),
  telephone:      z.string().max(50).optional(),
  mobile:         z.string().max(50).optional(),
  adresse_ip:     z.string().max(50).optional(),
  discord_id:     z.string().max(100).optional(),
  // Localisation
  adresse:          z.string().max(500).optional(),
  complement_adresse:z.string().max(500).optional(),
  ville:            z.string().max(200).optional(),
  code_postal:      z.string().max(20).optional(),
  departement:      z.string().max(100).optional(),
  region:           z.string().max(100).optional(),
  pays:             z.string().max(100).optional(),
  ville_naissance:  z.string().max(200).optional(),
  lieu_naissance:   z.string().max(500).optional(),
  // Professionnel
  societe:         z.string().max(500).optional(),
  profession:      z.string().max(200).optional(),
  fonction:        z.string().max(200).optional(),
  siret:           z.string().max(20).optional(),
  siren:           z.string().max(20).optional(),
  marque:          z.string().max(200).optional(),
  modele:          z.string().max(200).optional(),
  vin_plaque:      z.string().max(50).optional(),
  immatriculation: z.string().max(20).optional(),
  numero_serie:    z.string().max(100).optional(),
  // Bancaire / Gaming
  iban:          z.string().max(50).optional(),
  bic:           z.string().max(20).optional(),
  steam_id:      z.string().max(100).optional(),
  fivem_license: z.string().max(100).optional(),
  fivem_license2:z.string().max(100).optional(),
  fivem_id:      z.string().max(100).optional(),
  xbox_live_id:  z.string().max(100).optional(),
  live_id:       z.string().max(100).optional(),
  // Pagination
  page:     z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(25),
  flexible: z.boolean().optional(),
}).refine(data => {
  const excluded = new Set(['page', 'per_page', 'flexible'])
  return Object.entries(data).some(
    ([k, v]) => !excluded.has(k) && v !== undefined && v !== ''
  )
}, { message: 'Au moins un critere de recherche est requis' })

// ── Helpers ───────────────────────────────────────────────────────────────────

function getIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'] as string | undefined
  return forwarded?.split(',')[0]?.trim() || req.ip || 'unknown'
}

function summarizeParams(params: Record<string, unknown>): string {
  const priority = ['nom_famille', 'prenom', 'email', 'telephone', 'ville', 'adresse_ip', 'societe']
  const parts = priority
    .map(k => params[k])
    .filter(v => typeof v === 'string' && v.trim() !== '')
    .slice(0, 3) as string[]
  if (parts.length) return parts.join(', ')
  const first = Object.values(params).find(v => typeof v === 'string' && v.trim() !== '')
  return typeof first === 'string' ? first : 'Recherche combinee'
}

// ── POST /search ──────────────────────────────────────────────────────────────

router.post('/', requireAuth, searchRateLimiter, async (req: Request, res: Response) => {
  const parsed = adwSearchSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.errors[0]?.message ?? 'Parametres invalides',
      code: 'VALIDATION_ERROR',
    })
  }

  const { page, per_page, flexible, ...rawFields } = parsed.data

  // Sanitize and filter empty fields
  const searchFields: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(rawFields)) {
    if (typeof v === 'string' && v.trim() !== '') {
      searchFields[k] = sanitizeInput(v.trim())
    }
  }

  const ip = getIp(req)

  try {
    // Fetch user + subscription
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { subscription: true },
    })

    if (!user || !user.isActive) {
      return res.status(403).json({
        error: 'Compte suspendu ou introuvable',
        code: 'ACCOUNT_INACTIVE',
      })
    }

    // ── Daily limit check (OWNER and ADMIN are exempt) ────────────────────
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      const sub = user.subscription
      const searchesPerDay = sub?.searchesPerDay ?? 100
      const now = new Date()

      if (sub) {
        // Reset counter if it is a new calendar day
        const lastReset = sub.lastResetAt
        const isNewDay =
          !lastReset ||
          now.getFullYear() !== lastReset.getFullYear() ||
          now.getMonth()    !== lastReset.getMonth() ||
          now.getDate()     !== lastReset.getDate()

        if (isNewDay) {
          await prisma.subscription.update({
            where: { userId: user.id },
            data: { searchesUsedToday: 0, lastResetAt: now },
          })
          sub.searchesUsedToday = 0
        }

        if (sub.searchesUsedToday >= searchesPerDay) {
          // Log blocked attempt
          await prisma.ipLog.create({
            data: {
              userId: user.id,
              ipAddress: ip,
              action: 'SEARCH',
              details: { blocked: true, reason: 'DAILY_LIMIT_REACHED' },
            },
          }).catch(() => {})

          return res.status(429).json({
            error: 'Limite journaliere atteinte. Revenez demain.',
            code: 'DAILY_LIMIT_REACHED',
            limit: searchesPerDay,
            used: sub.searchesUsedToday,
          })
        }
      }
    }

    // ── Call ADW API (server-side only) ───────────────────────────────────
    const apiResult = await adwSearch({
      ...searchFields,
      page,
      per_page,
      ...(flexible !== undefined ? { flexible } : {}),
    })

    const resultsCount = apiResult.data?.results?.length ?? 0
    const summary = summarizeParams(searchFields)

    // ── Persist search history and increment daily counter ────────────────
    await prisma.$transaction(async tx => {
      await tx.searchHistory.create({
        data: {
          userId: req.user!.id,
          query: summary,
          searchType: 'COMBINED',
          queryParams: { ...searchFields, page, per_page, flexible },
          resultsCount,
          creditsUsed: 0,
        },
      })

      if (
        user.role !== 'OWNER' &&
        user.role !== 'ADMIN' &&
        user.subscription
      ) {
        await tx.subscription.update({
          where: { userId: user.id },
          data: { searchesUsedToday: { increment: 1 } },
        })
      }
    })

    // ── Log IP activity ───────────────────────────────────────────────────
    await prisma.ipLog.create({
      data: {
        userId: user.id,
        ipAddress: ip,
        action: 'SEARCH',
        details: {
          fieldsUsed: Object.keys(searchFields),
          resultsCount,
          page,
          per_page,
        },
      },
    }).catch(() => {})

    res.json({
      data: apiResult.data,
      meta: apiResult.meta,
      timestamp: apiResult.timestamp,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''

    if (msg.startsWith('RATE_LIMITED')) {
      return res.status(429).json({
        error: 'Limite de requetes atteinte. Reessayez dans un moment.',
        code: 'API_RATE_LIMITED',
      })
    }
    if (msg === 'SERVICE_UNAVAILABLE') {
      return res.status(503).json({
        error: 'Service temporairement indisponible. Reessayez dans une minute.',
        code: 'SERVICE_UNAVAILABLE',
      })
    }
    if (msg === 'SERVICE_NOT_CONFIGURED') {
      return res.status(503).json({
        error: 'Service non configure.',
        code: 'SERVICE_NOT_CONFIGURED',
      })
    }

    console.error('[Search] Unexpected error:', msg)
    res.status(502).json({
      error: 'Erreur lors de la recherche. Veuillez reessayer.',
      code: 'SEARCH_ERROR',
    })
  }
})

// ── GET /search/history ───────────────────────────────────────────────────────

router.get('/history', requireAuth, async (req: Request, res: Response) => {
  const page  = Math.max(1, parseInt(req.query.page  as string) || 1)
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20)
  const skip  = (page - 1) * limit

  const [history, total] = await Promise.all([
    prisma.searchHistory.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.searchHistory.count({ where: { userId: req.user!.id } }),
  ])

  res.json({
    data: history,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
})

export default router
