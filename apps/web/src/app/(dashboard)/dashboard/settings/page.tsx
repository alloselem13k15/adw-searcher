'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import {
  Shield,
  Smartphone,
  Lock,
  Trash2,
  Download,
  AlertTriangle,
  Copy,
  CheckCheck,
  RefreshCw,
  Monitor,
  Clock,
} from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { usersApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { formatRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'

function Section({ title, description, children }: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()

  // Password change
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)

  // 2FA
  const { data: twoFaData, isLoading: twoFaLoading, mutate: mutateTwoFa } = useSWR(
    '2fa-status',
    () => usersApi.get2FAStatus(),
  )
  const [setupOpen, setSetupOpen] = useState(false)
  const [setupData, setSetupData] = useState<{ qrCode: string; secret: string; backupCodes: string[] } | null>(null)
  const [totpCode, setTotpCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [disableOpen, setDisableOpen] = useState(false)
  const [disableCode, setDisableCode] = useState('')
  const [copied2fa, setCopied2fa] = useState(false)

  // Sessions
  const { data: sessions, isLoading: sessionsLoading, mutate: mutateSessions } = useSWR(
    'device-sessions',
    () => usersApi.getDeviceSessions(),
  )

  // GDPR
  const [exportLoading, setExportLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const handlePasswordChange = async () => {
    if (pwForm.newPw !== pwForm.confirm) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    setPwLoading(true)
    try {
      await usersApi.changePassword(pwForm.current, pwForm.newPw)
      setPwForm({ current: '', newPw: '', confirm: '' })
      toast.success('Mot de passe modifié')
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur')
    } finally {
      setPwLoading(false)
    }
  }

  const handleSetup2FA = async () => {
    try {
      const data = await usersApi.setup2FA()
      setSetupData(data)
      setSetupOpen(true)
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur')
    }
  }

  const handleVerify2FA = async () => {
    if (!totpCode || totpCode.length !== 6) return
    setVerifying(true)
    try {
      await usersApi.verify2FA(totpCode)
      setSetupOpen(false)
      setTotpCode('')
      setSetupData(null)
      await mutateTwoFa()
      await refreshUser()
      toast.success('Authentification à deux facteurs activée')
    } catch (err: any) {
      toast.error(err?.message ?? 'Code invalide')
    } finally {
      setVerifying(false)
    }
  }

  const handleDisable2FA = async () => {
    setVerifying(true)
    try {
      await usersApi.disable2FA(disableCode)
      setDisableOpen(false)
      setDisableCode('')
      await mutateTwoFa()
      await refreshUser()
      toast.success('2FA désactivée')
    } catch (err: any) {
      toast.error(err?.message ?? 'Code invalide')
    } finally {
      setVerifying(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await usersApi.revokeSession(sessionId)
      await mutateSessions()
      toast.success('Session révoquée')
    } catch {
      toast.error('Erreur')
    }
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      await usersApi.requestGdprExport()
      toast.success('Export demandé — vous recevrez un email')
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur')
    } finally {
      setExportLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') return
    setDeletingAccount(true)
    try {
      await usersApi.requestGdprDeletion()
      toast.success('Demande envoyée — votre compte sera supprimé dans 30 jours')
      setDeleteOpen(false)
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur')
    } finally {
      setDeletingAccount(false)
    }
  }

  const deviceSessions = sessions?.data ?? []

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="Paramètres"
        description="Sécurité, confidentialité et gestion du compte"
      />

      <div className="flex-1 p-6 space-y-8 max-w-2xl">
        {/* Password */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Section title="Mot de passe" description="Changez régulièrement votre mot de passe">
            <Card>
              <div className="p-5 space-y-4">
                <Input
                  label="Mot de passe actuel"
                  type="password"
                  value={pwForm.current}
                  onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                />
                <Input
                  label="Nouveau mot de passe"
                  type="password"
                  value={pwForm.newPw}
                  onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                  hint="Minimum 12 caractères, majuscule, chiffre, symbole"
                />
                <Input
                  label="Confirmer le nouveau mot de passe"
                  type="password"
                  value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                />
                <Button
                  onClick={handlePasswordChange}
                  isLoading={pwLoading}
                  disabled={!pwForm.current || !pwForm.newPw || !pwForm.confirm}
                >
                  <Lock className="w-4 h-4" />
                  Changer le mot de passe
                </Button>
              </div>
            </Card>
          </Section>
        </motion.div>

        {/* 2FA */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Section
            title="Authentification à deux facteurs"
            description="Protégez votre compte avec une application TOTP"
          >
            <Card>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      twoFaData?.enabled ? 'bg-white' : 'bg-gray-800'
                    }`}>
                      <Shield className={`w-4.5 h-4.5 ${twoFaData?.enabled ? 'text-black' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        2FA via TOTP
                      </p>
                      <p className="text-xs text-gray-500">
                        {twoFaData?.enabled ? 'Activée' : 'Désactivée'}
                      </p>
                    </div>
                  </div>
                  {twoFaData?.enabled ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDisableOpen(true)}
                    >
                      Désactiver
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handleSetup2FA}>
                      <Smartphone className="w-4 h-4" />
                      Activer
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </Section>
        </motion.div>

        {/* Sessions */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Section
            title="Sessions actives"
            description="Appareils connectés à votre compte"
          >
            <Card>
              {sessionsLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(2)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : !deviceSessions.length ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  Aucune session active
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {deviceSessions.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-4 px-5 py-4">
                      <Monitor className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{s.deviceName ?? 'Appareil inconnu'}</p>
                        <p className="text-xs text-gray-500">
                          {s.ipAddress} · {formatRelativeTime(s.lastUsedAt)}
                        </p>
                      </div>
                      {s.isCurrent ? (
                        <Badge variant="default">Actuel</Badge>
                      ) : (
                        <button
                          onClick={() => handleRevokeSession(s.id)}
                          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          Révoquer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Section>
        </motion.div>

        {/* GDPR */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Section
            title="Données personnelles"
            description="Exercez vos droits RGPD"
          >
            <Card>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Export de mes données</p>
                    <p className="text-xs text-gray-500">Recevez toutes vos données par email</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExport}
                    isLoading={exportLoading}
                  >
                    <Download className="w-4 h-4" />
                    Exporter
                  </Button>
                </div>
                <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">Supprimer mon compte</p>
                    <p className="text-xs text-gray-500">Action irréversible après 30 jours</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteOpen(true)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </Card>
          </Section>
        </motion.div>
      </div>

      {/* 2FA Setup modal */}
      <Modal
        isOpen={setupOpen}
        onClose={() => { setSetupOpen(false); setSetupData(null); setTotpCode('') }}
        title="Configurer l'authentification 2FA"
      >
        {setupData && (
          <div className="space-y-5">
            <p className="text-sm text-gray-400">
              Scannez ce QR code avec votre application authenticator (Authy, Google Authenticator…)
            </p>
            <div className="flex justify-center bg-white p-4 rounded-xl">
              <img src={setupData.qrCode} alt="QR Code 2FA" className="w-48 h-48" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Ou entrez manuellement :</p>
              <div className="flex items-center gap-2 font-mono text-sm bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
                <span className="flex-1 text-gray-300 break-all">{setupData.secret}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(setupData.secret)
                    setCopied2fa(true)
                    setTimeout(() => setCopied2fa(false), 2000)
                  }}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  {copied2fa ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Input
              label="Code de vérification (6 chiffres)"
              placeholder="123456"
              value={totpCode}
              onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
            />
            {setupData.backupCodes?.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-xs font-semibold text-white mb-2">
                  Codes de sauvegarde — copiez-les maintenant
                </p>
                <div className="grid grid-cols-2 gap-1 font-mono text-xs text-gray-400">
                  {setupData.backupCodes.map(c => <span key={c}>{c}</span>)}
                </div>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => { setSetupOpen(false); setSetupData(null) }}>
                Annuler
              </Button>
              <Button
                onClick={handleVerify2FA}
                isLoading={verifying}
                disabled={totpCode.length !== 6}
              >
                Activer la 2FA
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Disable 2FA */}
      <Modal
        isOpen={disableOpen}
        onClose={() => { setDisableOpen(false); setDisableCode('') }}
        title="Désactiver la 2FA"
        description="Entrez votre code TOTP actuel pour confirmer."
      >
        <div className="space-y-4">
          <Input
            label="Code TOTP"
            placeholder="123456"
            value={disableCode}
            onChange={e => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setDisableOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleDisable2FA}
              isLoading={verifying}
              disabled={disableCode.length !== 6}
            >
              Désactiver
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete account */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteConfirmText('') }}
        title="Supprimer mon compte"
        description="Cette action est irréversible après 30 jours. Toutes vos données seront effacées."
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-gray-900 border border-gray-800 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-400">
              Votre abonnement sera annulé, vos données supprimées et votre accès révoqué.
              Vous avez 30 jours pour annuler la demande.
            </p>
          </div>
          <Input
            label="Tapez SUPPRIMER pour confirmer"
            placeholder="SUPPRIMER"
            value={deleteConfirmText}
            onChange={e => setDeleteConfirmText(e.target.value)}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              isLoading={deletingAccount}
              disabled={deleteConfirmText !== 'SUPPRIMER'}
            >
              Supprimer mon compte
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
