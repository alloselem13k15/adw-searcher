import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité | ADW Intelligence',
  description: 'Politique de confidentialité et de protection des données personnelles d\'ADW Intelligence.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-10">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Politique de Confidentialité</h1>
        <p className="text-sm text-gray-500 mb-12">Dernière mise à jour : 1er janvier 2025</p>

        <div className="space-y-8 text-gray-300 leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Responsable du traitement</h2>
            <p>
              ADW Intelligence SAS, dont le siège social est situé en France, est responsable du traitement
              de vos données personnelles dans le cadre de l'utilisation de la plateforme ADW Intelligence.
              Conformément au Règlement Général sur la Protection des Données (RGPD), nous nous engageons
              à traiter vos données de manière transparente, licite et sécurisée.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Données collectées</h2>
            <p>Nous collectons les données suivantes :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-white">Données d'identification :</strong> nom d'utilisateur, adresse e-mail</li>
              <li><strong className="text-white">Données de connexion :</strong> adresse IP, navigateur, date et heure de connexion</li>
              <li><strong className="text-white">Données de facturation :</strong> informations de paiement traitées par Stripe (nous ne stockons pas vos numéros de carte)</li>
              <li><strong className="text-white">Données d'utilisation :</strong> historique des recherches effectuées via le Service</li>
              <li><strong className="text-white">Communications :</strong> messages envoyés via notre système de support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Finalités du traitement</h2>
            <p>Vos données sont traitées aux fins suivantes :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Fourniture et amélioration du Service</li>
              <li>Gestion de votre compte et de votre abonnement</li>
              <li>Facturation et prévention de la fraude</li>
              <li>Support client et communication</li>
              <li>Respect de nos obligations légales</li>
              <li>Sécurité de la plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Base légale</h2>
            <p>
              Nos traitements sont fondés sur : (i) l'exécution du contrat pour la fourniture du Service ;
              (ii) notre intérêt légitime pour la sécurité et l'amélioration du Service ;
              (iii) le respect de nos obligations légales ; (iv) votre consentement pour les cookies
              non essentiels.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Destinataires des données</h2>
            <p>Vos données peuvent être partagées avec :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-white">Stripe</strong> — traitement des paiements</li>
              <li><strong className="text-white">Prestataires d'hébergement</strong> — stockage sécurisé des données</li>
              <li><strong className="text-white">Autorités compétentes</strong> — en cas d'obligation légale</li>
            </ul>
            <p className="mt-2">Nous ne vendons jamais vos données personnelles à des tiers.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Conservation des données</h2>
            <p>
              Vos données de compte sont conservées pendant la durée de votre abonnement et 3 ans après
              sa résiliation à des fins comptables et légales. Les journaux de connexion sont conservés
              12 mois. Les données de paiement sont conservées conformément aux obligations légales.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Vos droits</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-white">Droit d'accès</strong> — obtenir une copie de vos données</li>
              <li><strong className="text-white">Droit de rectification</strong> — corriger vos données inexactes</li>
              <li><strong className="text-white">Droit à l'effacement</strong> — demander la suppression de vos données</li>
              <li><strong className="text-white">Droit à la portabilité</strong> — recevoir vos données dans un format structuré</li>
              <li><strong className="text-white">Droit d'opposition</strong> — vous opposer à certains traitements</li>
              <li><strong className="text-white">Droit à la limitation</strong> — limiter le traitement de vos données</li>
            </ul>
            <p className="mt-2">
              Pour exercer vos droits, rendez-vous dans les paramètres de votre compte ou contactez-nous à{' '}
              <a href="mailto:privacy@adw-intelligence.com" className="text-gray-400 hover:text-white underline">
                privacy@adw-intelligence.com
              </a>.
              Vous pouvez également déposer une réclamation auprès de la CNIL.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Sécurité</h2>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger
              vos données : chiffrement en transit (TLS), hachage des mots de passe (Argon2id),
              authentification à deux facteurs, accès restreint aux données personnelles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Contact DPO</h2>
            <p>
              Pour toute question relative à la protection de vos données :{' '}
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
