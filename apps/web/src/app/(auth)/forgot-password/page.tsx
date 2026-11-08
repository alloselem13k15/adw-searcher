'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { authApi } from '@/lib/api'
import { isValidEmail } from '@/lib/utils'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isValidEmail(email)) {
      setError('Adresse email invalide')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authApi.forgotPassword(email)
      setSubmitted(true)
    } catch {
      // Always show success to prevent email enumeration
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-14 h-14 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-7 h-7 text-gray-300" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Email envoyé</h1>
        <p className="text-sm text-gray-400 mb-2">
          Si un compte existe avec{' '}
          <span className="text-white font-medium">{email}</span>,
          vous recevrez un email avec les instructions de réinitialisation.
        </p>
        <p className="text-xs text-gray-600 mb-6">
          Vérifiez vos spams si vous ne le trouvez pas.
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
          Mot de passe oublié
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Entrez votre email pour recevoir un lien de réinitialisation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          error={error}
          placeholder="votre@email.com"
          autoComplete="email"
          autoFocus
          required
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={loading}
        >
          Envoyer le lien
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/login" className="text-gray-400 hover:text-white underline underline-offset-4 transition-colors">
          Retour à la connexion
        </Link>
      </p>
    </motion.div>
  )
}
