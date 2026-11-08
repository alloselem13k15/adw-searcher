import { Router, Request, Response } from 'express'
import Stripe from 'stripe'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { logger } from '../lib/logger'

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

// Plans disponibles
const PLANS = {
  FREE: { name: 'Free', price: 0, credits: 10, searchesPerDay: 10 },
  BASIC: {
    name: 'Basic',
    priceId: process.env.STRIPE_PRICE_BASIC_MONTHLY,
    price: 1900, // centimes
    credits: 100,
    searchesPerDay: 50,
  },
  PREMIUM: {
    name: 'Premium',
    priceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    price: 4900,
    credits: 500,
    searchesPerDay: 200,
  },
  BUSINESS: {
    name: 'Business',
    priceId: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
    price: 14900,
    credits: 2000,
    searchesPerDay: 1000,
  },
}

// ── GET /billing/plans — Liste des plans ──────────────────────
router.get('/plans', (_req, res: Response) => {
  res.json({ plans: PLANS })
})

// ── GET /billing/subscription — Abonnement actuel ─────────────
router.get('/subscription', requireAuth, async (req: Request, res: Response) => {
  const subscription = await prisma.subscription.findUnique({
    where: { userId: req.user!.userId },
  })
  res.json({ subscription })
})

// ── POST /billing/checkout — Créer une session de paiement ────
router.post('/checkout', requireAuth, async (req: Request, res: Response) => {
  const { plan } = req.body
  const userId = req.user!.userId

  if (!['BASIC', 'PREMIUM', 'BUSINESS'].includes(plan)) {
    return res.status(400).json({ error: 'Plan invalide' })
  }

  const planConfig = PLANS[plan as keyof typeof PLANS] as typeof PLANS.BASIC
  if (!planConfig.priceId) {
    return res.status(500).json({ error: 'Configuration du plan manquante' })
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

  // Créer ou récupérer le client Stripe
  let customerId = user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: { userId },
    })
    customerId = customer.id
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `${process.env.APP_URL}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL}/dashboard/billing?canceled=true`,
    metadata: { userId, plan },
    subscription_data: {
      metadata: { userId, plan },
    },
  })

  res.json({ sessionUrl: session.url })
})

// ── POST /billing/portal — Portail de gestion Stripe ─────────
router.post('/portal', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })

  if (!user?.stripeCustomerId) {
    return res.status(400).json({ error: 'Aucun abonnement actif' })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.APP_URL}/dashboard/billing`,
  })

  res.json({ url: session.url })
})

// ── GET /billing/invoices — Historique des factures ───────────
router.get('/invoices', requireAuth, async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = 20

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where: { userId: req.user!.userId } }),
  ])

  res.json({ invoices, pagination: { page, limit, total } })
})

// ── POST /billing/webhook — Webhook Stripe ────────────────────
router.post(
  '/webhook',
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature']!
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      logger.error('Webhook signature invalide:', err)
      return res.status(400).send('Webhook Error')
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.CheckoutSession
          const { userId, plan } = session.metadata || {}
          if (!userId || !plan) break

          const planConfig = PLANS[plan as keyof typeof PLANS] as typeof PLANS.BASIC

          await prisma.subscription.upsert({
            where: { userId },
            update: {
              plan: plan as any,
              status: 'ACTIVE',
              stripeSubscriptionId: session.subscription as string,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              creditsPerMonth: planConfig.credits,
              searchesPerDay: planConfig.searchesPerDay,
            },
            create: {
              userId,
              plan: plan as any,
              status: 'ACTIVE',
              stripeSubscriptionId: session.subscription as string,
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              creditsPerMonth: planConfig.credits,
              searchesPerDay: planConfig.searchesPerDay,
            },
          })

          // Ajouter les crédits
          await prisma.user.update({
            where: { id: userId },
            data: { credits: { increment: planConfig.credits } },
          })

          // Notification
          await prisma.notification.create({
            data: {
              userId,
              title: `Abonnement ${plan} activé`,
              content: `Votre abonnement ${plan} est actif. ${planConfig.credits} crédits ajoutés.`,
              type: 'success',
            },
          })
          break
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string)
          const userId = sub.metadata?.userId
          if (!userId) break

          await prisma.invoice.create({
            data: {
              userId,
              stripeInvoiceId: invoice.id,
              amount: invoice.amount_paid,
              currency: invoice.currency,
              status: 'paid',
              invoiceUrl: invoice.hosted_invoice_url || undefined,
              invoicePdf: invoice.invoice_pdf || undefined,
              paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
            },
          })
          break
        }

        case 'customer.subscription.deleted': {
          const sub = event.data.object as Stripe.Subscription
          const userId = sub.metadata?.userId
          if (!userId) break

          await prisma.subscription.update({
            where: { stripeSubscriptionId: sub.id },
            data: { status: 'CANCELED', canceledAt: new Date(), plan: 'FREE' },
          })
          break
        }

        default:
          logger.info(`Événement Stripe non géré: ${event.type}`)
      }
    } catch (err) {
      logger.error(`Erreur traitement webhook ${event.type}:`, err)
      return res.status(500).send('Webhook processing error')
    }

    res.json({ received: true })
  }
)

export default router
