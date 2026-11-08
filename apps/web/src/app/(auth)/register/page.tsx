'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { Check } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { isValidEmail, isValidPassword } from '@/lib/utils'
import { getPasswordStrength } from '@/lib/auth'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading } = useAuth()

  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  const strength = getPasswordStrength(form.password)

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const validate = () => {
    const errs: Record<string, string> = {}

    if (!form.email) errs.email = 'Email requis'
    else if (!isValidEmail(form.email)) errs.email = 'Email invalide'

    if (!form.username) errs.username = 'Nom d\'utilisateur requis'
    else if (form.username.length < 3) errs.username = 'Minimum 3 caractères'
    else if (!/^[a-zA-Z0-9_-]+$/.test(form.username)) errs.username = 'Lettres, chiffres, _ et - seulement'

    const { valid, errors: pwErrs } = isValidPassword(form.password)
    if (!form.password) errs.password = 'Mot de passe requis'
    else if (!valid) errs.password = pwErrs[0]

    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Les mots de passe ne correspondent pas'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await register({
        email: form.email,
        username: form.username,
        password: form.password,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
      })
      setSuccess(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur d\'inscription'
      toast.error(msg)
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
        <h1 className="text-2xl font-bold text-white mb-3">Vérifiez vos emails</h1>
        <p className="text-sm text-gray-400 mb-6">
          Un email de vérification a été envoyé à{' '}
          <span className="text-white font-medium">{form.email}</span>.
          Cliquez sur le lien pour activer votre compte.
        </p>
        <Link
          href="/login"
          className="text-sm text-gray-400 hover:text-white underline underline-offset-4 transition-colors"
        >
          Retour à la connexion
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
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Créer un compte
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Gratuit. Aucune carte bancaire requise.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Prénom"
            type="text"
            value={form.firstName}
            onChange={set('firstName')}
            placeholder="Jean"
            autoComplete="given-name"
          />
          <Input
            label="Nom"
            type="text"
            value={form.lastName}
            onChange={set('lastName')}
            placeholder="Dupont"
            autoComplete="family-name"
          />
        </div>

        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          placeholder="votre@email.com"
          autoComplete="email"
          required
        />

        <Input
          label="Nom d'utilisateur"
          type="text"
          value={form.username}
          onChange={set('username')}
          error={errors.username}
          placeholder="jean_dupont"
          autoComplete="username"
          required
        />

        <div>
          <Input
            label="Mot de passe"
            type="password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            placeholder="••••••••••••"
            autoComplete="new-password"
            required
          />
          {/* Password strength bar */}
          {form.password && (
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
          value={form.confirmPassword}
          onChange={set('confirmPassword')}
          error={errors.confirmPassword}
          placeholder="••••••••••••"
          autoComplete="new-password"
          required
        />

        <Button
          type="submit"
          className="w-full mt-2"
          size="lg"
          loading={isLoading}
        >
          Créer mon compte
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-white hover:text-gray-300 font-medium underline underline-offset-4">
          Se connecter
        </Link>
      </p>
    </motion.div>
  )
}
