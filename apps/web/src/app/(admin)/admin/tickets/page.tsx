'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  MessageSquare,
  Search,
  Send,
  ChevronDown,
  ChevronUp,
  User,
  Shield,
} from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { adminApi } from '@/lib/api'
import { formatRelativeTime, getTicketStatusStyle, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  { value: '', label: 'Tous' },
  { value: 'OPEN', label: 'Ouverts' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'RESOLVED', label: 'Résolus' },
  { value: 'CLOSED', label: 'Fermés' },
]

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  RESOLVED: 'Résolu',
  CLOSED: 'Fermé',
}

const NEXT_STATUSES: Record<string, string[]> = {
  OPEN: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'CLOSED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
}

function TicketRow({ ticket, onUpdate }: { ticket: any; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(ticket.status)

  const handleReply = async () => {
    if (!reply.trim()) return
    setSending(true)
    try {
      await adminApi.replyToTicket(ticket.id, reply.trim(), status)
      setReply('')
      onUpdate()
      toast.success('Réponse envoyée')
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-b border-gray-800 last:border-0">
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-900/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white truncate">{ticket.subject}</p>
            <Badge variant="muted">{ticket.priority}</Badge>
          </div>
          <p className="text-xs text-gray-500">
            {ticket.user?.username} · {formatRelativeTime(ticket.updatedAt)}
          </p>
        </div>
        <Badge variant="outline" className={getTicketStatusStyle(ticket.status)}>
          {STATUS_LABELS[ticket.status] ?? ticket.status}
        </Badge>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
        )}
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 bg-gray-900/20">
          {/* Messages thread */}
          <div className="space-y-3 pt-2">
            {ticket.messages?.map((msg: any) => {
              const isStaff = msg.author?.role === 'ADMIN' || msg.author?.role === 'OWNER'
              return (
                <div key={msg.id} className="flex gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isStaff ? 'bg-white' : 'bg-gray-700'}`}>
                    {isStaff ? (
                      <Shield className="w-3 h-3 text-black" />
                    ) : (
                      <User className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-300">
                        {isStaff ? 'Support ADW' : msg.author?.username}
                      </span>
                      <span className="text-xs text-gray-600">{formatRelativeTime(msg.createdAt)}</span>
                    </div>
                    <div className="text-sm text-gray-300 bg-gray-800/50 rounded-lg px-3 py-2.5 whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Admin reply */}
          {ticket.status !== 'CLOSED' && (
            <div className="border border-gray-700 rounded-xl overflow-hidden">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Répondre au ticket…"
                rows={3}
                className="w-full bg-transparent px-4 pt-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none"
              />
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-800 bg-gray-900/40">
                <Select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  options={[
                    { value: ticket.status, label: `Statut actuel: ${STATUS_LABELS[ticket.status]}` },
                    ...NEXT_STATUSES[ticket.status].map(s => ({
                      value: s,
                      label: STATUS_LABELS[s] ?? s,
                    })),
                  ]}
                />
                <Button
                  size="sm"
                  onClick={handleReply}
                  isLoading={sending}
                  disabled={!reply.trim()}
                >
                  <Send className="w-3.5 h-3.5" />
                  Répondre
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminTicketsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('OPEN')
  const [page, setPage] = useState(1)

  const { data, isLoading, mutate } = useSWR(
    ['admin-tickets', page, search, statusFilter],
    () => adminApi.getTickets({ page, limit: 20, search, status: statusFilter }),
  )

  const tickets = data?.data ?? []
  const total = data?.total ?? 0

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="Tickets support"
        description={`${total} ticket${total !== 1 ? 's' : ''}`}
      />

      <div className="flex-1 p-6 space-y-4">
        {/* Filters */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Rechercher par sujet, utilisateur…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            options={STATUS_OPTIONS}
          />
        </div>

        <Card>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : !tickets.length ? (
            <div className="p-10 flex flex-col items-center text-center">
              <MessageSquare className="w-8 h-8 text-gray-700 mb-3" />
              <p className="text-sm text-gray-500">Aucun ticket trouvé</p>
            </div>
          ) : (
            <div>
              {tickets.map((ticket: any) => (
                <TicketRow key={ticket.id} ticket={ticket} onUpdate={mutate} />
              ))}
            </div>
          )}
        </Card>

        {Math.ceil(total / 20) > 1 && (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
              Précédent
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}>
              Suivant
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
