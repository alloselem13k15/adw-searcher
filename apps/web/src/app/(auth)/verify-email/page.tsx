'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import { authApi } from '@/lib/api'

function VerifyEmailContent() {
  const params = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token de vérification manquant')
      return
    }

    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Lien invalide ou expiré')
      })
  }, [token])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      {status === 'loading' && (
        <>
          <Loader2 className="w-12 h-12 text-gray-500 animate-spin mx-auto mb-6" />
          <h1 className="text-xl font-bold text-white mb-2">Vérification en cours…</h1>
          <p className="text-sm text-gray-500">Un instant s'il vous plaît</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-14 h-14 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Email vérifié !</h1>
          <p className="text-sm text-gray-400 mb-6">
            Votre adresse email a été vérifiée avec succès. Vous pouvez maintenant accéder à votre compte.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-black rounded-lg font-semibold text-sm hover:bg-gray-200 transition-colors"
          >
            Se connecter
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-14 h-14 bg-gray-900 border border-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-7 h-7 text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Échec de vérification</h1>
          <p className="text-sm text-gray-400 mb-6">{message}</p>
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-white underline underline-offset-4 transition-colors"
          >
            Retour à la connexion
          </Link>
        </>
      )}
    </motion.div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
