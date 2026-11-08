'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { getDefaultRedirect } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [twoFactorRequired, setTwoFactorRequired] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!email) errs.email = 'Email requis'
    if (!password) errs.password = 'Mot de passe requis'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      const result = await login(email, password, twoFactorCode || undefined, rememberMe)
      if (result.requiresTwoFactor) {
        setTwoFactorRequired(true)
        return
      }
      const { user } = useAuth.getState()
      if (user) {
        toast.success('Connexion réussie')
        router.push(getDefaultRedirect(user))
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de connexion'
      toast.error(msg)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {twoFactorRequired ? 'Vérification en 2 étapes' : 'Connexion'}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {twoFactorRequired
            ? 'Entrez le code de votre application d\'authentification'
            : 'Accédez à votre tableau de bord'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {!twoFactorRequired ? (
          <>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              error={errors.email}
              placeholder="votre@email.com"
              autoComplete="email"
              required
              autoFocus
            />

            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              error={errors.password}
              placeholder="••••••••••••"
              autoComplete="current-password"
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-white focus:ring-0"
                />
                <span className="text-sm text-gray-400">Se souvenir de moi</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          </>
        ) : (
          <div>
            <Input
              label="Code d'authentification"
              type="text"
              value={twoFactorCode}
              onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
              className="text-center text-2xl tracking-[0.5em] font-mono"
            />
            <p className="mt-2 text-xs text-gray-500 text-center">
              Code à 6 chiffres de votre application (Google Authenticator, etc.)
            </p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isLoading}
        >
          {twoFactorRequired ? 'Vérifier' : 'Se connecter'}
        </Button>

        {twoFactorRequired && (
          <button
            type="button"
            onClick={() => { setTwoFactorRequired(false); setTwoFactorCode('') }}
            className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Retour
          </button>
        )}
      </form>

      {!twoFactorRequired && (
        <p className="mt-6 text-center text-sm text-gray-500">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-white hover:text-gray-300 font-medium underline underline-offset-4">
            Créer un compte
          </Link>
        </p>
      )}
    </motion.div>
  )
}
