'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X, ChevronDown, ChevronUp } from 'lucide-react'

interface ConsentState {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

const DEFAULT_CONSENT: ConsentState = {
  necessary: true, // Always required
  analytics: false,
  marketing: false,
  preferences: false,
}

const COOKIE_KEY = 'adw_cookie_consent'
const CONSENT_VERSION = '1'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_KEY)
      if (!stored) {
        setVisible(true)
        return
      }
      const parsed = JSON.parse(stored)
      if (parsed.version !== CONSENT_VERSION) {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }
  }, [])

  const saveConsent = (state: ConsentState) => {
    const record = {
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      consent: state,
    }
    localStorage.setItem(COOKIE_KEY, JSON.stringify(record))

    // Send to backend for GDPR record
    fetch('/api/users/cookie-consent', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    }).catch(() => {}) // best-effort
  }

  const handleAcceptAll = () => {
    const all: ConsentState = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    }
    saveConsent(all)
    setVisible(false)
  }

  const handleRejectAll = () => {
    saveConsent(DEFAULT_CONSENT)
    setVisible(false)
  }

  const handleSavePreferences = () => {
    saveConsent(consent)
    setVisible(false)
  }

  const toggle = (key: keyof ConsentState) => {
    if (key === 'necessary') return // cannot be disabled
    setConsent(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (!visible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-50"
      >
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-modal overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between p-5 pb-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Cookie className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Gestion des cookies
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Conformément au RGPD
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-5">
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Nous utilisons des cookies pour améliorer votre expérience. Vous
              pouvez accepter tous les cookies ou personnaliser vos préférences.
            </p>

            {/* Expandable preferences */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="space-y-3 py-3 border-t border-b border-gray-800">
                    {[
                      {
                        key: 'necessary' as const,
                        label: 'Nécessaires',
                        desc: 'Requis pour le fonctionnement du site',
                        locked: true,
                      },
                      {
                        key: 'analytics' as const,
                        label: 'Analytiques',
                        desc: 'Statistiques d\'utilisation anonymisées',
                        locked: false,
                      },
                      {
                        key: 'preferences' as const,
                        label: 'Préférences',
                        desc: 'Mémorisation de vos paramètres',
                        locked: false,
                      },
                      {
                        key: 'marketing' as const,
                        label: 'Marketing',
                        desc: 'Publicités personnalisées (non utilisé actuellement)',
                        locked: false,
                      },
                    ].map(item => (
                      <div key={item.key} className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-gray-300">
                            {item.label}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                        <button
                          onClick={() => toggle(item.key)}
                          disabled={item.locked}
                          className={`relative flex-shrink-0 w-9 h-5 rounded-full transition-colors duration-200 mt-0.5 ${
                            consent[item.key]
                              ? 'bg-white'
                              : 'bg-gray-700'
                          } ${item.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          aria-label={`Toggle ${item.label}`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200 ${
                              consent[item.key]
                                ? 'bg-black translate-x-4'
                                : 'bg-gray-500 translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toggle expand */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 mb-4 transition-colors"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Masquer les détails
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  Personnaliser
                </>
              )}
            </button>

            {/* Buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleAcceptAll}
                className="w-full py-2.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Tout accepter
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleRejectAll}
                  className="py-2 text-xs text-gray-400 bg-gray-800 border border-gray-700 rounded-lg hover:text-white hover:bg-gray-700 transition-all"
                >
                  Tout refuser
                </button>
                {expanded && (
                  <button
                    onClick={handleSavePreferences}
                    className="py-2 text-xs text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:text-white hover:bg-gray-700 transition-all"
                  >
                    Enregistrer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
