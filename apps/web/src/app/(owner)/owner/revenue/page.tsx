'use client'

import useSWR from 'swr'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, CreditCard, Users, ArrowUpRight } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/Header'
import { Card, StatCard } from '@/components/ui/Card'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { ownerApi } from '@/lib/api'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'

export default function OwnerRevenuePage() {
  const { data: stats, isLoading } = useSWR('owner-revenue', () => ownerApi.getRevenue())

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="Revenus"
        description="Métriques financières de la plateforme"
      />

      <div className="flex-1 p-6 space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
            <motion.div
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <StatCard
                label="MRR"
                value={formatCurrency(stats?.mrr ?? 0)}
                change={stats?.mrrChange ? `${stats.mrrChange > 0 ? '+' : ''}${stats.mrrChange}%` : undefined}
                icon={<TrendingUp className="w-4 h-4" />}
              />
              <StatCard
                label="ARR"
                value={formatCurrency((stats?.mrr ?? 0) * 12)}
                icon={<ArrowUpRight className="w-4 h-4" />}
              />
              <StatCard
                label="Revenus ce mois"
                value={formatCurrency(stats?.revenueThisMonth ?? 0)}
                icon={<CreditCard className="w-4 h-4" />}
              />
              <StatCard
                label="Abonnés payants"
                value={formatNumber(stats?.paidSubscribers ?? 0)}
                icon={<Users className="w-4 h-4" />}
              />
            </motion.div>

            {/* Revenue by plan */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-white mb-4">Revenus par plan</h3>
                  <div className="space-y-4">
                    {['BASIC', 'PREMIUM', 'BUSINESS'].map(plan => {
                      const data = stats?.revenueByPlan?.[plan] ?? { count: 0, revenue: 0 }
                      const maxRevenue = Math.max(
                        ...(Object.values(stats?.revenueByPlan ?? {}) as any[]).map((d: any) => d.revenue || 0),
                        1,
                      )
                      const pct = (data.revenue / maxRevenue) * 100
                      return (
                        <div key={plan}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">{plan}</span>
                              <span className="text-xs text-gray-500">{data.count} abonnés</span>
                            </div>
                            <span className="text-sm font-semibold text-white">
                              {formatCurrency(data.revenue)}/mois
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-white rounded-full transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Recent invoices */}
            {stats?.recentInvoices?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card>
                  <div className="p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">Derniers paiements</h3>
                    <div className="divide-y divide-gray-800">
                      {stats.recentInvoices.map((inv: any) => (
                        <div key={inv.id} className="flex items-center justify-between py-3">
                          <div>
                            <p className="text-sm text-white">{inv.user?.username}</p>
                            <p className="text-xs text-gray-500">{inv.plan} · {formatDate(inv.createdAt)}</p>
                          </div>
                          <span className="text-sm font-semibold text-white">
                            {formatCurrency(inv.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
