'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Shield, Plus, Trash2, UserCheck } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { ownerApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function OwnerAdminsPage() {
  const { data, isLoading, mutate } = useSWR('owner-admins', () => ownerApi.getAdmins())

  const [promoteOpen, setPromoteOpen] = useState(false)
  const [demoteId, setDemoteId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [promoting, setPromoting] = useState(false)

  const handlePromote = async () => {
    if (!email.trim()) return
    setPromoting(true)
    try {
      await ownerApi.promoteToAdmin(email.trim())
      await mutate()
      setEmail('')
      setPromoteOpen(false)
      toast.success('Utilisateur promu administrateur')
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur')
    } finally {
      setPromoting(false)
    }
  }

  const handleDemote = async () => {
    if (!demoteId) return
    try {
      await ownerApi.demoteAdmin(demoteId)
      await mutate()
      toast.success('Rôle admin retiré')
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur')
    } finally {
      setDemoteId(null)
    }
  }

  const admins = data?.data ?? []

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="Administrateurs"
        description="Gérez les membres de l'équipe d'administration"
      />

      <div className="flex-1 p-6 space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setPromoteOpen(true)}>
            <Plus className="w-4 h-4" />
            Ajouter un admin
          </Button>
        </div>

        <Card>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : !admins.length ? (
            <div className="p-10 flex flex-col items-center text-center">
              <Shield className="w-8 h-8 text-gray-700 mb-3" />
              <p className="text-sm text-gray-500">Aucun administrateur</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {admins.map((admin: any) => (
                <div key={admin.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-white uppercase">
                      {admin.username?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{admin.username}</p>
                    <p className="text-xs text-gray-500">{admin.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {admin.role === 'OWNER' ? 'Owner' : 'Admin'}
                    </Badge>
                    <span className="text-xs text-gray-600">depuis {formatDate(admin.createdAt)}</span>
                    {admin.role !== 'OWNER' && (
                      <button
                        onClick={() => setDemoteId(admin.id)}
                        className="p-2 text-gray-600 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-all"
                        title="Retirer les droits admin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={promoteOpen}
        onClose={() => setPromoteOpen(false)}
        title="Promouvoir un administrateur"
        description="Entrez l'email d'un utilisateur existant à promouvoir admin."
      >
        <div className="space-y-4">
          <Input
            label="Email de l'utilisateur"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handlePromote() }}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setPromoteOpen(false)}>Annuler</Button>
            <Button onClick={handlePromote} isLoading={promoting} disabled={!email.trim()}>
              <UserCheck className="w-4 h-4" />
              Promouvoir
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!demoteId}
        onClose={() => setDemoteId(null)}
        onConfirm={handleDemote}
        title="Retirer les droits admin"
        description="Cet utilisateur perdra l'accès au panel d'administration."
        confirmLabel="Retirer"
        variant="danger"
      />
    </div>
  )
}
