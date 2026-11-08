'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '@/components/Logo'
import { useAuthStore } from '@/store/authStore'

const navLinks = [
  { label: 'Fonctionnalites', href: '#features' },
  { label: 'Tarifs',           href: '#pricing'  },
  { label: 'API',              href: '#api'       },
  { label: 'FAQ',              href: '#faq'       },
]

export function Navbar() {
  const [open,     setOpen]     = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const user = useAuthStore(s => s.user)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/90 backdrop-blur-md border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-white hover:text-gray-200 transition-colors">
          <Logo size={28} className="text-white" />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium bg-white text-black rounded-md hover:bg-gray-100 transition-colors"
            >
              Tableau de bord
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium bg-white text-black rounded-md hover:bg-gray-100 transition-colors"
              >
                Commencer
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(o => !o)}
          className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="md:hidden bg-black border-t border-white/5"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t border-white/5 space-y-2">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 text-sm font-medium bg-white text-black rounded-md text-center"
                    onClick={() => setOpen(false)}
                  >
                    Tableau de bord
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      Connexion
                    </Link>
                    <Link
                      href="/register"
                      className="block px-3 py-2 text-sm font-medium bg-white text-black rounded-md text-center"
                      onClick={() => setOpen(false)}
                    >
                      Commencer
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
