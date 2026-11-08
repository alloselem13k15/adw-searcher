import type { Metadata } from 'next'
import { Navbar }      from '@/components/landing/Navbar'
import { Hero }        from '@/components/landing/Hero'
import { Features }    from '@/components/landing/Features'
import { Pricing }     from '@/components/landing/Pricing'
import { FAQ }         from '@/components/landing/FAQ'
import { Footer }      from '@/components/landing/Footer'
import { CookieBanner }from '@/components/landing/CookieBanner'

export const metadata: Metadata = {
  title:       'ADW Searcher — Recherche OSINT combinee',
  description:
    'Plateforme de recherche OSINT professionnelle. Croisez 40+ champs en une requete. Version en attendant — le site officiel arrive prochainement.',
  keywords:    ['OSINT', 'recherche', 'ADW', 'ADW Searcher', 'ADW API'],
  robots:      { index: false, follow: false }, // Version en attendant — ne pas indexer
}

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
      <CookieBanner />
    </>
  )
}
