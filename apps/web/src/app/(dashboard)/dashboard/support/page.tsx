'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  Plus,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Paperclip,
} from 'lucide-react'
import Link from 'next/link'
import { DashboardHeader } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { ticketsApi } from '@/lib/api'
import { formatRelativeTime, getTicketStatusStyle } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Ticket } from '@/types'

const CATEGORIES = [
  { value: 'TECHNICAL', label: 'Problème technique' },
  { value: 'BILLING', label: 'Facturation' },
  { value: 'ACCOUNT', label: 'Mon compte' },
  { value: 'API', label: 'API & Intégration' },
  { value: 'OTHER', label: 'Autre' },
]

const PRIORITIES = [
  { value: 'LOW', label: 'Faible' },
  { value: 'MEDIUM', label: 'Normale' },
  { value: 'HIGH', label: 'Haute' },
]

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  RESOLVED: 'Résolu',
  CLOSED: 'Fermé',
}

export default function SupportPage() {
  const { data, isLoading, mutate } = useSWR('my-tickets', () => ticketsApi.getMyTickets())

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    subject: '',
    message: '',
    category: 'TECHNICAL',
    priority: 'MEDIUM',
  })

  const handleCreate = async () => {
    if (!form.subject.trim() || !form.message.trim()) return
    setCreating(true)
    try {
      await ticketsApi.createTicket(form)
      await mutate()
      setCreateOpen(false)
      setForm({ subject: '', message: '', category: 'TECHNICAL', priority: 'MEDIUM' })
      toast.success('Ticket créé')
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur')
    } finally {
      setCreating(false)
    }
  }

  const tickets: Ticket[] = data?.data ?? []

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="Support"
        description="Contactez notre équipe ou consultez vos tickets"
      />

      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
            </h2>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            Nouveau ticket
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : !tickets.length ? (
          <Card>
            <div className="p-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Aucun ticket</h3>
              <p className="text-xs text-gray-500 mb-4">
                Contactez notre équipe si vous avez besoin d'aide
              </p>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4" />
                Créer un ticket
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="divide-y divide-gray-800">
              {tickets.map((ticket) => {
                const statusStyle = getTicketStatusStyle(ticket.status)
                return (
                  <Link
                    key={ticket.id}
                    href={`/dashboard/support/${ticket.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-900/50 transition-colors group"
                  >
                    <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-white">
                        {ticket.subject}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {CATEGORIES.find(c => c.value === ticket.category)?.label ?? ticket.category}
                        {' · '}
                        {formatRelativeTime(ticket.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className={statusStyle}>
                        {STATUS_LABELS[ticket.status] ?? ticket.status}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Create modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nouveau ticket"
        description="Décrivez votre problème et notre équipe vous répondra."
      >
        <div className="space-y-4">
          <Input
            label="Sujet"
            placeholder="Décrivez brièvement le problème"
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Catégorie"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              options={CATEGORIES}
            />
            <Select
              label="Priorité"
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              options={PRIORITIES}
            />
          </div>
          <Textarea
            label="Message"
            placeholder="Décrivez votre problème en détail…"
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            rows={5}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              isLoading={creating}
              disabled={!form.subject.trim() || !form.message.trim()}
            >
              Envoyer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
