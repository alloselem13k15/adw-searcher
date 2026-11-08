'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  MessageSquare,
  Send,
  User,
  Shield,
  Clock,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { DashboardHeader } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { ticketsApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { formatDateTime, getTicketStatusStyle } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  RESOLVED: 'Résolu',
  CLOSED: 'Fermé',
}

export default function TicketDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { user } = useAuth()

  const { data: ticket, isLoading, mutate } = useSWR(
    `ticket-${id}`,
    () => ticketsApi.getTicket(id),
  )

  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const handleReply = async () => {
    if (!reply.trim()) return
    setSending(true)
    try {
      await ticketsApi.replyToTicket(id, reply.trim())
      setReply('')
      await mutate()
      toast.success('Réponse envoyée')
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur')
    } finally {
      setSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <DashboardHeader title="Ticket" />
        <div className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="flex flex-col h-full">
        <DashboardHeader title="Ticket introuvable" />
        <div className="p-6">
          <Card>
            <div className="p-10 text-center">
              <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Ce ticket n'existe pas ou vous n'y avez pas accès.</p>
              <Link href="/dashboard/support" className="mt-4 inline-block">
                <Button size="sm" variant="outline">Retour aux tickets</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const isClosed = ticket.status === 'CLOSED' || ticket.status === 'RESOLVED'

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title={ticket.subject}
        description={`Ticket #${ticket.id.slice(0, 8)}`}
      />

      <div className="flex-1 p-6 space-y-4 max-w-3xl">
        {/* Back + meta */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/support"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
          <Badge variant="outline" className={getTicketStatusStyle(ticket.status)}>
            {STATUS_LABELS[ticket.status] ?? ticket.status}
          </Badge>
        </div>

        {/* Messages */}
        <div className="space-y-3">
          {ticket.messages?.map((msg: any) => {
            const isStaff = msg.author?.role === 'ADMIN' || msg.author?.role === 'OWNER'
            const isMe = msg.author?.id === user?.id
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                  isStaff ? 'bg-white' : 'bg-gray-700'
                }`}>
                  {isStaff ? (
                    <Shield className="w-3.5 h-3.5 text-black" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
                <div className={`flex-1 max-w-xl ${isMe ? 'items-end flex flex-col' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-300">
                      {isStaff ? 'Support ADW' : msg.author?.username ?? 'Vous'}
                    </span>
                    {isStaff && (
                      <Badge variant="outline" className="text-xs py-0 border-gray-700 text-gray-400">
                        Staff
                      </Badge>
                    )}
                    <span className="text-xs text-gray-600">
                      {formatDateTime(msg.createdAt)}
                    </span>
                  </div>
                  <div className={`px-4 py-3 rounded-xl text-sm text-gray-200 whitespace-pre-wrap ${
                    isStaff
                      ? 'bg-gray-800 border border-gray-700'
                      : 'bg-gray-900 border border-gray-800'
                  } ${isMe ? 'text-right' : ''}`}>
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Reply box */}
        {!isClosed ? (
          <Card>
            <div className="p-4">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Votre réponse…"
                rows={4}
                className="w-full bg-transparent text-sm text-white placeholder-gray-600 resize-none focus:outline-none"
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.ctrlKey) handleReply()
                }}
              />
              <div className="flex items-center justify-between pt-3 border-t border-gray-800 mt-3">
                <span className="text-xs text-gray-600">Ctrl+Entrée pour envoyer</span>
                <Button
                  size="sm"
                  onClick={handleReply}
                  isLoading={sending}
                  disabled={!reply.trim()}
                >
                  <Send className="w-3.5 h-3.5" />
                  Envoyer
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="flex items-center gap-2 p-4 bg-gray-900 border border-gray-800 rounded-xl">
            <Clock className="w-4 h-4 text-gray-500" />
            <p className="text-sm text-gray-500">
              Ce ticket est {ticket.status === 'RESOLVED' ? 'résolu' : 'fermé'}.
              Ouvrez un nouveau ticket si vous avez d'autres questions.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
