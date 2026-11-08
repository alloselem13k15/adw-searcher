'use client'

import { motion } from 'framer-motion'
import { Clock, Check } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    name:    'Decouverte',
    desc:    'Parfait pour explorer la plateforme',
    features: [
      '100 recherches par jour',
      'Tous les champs de recherche',
      'Export JSON, TXT, PDF',
      'Historique de recherche',
      'Support par email',
    ],
  },
  {
    name:    'Standard',
    desc:    'Pour une utilisation reguliere',
    popular: true,
    features: [
      '100 recherches par jour',
      'Tous les champs de recherche',
      'Export JSON, TXT, PDF',
      'Historique de recherche',
      'Support prioritaire',
      'Acces API',
    ],
  },
  {
    name:    'Avance',
    desc:    'Pour les utilisateurs intensifs',
    features: [
      '100 recherches par jour',
      'Tous les champs de recherche',
      'Export JSON, TXT, PDF',
      'Historique de recherche',
      'Support 24/7',
      'Acces API prioritaire',
      'Analytics avances',
    ],
  },
  {
    name:    'Business',
    desc:    'Pour les entreprises et equipes',
    features: [
      '100 recherches par jour',
      'Tous les champs de recherche',
      'Export JSON, TXT, PDF',
      'Historique de recherche',
      'Support dedie 24/7',
      'SLA garanti',
      'Facturation entreprise',
      'Acces API illimite',
    ],
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-black border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-6">
            <Clock size={12} className="text-gray-400" />
            <span className="text-xs text-gray-400 font-medium tracking-wide uppercase">
              Version en attendant
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Tarifs
          </h2>

          <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Le site officiel est en cours de developpement.
            Les tarifs definitifs seront annonces lors du lancement.
            En attendant, tous les utilisateurs beneficient de{' '}
            <span className="text-white font-medium">100 recherches par jour</span>{' '}
            gratuitement.
          </p>
        </motion.div>

        {/* Version en attendant notice */}
        <div className="mb-12 rounded-xl border border-white/10 bg-white/[0.02] p-6 max-w-3xl mx-auto text-center">
          <p className="text-sm text-gray-400 leading-relaxed">
            Cette version est temporaire. Elle est mise en place pour vous permettre d'acceder
            a l'ADW API pendant que le vrai site est en cours de construction.
            Les plans ci-dessous montrent les fonctionnalites prevues — les prix seront
            communiques au moment du lancement officiel.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`relative rounded-xl border p-6 flex flex-col ${
                plan.popular
                  ? 'border-white/20 bg-white/[0.04]'
                  : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 text-xs font-medium bg-white text-black rounded-full">
                    Populaire
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-base font-semibold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500">{plan.desc}</p>
              </div>

              {/* Price placeholder */}
              <div className="mb-6 pb-6 border-b border-white/5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-white/5">
                  <Clock size={12} className="text-gray-500" />
                  <span className="text-xs text-gray-500">Prix a venir</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  100 recherches / jour — gratuit pendant la version en attendant
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                    <Check size={14} className="text-gray-600 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={`block text-center text-sm font-medium py-2.5 rounded-md transition-colors ${
                  plan.popular
                    ? 'bg-white text-black hover:bg-gray-100'
                    : 'border border-white/10 text-gray-400 hover:bg-white/5'
                }`}
              >
                Commencer gratuitement
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-600 mt-10">
          Pendant la version en attendant, tous les plans donnent acces aux memes fonctionnalites.
          Les differences de plans entreront en vigueur au lancement officiel.
        </p>
      </div>
    </section>
  )
}
