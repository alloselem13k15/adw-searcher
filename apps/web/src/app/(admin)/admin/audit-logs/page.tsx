'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Shield, Search, RefreshCw } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { adminApi } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'

const ACTION_OPTIONS = [
  { value: '', label: 'Toutes les actions' },
  { value: 'USER_SUSPEND', label: 'Suspension' },
  { value: 'USER_UNSUSPEND', label: 'Réactivation' },
  { value: 'CREDIT_ADJUST', label: 'Ajust. crédits' },
  { value: 'TICKET_REPLY', label: 'Réponse ticket' },
  { value: 'ANNOUNCEMENT_CREATE', label: 'Annonce créée' },
  { value: 'ANNOUNCEMENT_DELETE', label: 'Annonce supprimée' },
]

export default function AdminAuditLogsPage() {
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, mutate } = useSWR(
    ['admin-audit-logs', page, search, action],
    () => adminApi.getAuditLogs({ page, limit: 50, search, action }),
  )

  const logs = data?.data ?? []
  const total = data?.total ?? 0

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="Logs d'audit"
        description="Historique des actions administratives"
      />

      <div className="flex-1 p-6 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Rechercher par admin, utilisateur…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            value={action}
            onChange={e => { setAction(e.target.value); setPage(1) }}
            options={ACTION_OPTIONS}
          />
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <Card>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : !logs.length ? (
            <div className="p-10 flex flex-col items-center text-center">
              <Shield className="w-8 h-8 text-gray-700 mb-3" />
              <p className="text-sm text-gray-500">Aucun log trouvé</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-800 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-3">Date</div>
                <div className="col-span-2">Admin</div>
                <div className="col-span-3">Action</div>
                <div className="col-span-4">Détails</div>
              </div>
              <div className="divide-y divide-gray-800">
                {logs.map((log: any) => (
                  <div key={log.id} className="grid grid-cols-12 gap-4 items-center px-5 py-3">
                    <div className="col-span-3 text-xs text-gray-500 font-mono">
                      {formatDateTime(log.createdAt)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-300 truncate">
                      {log.admin?.username ?? 'Système'}
                    </div>
                    <div className="col-span-3">
                      <Badge variant="outline" className="font-mono text-xs">
                        {log.action}
                      </Badge>
                    </div>
                    <div className="col-span-4 text-xs text-gray-500 truncate">
                      {log.targetUser ? `→ ${log.targetUser.username}` : ''}
                      {log.details ? ` · ${JSON.stringify(log.details)}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {Math.ceil(total / 50) > 1 && (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
              Précédent
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 50)}>
              Suivant
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
