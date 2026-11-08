'use client'

import useSWR from 'swr'
import { motion } from 'framer-motion'
import {
  Users, TrendingUp, Search, CreditCard, Server, Activity, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { DashboardHeader } from '@/components/dashboard/Header'
import { Card, StatCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { ownerApi } from '@/lib/api'
import { formatNumber, formatCurrency } from '@/lib/utils'

export default function OwnerOverviewPage() {
  const { data: stats, isLoading } = useSWR('owner-stats', () => ownerApi.getStats())

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="Owner Dashboard"
        description="Contrôle total de la plateforme ADW Intelligence"
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
              variants={container}
              initial="hidden"
              animate="show"
            >
              {[
                { label: 'Utilisateurs', value: formatNumber(stats?.totalUsers ?? 0), icon: <Users className="w-4 h-4" /> },
                { label: 'MRR', value: formatCurrency(stats?.mrr ?? 0), icon: <TrendingUp className="w-4 h-4" /> },
                { label: 'ARR', value: formatCurrency((stats?.mrr ?? 0) * 12), icon: <CreditCard className="w-4 h-4" /> },
                { label: 'Recherches totales', value: formatNumber(stats?.totalSearches ?? 0), icon: <Search className="w-4 h-4" /> },
              ].map(stat => (
                <motion.div key={stat.label} variants={item}>
                  <StatCard label={stat.label} value={stat.value} icon={stat.icon} />
                </motion.div>
              ))}
            </motion.div>

            {/* System health */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Server className="w-4 h-4 text-gray-400" />
                    <h3 className="text-sm font-semibold text-white">Santé système</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'API', status: stats?.health?.api ?? 'ok' },
                      { label: 'Base de données', status: stats?.health?.db ?? 'ok' },
                      { label: 'Redis', status: stats?.health?.redis ?? 'ok' },
                    ].map(({ label, status }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">{label}</span>
                        <Badge variant={status === 'ok' ? 'default' : 'muted'}>
                          {status === 'ok' ? 'OK' : 'KO'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-5">
                  <h3 className="text-sm font-semibold text-white mb-4">Distribution plans</h3>
                  <div className="space-y-2">
                    {['FREE', 'BASIC', 'PREMIUM', 'BUSINESS'].map(plan => {
                      const count = stats?.planDistribution?.[plan] ?? 0
                      const total = stats?.totalUsers ?? 1
                      const pct = Math.round((count / total) * 100)
                      return (
                        <div key={plan}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400">{plan}</span>
                            <span className="text-gray-500">{formatNumber(count)} ({pct}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gray-400 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Liens rapides</h3>
                  </div>
                  <div className="space-y-1">
                    {[
                      { label: 'Gérer les admins', href: '/owner/admins' },
                      { label: 'Revenus & stats', href: '/owner/revenue' },
                      { label: 'Logs d\'audit', href: '/owner/audit-logs' },
                      { label: 'Maintenance', href: '/owner/maintenance' },
                      { label: 'Paramètres système', href: '/owner/settings' },
                    ].map(({ label, href }) => (
                      <Link
                        key={href}
                        href={href}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm text-gray-400 hover:text-white"
                      >
                        {label}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
