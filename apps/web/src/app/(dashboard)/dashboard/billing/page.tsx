'use client'

import useSWR from 'swr'
import { motion } from 'framer-motion'
import {
  CreditCard,
  Zap,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  Clock,
  TrendingUp,
  Receipt,
} from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { billingApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, formatCurrency, formatNumber, getPlanLabel } from '@/lib/utils'
import toast from 'react-hot-toast'

const PLANS = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    credits: 100,
    features: ['100 crédits/mois', '1 clé API', 'Support communautaire'],
  },
  {
    id: 'BASIC',
    name: 'Basic',
    price: 19,
    credits: 2000,
    features: ['2 000 crédits/mois', '5 clés API', 'Support email', 'Accès à l\'API REST'],
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: 49,
    credits: 10000,
    features: ['10 000 crédits/mois', '20 clés API', 'Support prioritaire', 'Webhooks', 'Export CSV'],
  },
  {
    id: 'BUSINESS',
    name: 'Business',
    price: 149,
    credits: 100000,
    features: ['100 000 crédits/mois', 'Clés API illimitées', 'Support dédié', 'SLA 99.9%', 'IP dédiée'],
  },
] as const

export default function BillingPage() {
  const { user } = useAuth()
  const { data: invoices, isLoading } = useSWR('invoices', () => billingApi.getInvoices())

  const currentPlan = user?.subscription?.plan ?? 'FREE'

  const handleUpgrade = async (planId: string) => {
    try {
      const res = await billingApi.createCheckout(planId)
      window.location.href = res.url
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur lors de la redirection')
    }
  }

  const handlePortal = async () => {
    try {
      const res = await billingApi.getPortal()
      window.open(res.url, '_blank')
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="Facturation"
        description="Gérez votre abonnement et consultez vos factures"
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Current plan */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-white">
                      Plan {getPlanLabel(currentPlan)}
                    </h3>
                    <Badge variant={currentPlan === 'FREE' ? 'muted' : 'default'}>
                      Actuel
                    </Badge>
                  </div>
                  {user?.subscription?.currentPeriodEnd && (
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Renouvellement le{' '}
                      {formatDate(user.subscription.currentPeriodEnd)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {currentPlan !== 'FREE' && (
                    <Button variant="outline" size="sm" onClick={handlePortal}>
                      <ExternalLink className="w-4 h-4" />
                      Gérer l'abonnement
                    </Button>
                  )}
                  {currentPlan === 'FREE' && (
                    <Button size="sm" onClick={() => handleUpgrade('BASIC')}>
                      Mettre à niveau
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Credits gauge */}
              <div className="mt-6 pt-5 border-t border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-white">Crédits</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {formatNumber(user?.credits ?? 0)} restants
                  </span>
                </div>
                {(() => {
                  const max = { FREE: 100, BASIC: 2000, PREMIUM: 10000, BUSINESS: 100000 }[currentPlan] ?? 100
                  const pct = Math.min(100, ((user?.credits ?? 0) / max) * 100)
                  return (
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )
                })()}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Plans grid */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Plans disponibles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan) => {
              const isCurrent = plan.id === currentPlan
              const isHigher = PLANS.findIndex(p => p.id === plan.id) > PLANS.findIndex(p => p.id === currentPlan)
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border p-5 flex flex-col ${
                    isCurrent
                      ? 'border-white bg-white text-black'
                      : 'border-gray-800 bg-gray-900/50 text-white'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <span className="bg-black text-white text-xs px-2 py-0.5 rounded-full border border-gray-700">
                        Actuel
                      </span>
                    </div>
                  )}
                  <h4 className={`font-bold text-lg ${isCurrent ? 'text-black' : 'text-white'}`}>
                    {plan.name}
                  </h4>
                  <div className="mt-1 mb-4">
                    <span className={`text-2xl font-bold ${isCurrent ? 'text-black' : 'text-white'}`}>
                      {plan.price === 0 ? 'Gratuit' : `${plan.price}€`}
                    </span>
                    {plan.price > 0 && (
                      <span className={`text-xs ml-1 ${isCurrent ? 'text-gray-700' : 'text-gray-500'}`}>/mois</span>
                    )}
                  </div>
                  <ul className="space-y-1.5 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs">
                        <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 ${isCurrent ? 'text-black' : 'text-gray-500'}`} />
                        <span className={isCurrent ? 'text-gray-700' : 'text-gray-400'}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {!isCurrent && isHigher && (
                    <Button
                      size="sm"
                      className="mt-4 w-full"
                      variant="secondary"
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      Choisir
                    </Button>
                  )}
                  {!isCurrent && !isHigher && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-4 w-full"
                      onClick={handlePortal}
                    >
                      Rétrograder
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Invoices */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Historique de facturation</h3>
          <Card>
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : !invoices?.data?.length ? (
              <div className="p-10 flex flex-col items-center text-center">
                <Receipt className="w-8 h-8 text-gray-700 mb-3" />
                <p className="text-sm text-gray-500">Aucune facture pour le moment</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {invoices.data.map((inv: any) => (
                  <div key={inv.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">
                        {getPlanLabel(inv.plan)} — {formatCurrency(inv.amount)}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(inv.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={inv.status === 'paid' ? 'default' : 'muted'}>
                        {inv.status === 'paid' ? 'Payé' : inv.status}
                      </Badge>
                      {inv.invoiceUrl && (
                        <a
                          href={inv.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
