import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'ADW Intelligence — Plateforme OSINT Premium',
    template: '%s | ADW Intelligence',
  },
  description:
    'Plateforme OSINT professionnelle pour recherches avancées sur personnes, emails, téléphones, domaines et plus encore.',
  keywords: ['OSINT', 'intelligence', 'recherche', 'investigation', 'data'],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'ADW Intelligence',
    title: 'ADW Intelligence — Plateforme OSINT Premium',
    description: 'Plateforme OSINT professionnelle pour recherches avancées.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ADW Intelligence',
    description: 'Plateforme OSINT professionnelle pour recherches avancées.',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#050505',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <body className="bg-black text-white antialiased">
        {children}
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1A1A1A',
              color: '#FFFFFF',
              border: '1px solid #333333',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              maxWidth: '380px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            },
            success: {
              iconTheme: {
                primary: '#FFFFFF',
                secondary: '#050505',
              },
            },
            error: {
              iconTheme: {
                primary: '#A1A1A1',
                secondary: '#050505',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
