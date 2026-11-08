import Link from 'next/link'
import { Zap } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
            <Zap className="w-5 h-5 text-black fill-black" />
          </div>
          <span className="font-bold text-white text-base tracking-tight">
            ADW Intelligence
          </span>
        </Link>
      </header>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>

      {/* Footer note */}
      <footer className="p-6 text-center">
        <p className="text-xs text-gray-700">
          En continuant, vous acceptez nos{' '}
          <Link href="/legal/cgu" className="text-gray-500 hover:text-gray-300 underline underline-offset-2">
            CGU
          </Link>{' '}
          et notre{' '}
          <Link href="/legal/privacy" className="text-gray-500 hover:text-gray-300 underline underline-offset-2">
            politique de confidentialité
          </Link>
          .
        </p>
      </footer>
    </div>
  )
}
