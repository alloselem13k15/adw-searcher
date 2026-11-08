'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Key,
  Plus,
  Trash2,
  Copy,
  CheckCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  Zap,
} from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { usersApi } from '@/lib/api'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { ApiKey } from '@/types'

function MaskedKey({ keyPrefix, rawKey }: { keyPrefix: string; rawKey?: string }) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const display = visible && rawKey ? rawKey : `${keyPrefix}${'•'.repeat(32)}`

  const copy = () => {
    navigator.clipboard.writeText(rawKey ?? display)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Clé copiée')
  }

  return (
    <div className="flex items-center gap-2 font-mono text-sm text-gray-300 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
      <span className="flex-1 truncate">{display}</span>
      {rawKey && (
        <button onClick={() => setVisible(!visible)} className="text-gray-500 hover:text-white transition-colors">
          {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      )}
      <button onClick={copy} className="text-gray-500 hover:text-white transition-colors">
        {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}

export default function ApiKeysPage() {
  const { data, isLoading, mutate } = useSWR('api-keys', () => usersApi.getApiKeys())

  const [createOpen, setCreateOpen] = useState(false)
  const [deleteKey, setDeleteKey] = useState<ApiKey | null>(null)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [rawKey, setRawKey] = useState<{ id: string; key: string } | null>(null)

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await usersApi.createApiKey(newName.trim())
      setRawKey({ id: res.id, key: res.key })
      setNewName('')
      setCreateOpen(false)
      await mutate()
      toast.success('Clé API créée')
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteKey) return
    try {
      await usersApi.deleteApiKey(deleteKey.id)
      await mutate()
      toast.success('Clé supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleteKey(null)
    }
  }

  const keys: ApiKey[] = data?.data ?? []

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="Clés API"
        description="Gérez vos clés d'accès à l'API ADW Intelligence"
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Raw key revealed after creation */}
        <AnimatePresence>
          {rawKey && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="p-4 bg-gray-900 border border-gray-700 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-semibold text-white">
                    Copiez votre clé maintenant — elle ne sera plus affichée
                  </p>
                </div>
                <MaskedKey keyPrefix="" rawKey={rawKey.key} />
                <Button size="sm" variant="outline" onClick={() => setRawKey(null)}>
                  J'ai copié ma clé
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header with create button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">
              {keys.length} clé{keys.length !== 1 ? 's' : ''}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Maximum 10 clés par compte</p>
          </div>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            disabled={keys.length >= 10}
          >
            <Plus className="w-4 h-4" />
            Nouvelle clé
          </Button>
        </div>

        {/* Keys list */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : !keys.length ? (
          <Card>
            <div className="p-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center mb-4">
                <Key className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Aucune clé API</h3>
              <p className="text-xs text-gray-500 mb-4">
                Créez une clé pour accéder à l'API ADW Intelligence
              </p>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4" />
                Créer une clé
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="divide-y divide-gray-800">
              {keys.map((key) => (
                <div key={key.id} className="flex items-center gap-4 p-5 hover:bg-gray-900/50 transition-colors">
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Key className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{key.name}</span>
                      <Badge variant={key.isActive ? 'default' : 'muted'}>
                        {key.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <MaskedKey keyPrefix={key.prefix} />
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Créée {formatRelativeTime(key.createdAt)}
                      </span>
                      {key.lastUsedAt && (
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Utilisée {formatRelativeTime(key.lastUsedAt)}
                        </span>
                      )}
                      <span>{key.usageCount ?? 0} appels</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteKey(key)}
                    className="p-2 text-gray-600 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-all"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* API docs link */}
        <Card>
          <div className="p-5">
            <h3 className="text-sm font-semibold text-white mb-1">Documentation API</h3>
            <p className="text-xs text-gray-500 mb-3">
              Authentifiez vos requêtes avec l'en-tête{' '}
              <code className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300 font-mono">
                X-API-Key: votre-clé
              </code>
            </p>
            <div className="bg-black border border-gray-800 rounded-lg p-4 font-mono text-xs text-gray-300">
              <span className="text-gray-600">POST</span>{' '}
              <span className="text-white">/api/v1/search</span>
              <br />
              <span className="text-gray-600">X-API-Key:</span>{' '}
              <span className="text-gray-400">adw_your_key_here</span>
              <br />
              <span className="text-gray-600">Content-Type:</span>{' '}
              <span className="text-gray-400">application/json</span>
              <br /><br />
              <span className="text-gray-600">{'{'}</span>
              <br />
              <span className="text-gray-600">{'  '}"type":</span>{' '}
              <span className="text-gray-400">"EMAIL",</span>
              <br />
              <span className="text-gray-600">{'  '}"query":</span>{' '}
              <span className="text-gray-400">"target@example.com"</span>
              <br />
              <span className="text-gray-600">{'}'}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Create modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Créer une clé API"
        description="Donnez un nom descriptif à cette clé pour l'identifier facilement."
      >
        <div className="space-y-4">
          <Input
            label="Nom de la clé"
            placeholder="Production, Mobile App, Script…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
            autoFocus
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} isLoading={creating} disabled={!newName.trim()}>
              Créer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={!!deleteKey}
        onClose={() => setDeleteKey(null)}
        onConfirm={handleDelete}
        title="Supprimer la clé API"
        description={`La clé "${deleteKey?.name}" sera définitivement supprimée. Les intégrations utilisant cette clé cesseront de fonctionner.`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  )
}
