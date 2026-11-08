'use client'

import useSWR from 'swr'
import Link from 'next/link'
import {
  Users, Search, Ticket, Activity, Shield, ArrowRight, Wifi
} from 'lucide-react'
import { adminApi } from '@/lib/api'
import type { AdminStats, User } from '@/types'

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  note,
}: {
  label: string
  value: string | number
  icon:  React.ElementType
  href?: string
  note?: string
}) {
  const inner = (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors h-full">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <Icon size={16} className="text-gray-600" />
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {note && <p className="text-xs text-gray-600 mt-1">{note}</p>}
    </div>
  )

  return href ? <Link href={href} className="block">{inner}</Link> : inner
}

// ── User row ──────────────────────────────────────────────────────────────────

function UserRow({ user }: { user: User }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white truncate">{user.username}</p>
          {(user.role === 'ADMIN' || user.role === 'OWNER') && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-white/10 text-gray-400 rounded">
              {user.role}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 truncate">{user.email}</p>
      </div>
      <div className="ml-4 text-right shrink-0">
        <p className="text-xs text-gray-500">{user.subscription?.plan ?? 'FREE'}</p>
        <p className="text-xs text-gray-700">
          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
        </p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { data: stats } = useSWR<AdminStats>('admin-stats', adminApi.stats, {
    revalidateOnFocus: false,
    refreshInterval: 30_000,
  })

  const { data: usersData } = useSWR(
    'admin-recent-users',
    () => adminApi.users({ page: 1, limit: 10 }),
    { revalidateOnFocus: false },
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={18} className="text-gray-500" />
          <h1 className="text-2xl font-bold text-white">Administration</h1>
        </div>
        <p className="text-sm text-gray-500">
          ADW Searcher — vue d'ensemble de la plateforme
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Utilisateurs"
          value={stats?.totalUsers ?? '—'}
          icon={Users}
          href="/admin/users"
          note={`${stats?.activeUsers ?? '—'} actifs`}
        />
        <StatCard
          label="Recherches aujourd'hui"
          value={stats?.searchesToday ?? '—'}
          icon={Search}
          href="/admin/logs"
        />
        <StatCard
          label="Tickets ouverts"
          value={stats?.openTickets ?? '—'}
          icon={Ticket}
          href="/admin/tickets"
        />
        <StatCard
          label="IPs uniques (24h)"
          value={stats?.uniqueIpsToday ?? '—'}
          icon={Wifi}
          href="/admin/logs"
          note={`${stats?.totalIpLogsToday ?? '—'} evenements`}
        />
      </div>

      {/* Activity logs shortcut */}
      <div className="mb-6">
        <Link
          href="/admin/logs"
          className="flex items-center justify-between p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Activity size={18} className="text-gray-500" />
            <div>
              <p className="text-sm font-medium text-white">Journaux d'activite</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Connexions, recherches, enregistrements — toutes les IPs et utilisateurs
              </p>
            </div>
          </div>
          <ArrowRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
        </Link>
      </div>

      {/* Recent users */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Utilisateurs recents</h2>
          <Link
            href="/admin/users"
            className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
          >
            Gerer <ArrowRight size={12} />
          </Link>
        </div>

        {usersData?.data?.length ? (
          <div>
            {usersData.data.map((u: User) => (
              <UserRow key={u.id} user={u} />
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <Users size={24} className="text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Aucun utilisateur</p>
          </div>
        )}
      </div>
    </div>
  )
}
