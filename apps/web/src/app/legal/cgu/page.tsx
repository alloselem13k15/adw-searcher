import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation | ADW Intelligence',
  description: 'Conditions Générales d\'Utilisation de la plateforme ADW Intelligence.',
}

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-10">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-sm text-gray-500 mb-12">Dernière mise à jour : 1er janvier 2025</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Objet</h2>
            <p>
              Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'accès et l'utilisation
              de la plateforme ADW Intelligence (ci-après « le Service »), éditée par ADW Intelligence SAS.
              Tout accès ou utilisation du Service implique l'acceptation pleine et entière des présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Description du Service</h2>
            <p>
              ADW Intelligence est une plateforme d'intelligence en sources ouvertes (OSINT) permettant
              aux utilisateurs professionnels d'effectuer des recherches sur des personnes, adresses e-mail,
              numéros de téléphone, noms d'utilisateur, adresses IP, noms de domaine et entreprises,
              dans le cadre strict de la législation applicable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Accès au Service</h2>
            <p>
              L'accès au Service est réservé aux personnes majeures ayant créé un compte et accepté les
              présentes CGU. L'utilisateur s'engage à fournir des informations exactes lors de son inscription
              et à maintenir la confidentialité de ses identifiants.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Utilisation autorisée</h2>
            <p>L'utilisateur s'engage à utiliser le Service uniquement à des fins licites, notamment :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Due diligence dans le cadre de relations commerciales</li>
              <li>Vérification d'identité dans un cadre légal</li>
              <li>Recherches journalistiques d'intérêt public</li>
              <li>Sécurité informatique et investigations professionnelles</li>
              <li>Recherche académique dans le respect du RGPD</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Utilisations interdites</h2>
            <p>Il est strictement interdit d'utiliser le Service pour :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Harcèlement, surveillance ou stalking de toute personne</li>
              <li>Collecte de données à des fins non autorisées</li>
              <li>Revente ou redistribution des données obtenues</li>
              <li>Toute activité frauduleuse ou illégale</li>
              <li>Atteinte à la vie privée des personnes concernées</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Système de crédits</h2>
            <p>
              L'utilisation du Service est conditionnée à la possession de crédits. Chaque type de recherche
              consomme un nombre de crédits défini. Les crédits sont attribués selon le plan d'abonnement
              souscrit et ne sont ni remboursables ni transférables, sauf disposition contraire explicite.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Responsabilité</h2>
            <p>
              ADW Intelligence s'efforce d'assurer l'exactitude des données fournies mais ne garantit pas
              leur exhaustivité ou leur mise à jour en temps réel. L'utilisateur est seul responsable
              de l'usage qu'il fait des informations obtenues via le Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Suspension et résiliation</h2>
            <p>
              ADW Intelligence se réserve le droit de suspendre ou résilier tout compte en cas de violation
              des présentes CGU, sans préavis ni remboursement. L'utilisateur peut résilier son compte
              à tout moment depuis les paramètres de son profil.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Droit applicable</h2>
            <p>
              Les présentes CGU sont régies par le droit français. Tout litige sera soumis à la compétence
              exclusive des tribunaux de Paris, sauf disposition légale contraire.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Contact</h2>
            <p>
              Pour toute question relative aux présentes CGU, contactez-nous à :{' '}
              <a href="mailto:legal@adw-intelligence.com" className="text-gray-400 hover:text-white transition-colors underline">
                legal@adw-intelligence.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
