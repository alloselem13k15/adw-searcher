'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { Search, Clock, Key, CreditCard, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { searchApi } from '@/lib/api'
import type { SearchHistoryEntry } from '@/types'

// ── Daily searches gauge ──────────────────────────────────────────────────────

function SearchesGauge({ used, total }: { used: number; total: number }) {
  const pct  = total > 0 ? Math.min(100, (used / total) * 100) : 0
  const left = total - used

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Recherches aujourd'hui</p>
          <p className="text-3xl font-bold text-white">
            {used}
            <span className="text-gray-600 text-lg font-normal"> / {total}</span>
          </p>
        </div>
        <Search size={20} className="text-gray-600 mt-1" />
      </div>

      {/* Bar */}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full bg-white transition-all duration-500"
          style={{ width: `${pct}%`, opacity: pct > 80 ? 1 : 0.5 }}
        />
      </div>

      <p className="text-xs text-gray-600">
        {left > 0
          ? `${left} recherche${left > 1 ? 's' : ''} restante${left > 1 ? 's' : ''} — reinitialise a minuit`
          : 'Limite atteinte — reinitialise a minuit'}
      </p>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string
  value: string | number
  icon:  React.ElementType
  href?: string
}) {
  const inner = (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <Icon size={16} className="text-gray-600" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )

  return href ? <Link href={href}>{inner}</Link> : inner
}

// ── History row ───────────────────────────────────────────────────────────────

function HistoryRow({ entry }: { entry: SearchHistoryEntry }) {
  const params  = entry.queryParams ?? {}
  const preview = Object.entries(params)
    .filter(([k, v]) => !['page', 'per_page', 'flexible'].includes(k) && typeof v === 'string' && (v as string).trim())
    .slice(0, 3)
    .map(([, v]) => v as string)
    .join(' · ') || entry.query

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white truncate">{preview}</p>
        <p className="text-xs text-gray-600 mt-0.5">
          {entry.resultsCount} resultat{entry.resultsCount !== 1 ? 's' : ''} &middot;{' '}
          {new Date(entry.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)
  const sub  = user?.subscription

  const { data: historyData } = useSWR(
    'dashboard-history',
    () => searchApi.getHistory(1, 5),
    { revalidateOnFocus: false },
  )

  const searchesUsed  = sub?.searchesUsedToday  ?? 0
  const searchesTotal = sub?.searchesPerDay      ?? 100
  const isOwner       = user?.role === 'OWNER'

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Bonjour, {user?.username}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {sub?.plan ?? 'FREE'} &middot; ADW Searcher — version en attendant
        </p>
      </div>

      {/* Daily limit or owner banner */}
      {isOwner ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 mb-6 flex items-center gap-3">
          <Clock size={18} className="text-gray-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">Acces illimite</p>
            <p className="text-xs text-gray-500">Votre compte owner n'a pas de limite de recherches quotidiennes.</p>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <SearchesGauge used={searchesUsed} total={searchesTotal} />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Recherches totales"
          value={historyData?.total ?? '—'}
          icon={Search}
          href="/dashboard/history"
        />
        <StatCard
          label="Plan actuel"
          value={sub?.plan ?? 'FREE'}
          icon={CreditCard}
        />
        <StatCard
          label="Recharge a"
          value="Minuit"
          icon={Clock}
        />
      </div>

      {/* Quick action */}
      <div className="mb-8">
        <Link
          href="/dashboard/search"
          className="flex items-center justify-between p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Search size={18} className="text-gray-500" />
            <div>
              <p className="text-sm font-medium text-white">Lancer une recherche</p>
              <p className="text-xs text-gray-500 mt-0.5">40+ champs combinables — identite, contact, localisation...</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
        </Link>
      </div>

      {/* Daily limit warning if near cap */}
      {!isOwner && searchesUsed >= searchesTotal * 0.9 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <AlertCircle size={16} className="text-gray-400 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-400">
            Vous approchez de votre limite journaliere ({searchesUsed}/{searchesTotal}).
            Les limites sont reinitialises a minuit chaque jour.
          </p>
        </div>
      )}

      {/* Recent searches */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Recherches recentes</h2>
          <Link
            href="/dashboard/history"
            className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
          >
            Tout voir <ArrowRight size={12} />
          </Link>
        </div>

        {historyData?.data?.length ? (
          <div>
            {historyData.data.map(entry => (
              <HistoryRow key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Search size={24} className="text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Aucune recherche effectuee</p>
            <Link
              href="/dashboard/search"
              className="inline-flex items-center gap-1.5 mt-3 text-xs text-gray-500 hover:text-white transition-colors"
            >
              Commencer <ArrowRight size={12} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
