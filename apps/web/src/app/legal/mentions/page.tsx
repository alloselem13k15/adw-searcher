import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mentions Légales | ADW Intelligence',
  description: 'Mentions légales de la plateforme ADW Intelligence.',
}

export default function MentionsPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-10">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Mentions Légales</h1>
        <p className="text-sm text-gray-500 mb-12">Dernière mise à jour : 1er janvier 2025</p>

        <div className="space-y-8 text-gray-300 leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Éditeur du site</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-2">
              <p><span className="text-gray-500">Société :</span> ADW Intelligence SAS</p>
              <p><span className="text-gray-500">Forme juridique :</span> Société par Actions Simplifiée (SAS)</p>
              <p><span className="text-gray-500">Capital social :</span> 10 000 €</p>
              <p><span className="text-gray-500">Siège social :</span> France</p>
              <p><span className="text-gray-500">SIRET :</span> En cours d'immatriculation</p>
              <p><span className="text-gray-500">TVA intracommunautaire :</span> En cours</p>
              <p>
                <span className="text-gray-500">Contact :</span>{' '}
                <a href="mailto:contact@adw-intelligence.com" className="text-gray-400 hover:text-white underline">
                  contact@adw-intelligence.com
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Directeur de la publication</h2>
            <p>Le directeur de la publication est le représentant légal de ADW Intelligence SAS.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Hébergement</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-2">
              <p><span className="text-gray-500">Hébergeur :</span> Infrastructure cloud européenne</p>
              <p><span className="text-gray-500">Localisation des données :</span> Union Européenne</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Propriété intellectuelle</h2>
            <p>
              L'ensemble des éléments constituant le site ADW Intelligence (textes, graphiques, logiciels,
              photographies, images, sons, plans, noms, logos, marques, créations et œuvres protégeables
              diverses, bases de données) sont la propriété exclusive de ADW Intelligence SAS ou de leurs
              détenteurs respectifs.
            </p>
            <p className="mt-2">
              Toute reproduction, représentation, modification, publication, transmission ou dénaturation,
              totale ou partielle, du site ou de son contenu, par quelque procédé que ce soit,
              et sur quelque support que ce soit est interdite sans autorisation préalable écrite.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Limitation de responsabilité</h2>
            <p>
              ADW Intelligence SAS s'efforce de maintenir le Service accessible en permanence mais ne peut
              garantir une disponibilité ininterrompue. La société ne saurait être tenue responsable des
              dommages directs ou indirects résultant de l'accès ou de l'impossibilité d'accéder au Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Droit applicable et juridiction</h2>
            <p>
              Le présent site et ses mentions légales sont soumis au droit français.
              En cas de litige, et après tentative de résolution amiable, les tribunaux compétents
              seront ceux de Paris.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Médiation</h2>
            <p>
              Conformément aux dispositions du Code de la consommation, vous pouvez recourir gratuitement
              au service de médiation dont nous dépendons par voie électronique ou par courrier.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
