import Link from 'next/link'
import { Logo } from '@/components/Logo'

const links = {
  Produit: [
    { label: 'Fonctionnalites', href: '#features' },
    { label: 'Tarifs',          href: '#pricing'  },
    { label: 'API',             href: '#api'       },
    { label: 'FAQ',             href: '#faq'       },
  ],
  Legal: [
    { label: 'Conditions d\'utilisation', href: '/legal/terms'   },
    { label: 'Politique de confidentialite', href: '/legal/privacy' },
    { label: 'Cookies',                  href: '/legal/cookies' },
  ],
  Support: [
    { label: 'Contact',           href: '/contact'       },
    { label: 'Documentation',     href: '/docs'          },
    { label: 'Statut du service', href: '/status'        },
  ],
}

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-black border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo size={26} className="text-white mb-4" />
            <p className="text-sm text-gray-500 leading-relaxed mb-2">
              Plateforme de recherche OSINT combinee.
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Version en attendant — le site officiel est en cours de developpement.
            </p>
          </div>

          {/* Links */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                {section}
              </h3>
              <ul className="space-y-3">
                {items.map(item => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-500 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            {year} ADW Searcher. Tous droits reserves.
          </p>
          <p className="text-xs text-gray-700">
            Version en attendant — lancement officiel prochainement
          </p>
        </div>
      </div>
    </footer>
  )
}
