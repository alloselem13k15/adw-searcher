'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import { Search, Shield, ChevronLeft, ChevronRight } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ownerApi } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'

const ACTION_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  USER_SUSPENDED: 'error',
  USER_UNSUSPENDED: 'success',
  CREDITS_ADJUSTED: 'warning',
  ADMIN_PROMOTED: 'warning',
  ADMIN_DEMOTED: 'error',
  TICKET_REPLIED: 'default',
  ANNOUNCEMENT_CREATED: 'default',
  MAINTENANCE_ENABLED: 'error',
  MAINTENANCE_DISABLED: 'success',
  SETTING_UPDATED: 'warning',
  USER_ROLE_CHANGED: 'warning',
}

export default function OwnerAuditLogsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const { data, isLoading } = useSWR(
    ['owner-audit-logs', page, debouncedSearch, action],
    () => ownerApi.getAuditLogs({ page, limit: 50, search: debouncedSearch, action }),
  )

  const logs = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 50)

  const handleSearch = (v: string) => {
    setSearch(v)
    clearTimeout((window as any).__auditSearch)
    ;(window as any).__auditSearch = setTimeout(() => {
      setDebouncedSearch(v)
      setPage(1)
    }, 400)
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="Journaux d'audit"
        description="Toutes les actions effectuées par les administrateurs"
      />

      <div className="flex-1 p-6 space-y-4">
        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-gray-600"
            value={action}
            onChange={e => { setAction(e.target.value); setPage(1) }}
          >
            <option value="">Toutes les actions</option>
            {Object.keys(ACTION_COLORS).map(a => (
              <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <Card>
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-800 text-xs text-gray-500 font-medium uppercase tracking-wider">
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Admin</div>
            <div className="col-span-3">Action</div>
            <div className="col-span-5">Détails</div>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !logs.length ? (
            <div className="text-center py-16">
              <Shield className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Aucun journal d'audit</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/60">
              {logs.map((log: any, i: number) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.01 }}
                  className="grid grid-cols-12 gap-4 px-5 py-3 hover:bg-gray-900/40 transition-colors"
                >
                  <div className="col-span-2 text-xs font-mono text-gray-500">
                    {formatDateTime(log.createdAt)}
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-white">{log.admin?.username ?? '—'}</span>
                    {log.admin?.role === 'OWNER' && (
                      <span className="ml-1 text-xs text-gray-600">(owner)</span>
                    )}
                  </div>
                  <div className="col-span-3">
                    <Badge variant={ACTION_COLORS[log.action] ?? 'default'}>
                      <span className="font-mono text-[10px]">{log.action}</span>
                    </Badge>
                  </div>
                  <div className="col-span-5 text-xs text-gray-400 font-mono break-all">
                    {typeof log.details === 'object'
                      ? JSON.stringify(log.details)
                      : (log.details ?? '—')}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {total} entrées · page {page}/{totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
