import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de Cookies | ADW Intelligence',
  description: 'Politique d\'utilisation des cookies sur la plateforme ADW Intelligence.',
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-10">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Politique de Cookies</h1>
        <p className="text-sm text-gray-500 mb-12">Dernière mise à jour : 1er janvier 2025</p>

        <div className="space-y-8 text-gray-300 leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Qu'est-ce qu'un cookie ?</h2>
            <p>
              Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette, smartphone)
              lors de votre visite sur notre plateforme. Il permet de vous reconnaître lors de vos prochaines
              visites et d'améliorer votre expérience utilisateur.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Cookies que nous utilisons</h2>

            <div className="space-y-6">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium bg-white text-black px-2 py-0.5 rounded">Essentiels</span>
                  <span className="text-xs text-gray-500">Toujours actifs</span>
                </div>
                <p className="mb-3">Ces cookies sont indispensables au fonctionnement du Service :</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-800">
                      <th className="text-left pb-2">Nom</th>
                      <th className="text-left pb-2">Durée</th>
                      <th className="text-left pb-2">Finalité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    <tr>
                      <td className="py-2 font-mono text-gray-400">refresh_token</td>
                      <td className="py-2">7 jours</td>
                      <td className="py-2">Maintien de la session (HttpOnly, Secure)</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-gray-400">csrf_token</td>
                      <td className="py-2">Session</td>
                      <td className="py-2">Protection contre les attaques CSRF</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-gray-400">cookie_consent</td>
                      <td className="py-2">1 an</td>
                      <td className="py-2">Mémorisation de vos préférences de cookies</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium bg-gray-700 text-gray-200 px-2 py-0.5 rounded">Analytiques</span>
                  <span className="text-xs text-gray-500">Avec votre consentement</span>
                </div>
                <p className="mb-3">Ces cookies nous permettent d'améliorer le Service :</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-800">
                      <th className="text-left pb-2">Nom</th>
                      <th className="text-left pb-2">Durée</th>
                      <th className="text-left pb-2">Finalité</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 font-mono text-gray-400">_adw_analytics</td>
                      <td className="py-2">12 mois</td>
                      <td className="py-2">Statistiques d'utilisation anonymisées</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Gérer vos préférences</h2>
            <p>
              Vous pouvez à tout moment modifier vos préférences via la bannière de cookies ou les paramètres
              de votre navigateur. La désactivation des cookies essentiels peut altérer le fonctionnement
              du Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Contact</h2>
            <p>
              Pour toute question :{' '}
              <a href="mailto:privacy@adw-intelligence.com" className="text-gray-400 hover:text-white underline">
                privacy@adw-intelligence.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
