'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Camera, Globe, MapPin, FileText, Save } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { usersApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { getPlanLabel, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()

  const [form, setForm] = useState({
    username: '',
    bio: '',
    website: '',
    location: '',
    timezone: '',
  })
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username ?? '',
        bio: (user as any).bio ?? '',
        website: (user as any).website ?? '',
        location: (user as any).location ?? '',
        timezone: (user as any).timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
    }
  }, [user])

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm(f => ({ ...f, [key]: value }))
    setIsDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await usersApi.updateProfile(form)
      await refreshUser()
      setIsDirty(false)
      toast.success('Profil mis à jour')
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="Mon profil"
        description="Modifiez vos informations personnelles"
      />

      <div className="flex-1 p-6 max-w-2xl space-y-6">
        {/* Avatar + account info */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center text-xl font-bold text-white border border-gray-700">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors border border-gray-600">
                    <Camera className="w-3 h-3 text-white" />
                  </button>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">{user.username}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{getPlanLabel(user.subscription?.plan ?? 'FREE')}</Badge>
                    <Badge variant={user.accountStatus === 'ACTIVE' ? 'default' : 'muted'}>
                      {user.accountStatus === 'ACTIVE' ? 'Actif' : user.accountStatus}
                    </Badge>
                    {user.twoFactorEnabled && (
                      <Badge variant="outline">2FA activée</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-gray-800 grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <span className="text-gray-600">Membre depuis</span>
                  <p className="text-white mt-0.5">{formatDate(user.createdAt)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Dernière connexion</span>
                  <p className="text-white mt-0.5">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : '—'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Edit form */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <div className="p-6 space-y-5">
              <h3 className="text-sm font-semibold text-white">Informations</h3>

              <Input
                label="Nom d'utilisateur"
                value={form.username}
                onChange={e => handleChange('username', e.target.value)}
                hint="Visible par l'équipe support"
              />

              <Textarea
                label="Biographie"
                value={form.bio}
                onChange={e => handleChange('bio', e.target.value)}
                placeholder="Décrivez-vous en quelques mots…"
                rows={3}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Site web"
                  value={form.website}
                  onChange={e => handleChange('website', e.target.value)}
                  placeholder="https://example.com"
                  leftIcon={<Globe className="w-4 h-4" />}
                />
                <Input
                  label="Localisation"
                  value={form.location}
                  onChange={e => handleChange('location', e.target.value)}
                  placeholder="Paris, France"
                  leftIcon={<MapPin className="w-4 h-4" />}
                />
              </div>

              <Input
                label="Fuseau horaire"
                value={form.timezone}
                onChange={e => handleChange('timezone', e.target.value)}
                placeholder="Europe/Paris"
              />

              <Button
                onClick={handleSave}
                isLoading={saving}
                disabled={!isDirty}
              >
                <Save className="w-4 h-4" />
                Enregistrer les modifications
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Email (read-only) */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <div className="p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Adresse email</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{user.email}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {user.emailVerified ? 'Email vérifié' : 'Email non vérifié'}
                  </p>
                </div>
                <Badge variant={user.emailVerified ? 'default' : 'muted'}>
                  {user.emailVerified ? 'Vérifié' : 'Non vérifié'}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mt-4">
                Pour changer votre email, contactez le support.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
