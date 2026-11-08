'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  Activity, Search, ChevronLeft, ChevronRight,
  LogIn, LogOut, UserPlus, AlertTriangle, Filter
} from 'lucide-react'
import { adminApi } from '@/lib/api'
import type { IpLogEntry, IpLogAction } from '@/types'

// ── Action badge ──────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<IpLogAction, { label: string; icon: React.ElementType; cls: string }> = {
  LOGIN:        { label: 'Connexion',         icon: LogIn,       cls: 'text-gray-300 bg-white/10' },
  LOGOUT:       { label: 'Deconnexion',       icon: LogOut,      cls: 'text-gray-500 bg-white/5'  },
  REGISTER:     { label: 'Inscription',       icon: UserPlus,    cls: 'text-gray-300 bg-white/10' },
  SEARCH:       { label: 'Recherche',         icon: Search,      cls: 'text-gray-300 bg-white/10' },
  FAILED_LOGIN: { label: 'Echec connexion',   icon: AlertTriangle,cls: 'text-gray-400 bg-white/5' },
}

function ActionBadge({ action }: { action: IpLogAction }) {
  const cfg  = ACTION_CONFIG[action] ?? ACTION_CONFIG.LOGIN
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${cfg.cls}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  )
}

// ── Search params summary ─────────────────────────────────────────────────────

function SearchParamsSummary({ params }: { params: Record<string, unknown> | null }) {
  if (!params) return <span className="text-gray-700">—</span>
  const excluded = new Set(['page', 'per_page', 'flexible'])
  const entries  = Object.entries(params)
    .filter(([k, v]) => !excluded.has(k) && typeof v === 'string' && (v as string).trim())
    .slice(0, 4)

  if (!entries.length) return <span className="text-gray-700">—</span>

  return (
    <span className="text-xs text-gray-500">
      {entries.map(([k, v]) => `${k}: ${v}`).join(' · ')}
    </span>
  )
}

// ── Log row ───────────────────────────────────────────────────────────────────

function LogRow({ log }: { log: IpLogEntry }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr
        className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
          log.action === 'SEARCH' ? 'cursor-pointer' : ''
        }`}
        onClick={() => log.action === 'SEARCH' && setExpanded(e => !e)}
      >
        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap font-mono">
          {new Date(log.createdAt).toLocaleString('fr-FR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
          })}
        </td>
        <td className="px-4 py-3">
          <ActionBadge action={log.action} />
        </td>
        <td className="px-4 py-3 text-xs text-gray-400 font-mono">
          {log.ipAddress}
        </td>
        <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">
          {log.user ? (
            <span>
              <span className="text-white">{log.user.username}</span>
              <span className="text-gray-600"> &lt;{log.user.email}&gt;</span>
            </span>
          ) : (
            <span className="text-gray-700">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">
          {log.action === 'SEARCH' && log.searchHistory ? (
            <SearchParamsSummary params={(log.searchHistory as { queryParams?: Record<string, unknown> }).queryParams ?? null} />
          ) : (
            <span className="text-gray-700">
              {typeof log.details === 'object' && log.details !== null
                ? Object.entries(log.details)
                    .filter(([k]) => k !== 'userAgent')
                    .slice(0, 2)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' · ') || '—'
                : '—'}
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-gray-700 text-right">
          {log.action === 'SEARCH' && log.searchHistory && (
            <span className="text-gray-600">
              {(log.searchHistory as { resultsCount?: number }).resultsCount ?? 0} res.
            </span>
          )}
        </td>
      </tr>

      {/* Expanded search details */}
      {expanded && log.searchHistory && (
        <tr className="bg-white/[0.015] border-b border-white/5">
          <td colSpan={6} className="px-6 py-4">
            <p className="text-xs text-gray-500 mb-2 font-medium">Parametres de recherche</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.entries(
                (log.searchHistory as { queryParams?: Record<string, unknown> }).queryParams ?? {}
              )
                .filter(([k, v]) => !['page', 'per_page', 'flexible'].includes(k) && typeof v === 'string' && (v as string).trim())
                .map(([k, v]) => (
                  <div key={k} className="rounded bg-white/[0.03] border border-white/5 px-3 py-2">
                    <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">{k}</p>
                    <p className="text-xs text-gray-300 truncate">{String(v)}</p>
                  </div>
                ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const ACTION_OPTIONS = ['all', 'LOGIN', 'LOGOUT', 'REGISTER', 'SEARCH', 'FAILED_LOGIN'] as const

export default function AdminLogsPage() {
  const [action, setAction] = useState('all')
  const [ip,     setIp]     = useState('')
  const [page,   setPage]   = useState(1)
  const limit = 50

  const { data, isLoading } = useSWR(
    ['admin-logs', action, ip, page],
    () => adminApi.logs({ action: action === 'all' ? undefined : action, ip: ip || undefined, page, limit }),
    { revalidateOnFocus: false },
  )

  const totalPages = data ? Math.ceil(data.total / limit) : 1

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={18} className="text-gray-500" />
          <h1 className="text-2xl font-bold text-white">Journaux d'activite</h1>
        </div>
        <p className="text-sm text-gray-500">
          Toutes les connexions, recherches et enregistrements — avec IPs et utilisateurs
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Action filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-500" />
          <div className="flex gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
            {ACTION_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => { setAction(opt); setPage(1) }}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  action === opt
                    ? 'bg-white text-black font-medium'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {opt === 'all' ? 'Tout' : ACTION_CONFIG[opt as IpLogAction]?.label ?? opt}
              </button>
            ))}
          </div>
        </div>

        {/* IP filter */}
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            placeholder="Filtrer par IP..."
            value={ip}
            onChange={e => { setIp(e.target.value); setPage(1) }}
            className="pl-8 pr-4 py-1.5 text-xs bg-white/5 border border-white/10 rounded-md text-gray-300 placeholder-gray-700 focus:outline-none focus:border-white/20 w-44"
          />
        </div>

        {/* Total */}
        {data && (
          <div className="ml-auto flex items-center text-xs text-gray-600">
            {data.total} entree{data.total !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">Date</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">Action</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">IP</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">Utilisateur</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">Details</th>
                <th className="px-4 py-3 text-right text-[11px] font-medium text-gray-500 uppercase tracking-wide">Resultats</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-600">
                    Chargement...
                  </td>
                </tr>
              ) : !data?.data?.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Activity size={24} className="text-gray-700 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Aucun journal trouve</p>
                  </td>
                </tr>
              ) : (
                data.data.map(log => (
                  <LogRow key={log.id} log={log} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-600">
            Page {page} / {totalPages} &middot; {data?.total ?? 0} entrees
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
