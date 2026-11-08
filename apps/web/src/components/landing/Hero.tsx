'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Clock, Shield, Database, Search } from 'lucide-react'

const stats = [
  { label: 'Recherches / jour',    value: '100',   sub: 'par utilisateur'    },
  { label: 'Champs de recherche',  value: '40+',   sub: 'combinables'        },
  { label: 'Formats d\'export',    value: '3',     sub: 'JSON · TXT · PDF'   },
  { label: 'Disponibilite',        value: '99.9%', sub: 'uptime'             },
]

const searchPills = [
  'Identite',
  'Contact',
  'Localisation',
  'Professionnel',
  'Bancaire',
  'Gaming',
]

const terminal = [
  { type: 'comment', text: '# ADW API — recherche combinee' },
  { type: 'prompt',  text: 'POST /api/search' },
  { type: 'json',    text: '{' },
  { type: 'field',   text: '  "nom_famille": "Dupont",' },
  { type: 'field',   text: '  "ville": "Paris",' },
  { type: 'field',   text: '  "per_page": 25' },
  { type: 'json',    text: '}' },
  { type: 'blank',   text: '' },
  { type: 'result',  text: '// 12 resultats — 48ms' },
]

export function Hero() {
  return (
    <section className="relative min-h-screen bg-black flex flex-col justify-center overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Version badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-6">
              <Clock size={12} className="text-gray-400" />
              <span className="text-xs text-gray-400 font-medium tracking-wide uppercase">
                Version en attendant
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-4">
              ADW
              <br />
              <span className="text-gray-400 font-light">Searcher</span>
            </h1>

            <p className="text-lg text-gray-400 mb-4 leading-relaxed">
              Plateforme de recherche OSINT combinee.
              Croisez nom, adresse, email, telephone et 40+ autres champs en une seule requete.
            </p>

            {/* Version en attendant notice */}
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 mb-8">
              <p className="text-sm text-gray-400 leading-relaxed">
                <span className="text-white font-medium">Site en cours de developpement.</span>{' '}
                Cette version vous permet d'acceder a l'ADW API pendant la mise en place
                du site officiel. Tous les utilisateurs disposent de{' '}
                <span className="text-white font-medium">100 recherches par jour</span>{' '}
                sans restriction. Les tarifs et fonctionnalites definitifs seront
                annonces lors du lancement officiel.
              </p>
            </div>

            {/* Search category pills */}
            <div className="flex flex-wrap gap-2 mb-8">
              {searchPills.map(pill => (
                <span
                  key={pill}
                  className="px-3 py-1 text-xs text-gray-400 border border-white/10 rounded-full"
                >
                  {pill}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black text-sm font-medium rounded-md hover:bg-gray-100 transition-colors"
              >
                Creer un compte gratuit
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/10 text-gray-300 text-sm font-medium rounded-md hover:bg-white/5 transition-colors"
              >
                Se connecter
              </Link>
            </div>
          </motion.div>

          {/* Right — terminal + stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="space-y-6"
          >
            {/* Terminal */}
            <div className="rounded-xl border border-white/10 bg-black overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                <span className="w-3 h-3 rounded-full bg-gray-700" />
                <span className="w-3 h-3 rounded-full bg-gray-700" />
                <span className="w-3 h-3 rounded-full bg-gray-700" />
                <span className="ml-2 text-xs text-gray-600 font-mono">ADW Searcher — API</span>
              </div>
              <div className="p-5 font-mono text-sm space-y-1">
                {terminal.map((line, i) => (
                  <div key={i}>
                    {line.type === 'comment' && (
                      <span className="text-gray-600">{line.text}</span>
                    )}
                    {line.type === 'prompt' && (
                      <span className="text-white font-semibold">{line.text}</span>
                    )}
                    {(line.type === 'json' || line.type === 'field') && (
                      <span className="text-gray-400">{line.text}</span>
                    )}
                    {line.type === 'result' && (
                      <span className="text-gray-500">{line.text}</span>
                    )}
                    {line.type === 'blank' && <span> </span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {stats.map(stat => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
                  <div className="text-xs text-gray-600">{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Shield size={12} />
                <span>Donnees securisees</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Database size={12} />
                <span>ADW API</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Search size={12} />
                <span>Multi-criteres</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
