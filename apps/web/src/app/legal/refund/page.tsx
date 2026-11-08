import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de Remboursement | ADW Intelligence',
  description: 'Politique de remboursement d\'ADW Intelligence.',
}

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-10">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Politique de Remboursement</h1>
        <p className="text-sm text-gray-500 mb-12">Dernière mise à jour : 1er janvier 2025</p>

        <div className="space-y-8 text-gray-300 leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Principe général</h2>
            <p>
              ADW Intelligence propose des abonnements mensuels avec renouvellement automatique.
              En raison de la nature numérique du Service et de la consommation immédiate des crédits,
              notre politique de remboursement est encadrée par les conditions suivantes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Droit de rétractation</h2>
            <p>
              Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation
              de 14 jours ne s'applique pas aux contenus numériques fournis immédiatement après la
              souscription, dès lors que vous avez expressément renoncé à votre droit de rétractation
              lors de l'inscription.
            </p>
            <p className="mt-2">
              Toutefois, si aucun crédit n'a été consommé dans les 48 heures suivant votre premier
              paiement, nous examinerons votre demande de remboursement au cas par cas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Remboursement en cas de dysfonctionnement</h2>
            <p>
              Si des crédits ont été débités en raison d'un dysfonctionnement avéré de notre plateforme,
              nous nous engageons à les rembourser ou à les restituer intégralement dans les 5 jours
              ouvrés suivant la confirmation du dysfonctionnement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Résiliation d'abonnement</h2>
            <p>
              La résiliation de votre abonnement prend effet à la fin de la période de facturation en cours.
              Aucun remboursement au prorata n'est effectué pour les jours non utilisés du mois en cours,
              sauf en cas de violation de nos CGU par ADW Intelligence.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Crédits non consommés</h2>
            <p>
              Les crédits attribués dans le cadre d'un abonnement ne sont pas remboursables en espèces.
              En cas de résiliation, les crédits restants sont perdus à l'expiration de l'abonnement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Procédure de demande</h2>
            <p>Pour formuler une demande de remboursement, contactez notre support :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Via le système de tickets dans votre tableau de bord</li>
              <li>Par e-mail à <a href="mailto:billing@adw-intelligence.com" className="text-gray-400 hover:text-white underline">billing@adw-intelligence.com</a></li>
            </ul>
            <p className="mt-2">
              Indiquez votre identifiant de compte, la date du paiement concerné et le motif de votre demande.
              Nous répondrons dans un délai de 5 jours ouvrés.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
