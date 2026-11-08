'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import { Megaphone, Plus, Trash2 } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { adminApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const TYPE_OPTIONS = [
  { value: 'INFO', label: 'Information' },
  { value: 'WARNING', label: 'Avertissement' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
]

export default function AnnouncementsPage() {
  const { data, isLoading, mutate } = useSWR('admin-announcements', () => adminApi.getAnnouncements())

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', content: '', type: 'INFO' })

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    setCreating(true)
    try {
      await adminApi.createAnnouncement(form)
      await mutate()
      setCreateOpen(false)
      setForm({ title: '', content: '', type: 'INFO' })
      toast.success('Annonce créée')
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await adminApi.deleteAnnouncement(deleteId)
      await mutate()
      toast.success('Annonce supprimée')
    } catch {
      toast.error('Erreur')
    } finally {
      setDeleteId(null)
    }
  }

  const announcements = data?.data ?? []

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="Annonces"
        description="Communiquez avec tous les utilisateurs"
      />

      <div className="flex-1 p-6 space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            Nouvelle annonce
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : !announcements.length ? (
          <Card>
            <div className="p-10 flex flex-col items-center text-center">
              <Megaphone className="w-8 h-8 text-gray-700 mb-3" />
              <p className="text-sm text-gray-500">Aucune annonce</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann: any) => (
              <Card key={ann.id}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-white">{ann.title}</h3>
                        <Badge variant="muted">{ann.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed">{ann.content}</p>
                      <p className="text-xs text-gray-600 mt-2">{formatDate(ann.createdAt)}</p>
                    </div>
                    <button
                      onClick={() => setDeleteId(ann.id)}
                      className="p-2 text-gray-600 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nouvelle annonce"
        description="Cette annonce sera visible par tous les utilisateurs connectés."
      >
        <div className="space-y-4">
          <Input
            label="Titre"
            placeholder="Maintenance programmée"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <Textarea
            label="Contenu"
            placeholder="Décrivez l'annonce…"
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            rows={4}
          />
          <Select
            label="Type"
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            options={TYPE_OPTIONS}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} isLoading={creating} disabled={!form.title.trim() || !form.content.trim()}>
              Publier
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Supprimer l'annonce"
        description="Cette annonce ne sera plus visible par les utilisateurs."
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  )
}
