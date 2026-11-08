'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Settings, Plus, Save, Trash2, RefreshCw } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { ownerApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function OwnerSettingsPage() {
  const { data, isLoading, mutate } = useSWR('system-settings', () => ownerApi.getSettings())

  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [adding, setAdding] = useState(false)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  const settings: Array<{ key: string; value: string }> = data?.data ?? []

  const handleAdd = async () => {
    if (!newKey.trim() || !newValue.trim()) return
    setAdding(true)
    try {
      await ownerApi.setSetting(newKey.trim(), newValue.trim())
      await mutate()
      setNewKey('')
      setNewValue('')
      toast.success('Paramètre ajouté')
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur')
    } finally {
      setAdding(false)
    }
  }

  const handleSave = async (key: string) => {
    const val = editValues[key]
    if (val === undefined) return
    setSaving(s => ({ ...s, [key]: true }))
    try {
      await ownerApi.setSetting(key, val)
      await mutate()
      setEditValues(e => { const copy = { ...e }; delete copy[key]; return copy })
      toast.success('Paramètre mis à jour')
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur')
    } finally {
      setSaving(s => ({ ...s, [key]: false }))
    }
  }

  const handleDelete = async (key: string) => {
    try {
      await ownerApi.deleteSetting(key)
      await mutate()
      toast.success('Paramètre supprimé')
    } catch {
      toast.error('Erreur')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="Paramètres système"
        description="Variables de configuration globale de la plateforme"
      />

      <div className="flex-1 p-6 space-y-6 max-w-2xl">
        {/* Add new */}
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Ajouter un paramètre</h3>
            <div className="flex gap-3">
              <Input
                placeholder="SETTING_KEY"
                value={newKey}
                onChange={e => setNewKey(e.target.value.toUpperCase())}
                className="flex-1"
              />
              <Input
                placeholder="valeur"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAdd} isLoading={adding} disabled={!newKey || !newValue} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Settings list */}
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Paramètres actuels</h3>
              <Button variant="ghost" size="sm" onClick={() => mutate()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : !settings.length ? (
              <div className="text-center py-8">
                <Settings className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Aucun paramètre système</p>
              </div>
            ) : (
              <div className="space-y-3">
                {settings.map(({ key, value }) => {
                  const edited = editValues[key]
                  const isDirty = edited !== undefined && edited !== value
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-48 flex-shrink-0">
                        <code className="text-xs font-mono text-gray-400 bg-gray-800 px-2 py-1 rounded">
                          {key}
                        </code>
                      </div>
                      <input
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500 font-mono"
                        value={edited ?? value}
                        onChange={e => setEditValues(ev => ({ ...ev, [key]: e.target.value }))}
                      />
                      {isDirty && (
                        <Button
                          size="sm"
                          onClick={() => handleSave(key)}
                          isLoading={saving[key]}
                        >
                          <Save className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <button
                        onClick={() => handleDelete(key)}
                        className="p-2 text-gray-600 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
