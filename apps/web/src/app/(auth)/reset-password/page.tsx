'use client'

import { useState, FormEvent, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { authApi } from '@/lib/api'
import { isValidPassword, getPasswordStrength } from '@/lib/auth'

function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const strength = getPasswordStrength(password)

  if (!token) {
    return (
      <div className="text-center">
        <AlertCircle className="w-10 h-10 text-gray-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-white mb-2">Lien invalide</h2>
        <p className="text-sm text-gray-500 mb-6">
          Ce lien de réinitialisation est invalide ou a expiré.
        </p>
        <Link href="/forgot-password" className="text-sm text-gray-400 hover:text-white underline underline-offset-4">
          Demander un nouveau lien
        </Link>
      </div>
    )
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    const { valid, errors: pwErrs } = isValidPassword(password)
    if (!password) errs.password = 'Requis'
    else if (!valid) errs.password = pwErrs[0]
    if (password !== confirmPassword) errs.confirm = 'Les mots de passe ne correspondent pas'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lien expiré ou invalide'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-14 h-14 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Mot de passe modifié</h1>
        <p className="text-sm text-gray-400 mb-6">
          Votre mot de passe a été réinitialisé avec succès. Redirection en cours...
        </p>
        <Link href="/login" className="text-sm text-gray-400 hover:text-white underline underline-offset-4">
          Se connecter maintenant
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white">Nouveau mot de passe</h1>
        <p className="mt-2 text-sm text-gray-500">Choisissez un mot de passe fort</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <Input
            label="Nouveau mot de passe"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            error={errors.password}
            placeholder="••••••••••••"
            autoComplete="new-password"
            autoFocus
            required
          />
          {password && (
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    strength.score >= i ? strength.color : 'bg-gray-800'
                  }`}
                />
              ))}
              <span className="ml-2 text-xs text-gray-500 self-center whitespace-nowrap">
                {strength.label}
              </span>
            </div>
          )}
        </div>

        <Input
          label="Confirmer le mot de passe"
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          error={errors.confirm}
          placeholder="••••••••••••"
          autoComplete="new-password"
          required
        />

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Réinitialiser le mot de passe
        </Button>
      </form>
    </motion.div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
