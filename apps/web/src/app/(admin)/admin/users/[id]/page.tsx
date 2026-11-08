'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import {
  ArrowLeft,
  User,
  Shield,
  AlertTriangle,
  Zap,
  Plus,
  Minus,
  Clock,
  Key,
  Search,
} from 'lucide-react'
import Link from 'next/link'
import { DashboardHeader } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { adminApi } from '@/lib/api'
import { formatDate, formatDateTime, formatNumber, getPlanLabel } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminUserDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()

  const { data: user, isLoading, mutate } = useSWR(
    `admin-user-${id}`,
    () => adminApi.getUser(id),
  )

  const [creditAmount, setCreditAmount] = useState('')
  const [creditReason, setCreditReason] = useState('')
  const [creditLoading, setCreditLoading] = useState(false)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [unsuspendOpen, setUnsuspendOpen] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')

  const handleAdjustCredits = async (op: 'add' | 'remove') => {
    const amount = parseInt(creditAmount)
    if (!amount || amount <= 0) return
    setCreditLoading(true)
    try {
      await adminApi.adjustCredits(id, op === 'add' ? amount : -amount, creditReason)
      await mutate()
      setCreditAmount('')
      setCreditReason('')
      toast.success(`Crédits ${op === 'add' ? 'ajoutés' : 'retirés'}`)
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur')
    } finally {
      setCreditLoading(false)
    }
  }

  const handleSuspend = async () => {
    try {
      await adminApi.suspendUser(id, suspendReason)
      await mutate()
      setSuspendOpen(false)
      toast.success('Compte suspendu')
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur')
    }
  }

  const handleUnsuspend = async () => {
    try {
      await adminApi.unsuspendUser(id)
      await mutate()
      setUnsuspendOpen(false)
      toast.success('Compte réactivé')
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <DashboardHeader title="Utilisateur" />
        <div className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col h-full">
        <DashboardHeader title="Utilisateur introuvable" />
        <div className="p-6">
          <Card>
            <div className="p-10 text-center">
              <p className="text-sm text-gray-500">Cet utilisateur n'existe pas.</p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const isSuspended = user.accountStatus === 'SUSPENDED'

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title={user.username}
        description={user.email}
      />

      <div className="flex-1 p-6 space-y-6 max-w-3xl">
        <Link
          href="/admin/users"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux utilisateurs
        </Link>

        {/* Info card */}
        <Card>
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-lg font-bold text-white">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">{user.username}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="outline">{getPlanLabel(user.subscription?.plan ?? 'FREE')}</Badge>
                    <Badge variant={isSuspended ? 'muted' : 'default'}>
                      {isSuspended ? 'Suspendu' : user.accountStatus === 'ACTIVE' ? 'Actif' : user.accountStatus}
                    </Badge>
                    <Badge variant="outline">{user.role}</Badge>
                    {user.twoFactorEnabled && <Badge variant="outline">2FA</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {isSuspended ? (
                  <Button size="sm" variant="outline" onClick={() => setUnsuspendOpen(true)}>
                    Réactiver
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setSuspendOpen(true)}>
                    <AlertTriangle className="w-4 h-4" />
                    Suspendre
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-gray-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Crédits', value: formatNumber(user.credits) },
                { label: 'Recherches', value: formatNumber(user.searchCount ?? 0) },
                { label: 'Clés API', value: formatNumber(user.apiKeyCount ?? 0) },
                { label: 'Inscrit', value: formatDate(user.createdAt) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Credits adjustment */}
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Ajustement de crédits</h3>
            <div className="space-y-3">
              <Input
                label="Montant"
                type="number"
                placeholder="100"
                value={creditAmount}
                onChange={e => setCreditAmount(e.target.value)}
                hint="Nombre de crédits à ajouter ou retirer"
              />
              <Input
                label="Raison (optionnel)"
                placeholder="Compensation, bonus…"
                value={creditReason}
                onChange={e => setCreditReason(e.target.value)}
              />
              <div className="flex gap-3">
                <Button
                  onClick={() => handleAdjustCredits('add')}
                  isLoading={creditLoading}
                  disabled={!creditAmount}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </Button>
                <Button
                  onClick={() => handleAdjustCredits('remove')}
                  isLoading={creditLoading}
                  disabled={!creditAmount}
                  variant="outline"
                  size="sm"
                >
                  <Minus className="w-4 h-4" />
                  Retirer
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent searches */}
        {user.recentSearches?.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Recherches récentes</h3>
              <div className="space-y-1">
                {user.recentSearches.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-lg">
                    <Search className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                    <span className="text-sm text-gray-300 flex-1 truncate">{s.query}</span>
                    <span className="text-xs text-gray-600">{s.type}</span>
                    <span className="text-xs text-gray-600">{formatDateTime(s.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Suspend modal */}
      <Modal
        isOpen={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        title="Suspendre le compte"
        description="Cette action bloquera l'accès au compte immédiatement."
      >
        <div className="space-y-4">
          <Input
            label="Raison de la suspension"
            placeholder="Violation des CGU, activité suspecte…"
            value={suspendReason}
            onChange={e => setSuspendReason(e.target.value)}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setSuspendOpen(false)}>Annuler</Button>
            <Button variant="danger" onClick={handleSuspend}>Suspendre</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={unsuspendOpen}
        onClose={() => setUnsuspendOpen(false)}
        onConfirm={handleUnsuspend}
        title="Réactiver le compte"
        description={`Le compte de ${user.username} sera réactivé et l'utilisateur pourra se connecter.`}
        confirmLabel="Réactiver"
      />
    </div>
  )
}
