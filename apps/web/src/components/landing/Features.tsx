'use client'

import { motion } from 'framer-motion'
import {
  Search,
  Shield,
  Zap,
  Key,
  BarChart3,
  Globe,
  Lock,
  RefreshCw,
  Database,
} from 'lucide-react'

const features = [
  {
    icon: Search,
    title: 'Recherche multi-sources',
    description:
      'Personnes, emails, téléphones, noms d\'utilisateur, IPs, domaines et entreprises. Toutes vos recherches OSINT en un seul endroit.',
  },
  {
    icon: Zap,
    title: 'Résultats instantanés',
    description:
      'Réponses en moins de 500ms grâce à notre cache Redis et infrastructure optimisée. Pas d\'attente, juste des données.',
  },
  {
    icon: Shield,
    title: 'Sécurité maximale',
    description:
      'Chiffrement Argon2id, 2FA TOTP, sessions sécurisées, audit logs complets. Votre compte et vos données sont protégés.',
  },
  {
    icon: Key,
    title: 'API REST complète',
    description:
      'Clés API avec limites configurables, documentation détaillée, intégration en quelques lignes. Idéal pour automatiser vos workflows.',
  },
  {
    icon: BarChart3,
    title: 'Analytics avancés',
    description:
      'Visualisez vos recherches, consommation de crédits et performances. Tableaux de bord personnalisés pour chaque abonnement.',
  },
  {
    icon: Globe,
    title: 'Couverture mondiale',
    description:
      'Sources de données dans 190+ pays, mise à jour en temps réel. L\'une des plus grandes bases OSINT disponibles.',
  },
  {
    icon: Lock,
    title: 'Conformité RGPD',
    description:
      'Bannière de consentement, registre de traitement, export et suppression de données. Conformité totale avec le règlement européen.',
  },
  {
    icon: RefreshCw,
    title: 'Crédits flexibles',
    description:
      'Système de crédits transparent — payez uniquement pour ce que vous utilisez. Recharge automatique avec les plans premium.',
  },
  {
    icon: Database,
    title: 'Historique complet',
    description:
      'Retrouvez toutes vos recherches passées, exportez-les en CSV, filtrez par type et date. Votre travail, toujours accessible.',
  },
]

export function Features() {
  return (
    <section id="features" className="relative py-32 overflow-hidden">
      {/* Subtle top gradient */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4"
          >
            Fonctionnalités
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold text-white tracking-tight"
          >
            Tout ce dont vous avez besoin
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto"
          >
            Une plateforme complète conçue pour les professionnels de
            l'investigation, les équipes de sécurité et les chercheurs.
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group relative bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all duration-300 card-shine overflow-hidden"
              >
                {/* Icon */}
                <div className="mb-4">
                  <div className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center group-hover:bg-gray-700 transition-colors duration-200">
                    <Icon className="w-5 h-5 text-gray-300" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-base font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.015] rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
