'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import {
  Users,
  Search,
  Filter,
  ChevronRight,
  UserCheck,
  UserX,
  RefreshCw,
} from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { adminApi } from '@/lib/api'
import { formatDate, formatNumber, getPlanLabel, cn } from '@/lib/utils'

const PLAN_OPTIONS = [
  { value: '', label: 'Tous les plans' },
  { value: 'FREE', label: 'Free' },
  { value: 'BASIC', label: 'Basic' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'BUSINESS', label: 'Business' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'SUSPENDED', label: 'Suspendu' },
  { value: 'PENDING_VERIFICATION', label: 'En attente' },
]

const ROLE_OPTIONS = [
  { value: '', label: 'Tous les rôles' },
  { value: 'USER', label: 'Utilisateur' },
  { value: 'ADMIN', label: 'Admin' },
]

export default function AdminUsersPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [plan, setPlan] = useState('')
  const [status, setStatus] = useState('')
  const [role, setRole] = useState('')

  const { data, isLoading, mutate } = useSWR(
    ['admin-users', page, search, plan, status, role],
    () => adminApi.getUsers({ page, limit: 20, search, plan, status, role }),
  )

  const users = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="Utilisateurs"
        description={`${formatNumber(total)} comptes enregistrés`}
      />

      <div className="flex-1 p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48">
            <Input
              placeholder="Rechercher par email, username…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            value={plan}
            onChange={e => { setPlan(e.target.value); setPage(1) }}
            options={PLAN_OPTIONS}
          />
          <Select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1) }}
            options={STATUS_OPTIONS}
          />
          <Select
            value={role}
            onChange={e => { setRole(e.target.value); setPage(1) }}
            options={ROLE_OPTIONS}
          />
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Table */}
        <Card>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : !users.length ? (
            <div className="p-10 flex flex-col items-center text-center">
              <Users className="w-8 h-8 text-gray-700 mb-3" />
              <p className="text-sm text-gray-500">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-800 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-4">Utilisateur</div>
                <div className="col-span-2">Plan</div>
                <div className="col-span-2">Statut</div>
                <div className="col-span-2">Crédits</div>
                <div className="col-span-1">Inscrit</div>
                <div className="col-span-1" />
              </div>
              <div className="divide-y divide-gray-800">
                {users.map((user: any) => (
                  <div
                    key={user.id}
                    className="grid grid-cols-12 gap-4 items-center px-5 py-3.5 hover:bg-gray-900/50 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                  >
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-white uppercase">
                          {user.username?.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user.username}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Badge variant="outline">{getPlanLabel(user.subscription?.plan ?? 'FREE')}</Badge>
                    </div>
                    <div className="col-span-2">
                      <Badge variant={user.accountStatus === 'ACTIVE' ? 'default' : 'muted'}>
                        {user.accountStatus === 'ACTIVE' ? 'Actif' : user.accountStatus === 'SUSPENDED' ? 'Suspendu' : 'En attente'}
                      </Badge>
                    </div>
                    <div className="col-span-2 text-sm text-gray-400">
                      {formatNumber(user.credits)}
                    </div>
                    <div className="col-span-1 text-xs text-gray-500">
                      {formatDate(user.createdAt)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Page {page} sur {totalPages} · {formatNumber(total)} résultats
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Précédent
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
