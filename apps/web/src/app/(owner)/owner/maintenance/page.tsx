'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Server, AlertTriangle, CheckCircle } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ConfirmModal } from '@/components/ui/Modal'
import { ownerApi } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function MaintenancePage() {
  const { data, isLoading, mutate } = useSWR('maintenance-status', () => ownerApi.getMaintenanceStatus())

  const [message, setMessage] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toggling, setToggling] = useState(false)

  const isEnabled = data?.enabled ?? false

  const handleToggle = async () => {
    setToggling(true)
    try {
      if (isEnabled) {
        await ownerApi.disableMaintenance()
        toast.success('Mode maintenance désactivé')
      } else {
        await ownerApi.enableMaintenance(message.trim() || undefined)
        toast.success('Mode maintenance activé')
      }
      await mutate()
      setConfirmOpen(false)
      setMessage('')
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur')
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="Mode maintenance"
        description="Bloquez l'accès à la plateforme pour les utilisateurs"
      />

      <div className="flex-1 p-6 space-y-6 max-w-xl">
        {/* Status card */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isEnabled ? 'bg-white' : 'bg-gray-800'
                }`}>
                  <Server className={`w-6 h-6 ${isEnabled ? 'text-black' : 'text-gray-500'}`} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {isEnabled ? 'Maintenance active' : 'Plateforme opérationnelle'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isEnabled
                      ? 'Les utilisateurs voient une page de maintenance'
                      : 'Tous les services fonctionnent normalement'}
                  </p>
                  {isEnabled && data?.enabledAt && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      Activé le {formatDateTime(data.enabledAt)}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant={isEnabled ? 'default' : 'muted'}>
                {isEnabled ? 'Actif' : 'Inactif'}
              </Badge>
            </div>

            {isEnabled && data?.message && (
              <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Message affiché :</p>
                <p className="text-sm text-gray-300">{data.message}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Toggle */}
        <Card>
          <div className="p-6 space-y-4">
            {!isEnabled && (
              <Textarea
                label="Message de maintenance (optionnel)"
                placeholder="Maintenance programmée de 02h00 à 04h00. Merci de votre patience."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
              />
            )}

            <div className="flex items-start gap-3 p-4 bg-gray-900 border border-gray-800 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-400">
                {isEnabled
                  ? 'Désactiver la maintenance rétablira l\'accès pour tous les utilisateurs immédiatement.'
                  : 'Activer la maintenance bloquera l\'accès à tous les utilisateurs sauf l\'owner et les admins.'}
              </p>
            </div>

            <Button
              onClick={() => setConfirmOpen(true)}
              variant={isEnabled ? 'secondary' : 'primary'}
              className="w-full"
              isLoading={isLoading}
            >
              {isEnabled ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Désactiver la maintenance
                </>
              ) : (
                <>
                  <Server className="w-4 h-4" />
                  Activer la maintenance
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleToggle}
        title={isEnabled ? 'Désactiver la maintenance' : 'Activer la maintenance'}
        description={
          isEnabled
            ? 'La plateforme redeviendra accessible à tous les utilisateurs.'
            : 'Tous les utilisateurs seront redirigés vers la page de maintenance. Seuls les admins et owners gardent l\'accès.'
        }
        confirmLabel={isEnabled ? 'Désactiver' : 'Activer'}
        variant={isEnabled ? undefined : 'danger'}
      />
    </div>
  )
}
