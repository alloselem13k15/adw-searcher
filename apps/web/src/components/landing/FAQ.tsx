'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

const faqs = [
  {
    q: 'Comment fonctionnent les crédits ?',
    a: 'Chaque recherche consomme un certain nombre de crédits selon le type. Par exemple, une recherche par email coûte 3 crédits, par personne 5 crédits. Les crédits se renouvellent chaque mois avec votre abonnement.',
  },
  {
    q: 'Puis-je utiliser l\'API depuis mon application ?',
    a: 'Oui. Créez une clé API depuis votre tableau de bord et intégrez-la dans votre application. Notre API REST accepte JSON et retourne des résultats structurés en quelques millisecondes.',
  },
  {
    q: 'Les données sont-elles légales ?',
    a: 'ADW Intelligence agrège uniquement des données publiquement disponibles. L\'utilisation de la plateforme est soumise à nos CGU et doit respecter les lois en vigueur dans votre pays, notamment le RGPD en Europe.',
  },
  {
    q: 'Comment fonctionne la conformité RGPD ?',
    a: 'Notre plateforme intègre un registre de consentement, la possibilité d\'exporter vos données personnelles et de demander leur suppression. Chaque traitement est documenté conformément au RGPD.',
  },
  {
    q: 'Puis-je annuler mon abonnement à tout moment ?',
    a: 'Oui, sans engagement ni pénalité. Vous conservez l\'accès jusqu\'à la fin de la période payée. Annulation depuis votre tableau de bord en un clic.',
  },
  {
    q: 'Quelle est la précision des données ?',
    a: 'Notre infrastructure indexe en temps réel et croise des centaines de sources. La précision moyenne est de 99,9% pour les emails et téléphones, avec une vérification automatique des sources.',
  },
  {
    q: 'Y a-t-il une période d\'essai ?',
    a: 'Le plan Gratuit vous offre 50 crédits sans limite de temps — aucune carte bancaire requise. Vous pouvez tester toutes les fonctionnalités avant de choisir un plan payant.',
  },
  {
    q: 'Quel support est disponible ?',
    a: 'Le plan Gratuit bénéficie du support communautaire. Les plans payants incluent le support email avec garantie de réponse en 24h. Le plan Business dispose d\'un support dédié 24/7.',
  },
]

function FAQItem({ question, answer, isOpen, onToggle }: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-gray-800 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
      >
        <span className={`text-sm font-medium transition-colors ${isOpen ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
          {question}
        </span>
        <span className="flex-shrink-0 mt-0.5 text-gray-500 group-hover:text-gray-300 transition-colors">
          {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-gray-400 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="relative py-32">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4"
          >
            FAQ
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-white tracking-tight"
          >
            Questions fréquentes
          </motion.h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gray-900 border border-gray-800 rounded-2xl px-6"
        >
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              question={faq.q}
              answer={faq.a}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
