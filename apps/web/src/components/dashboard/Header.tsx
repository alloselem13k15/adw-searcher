'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Search, Zap } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { formatNumber } from '@/lib/utils'

interface HeaderProps {
  title?: string
  description?: string
}

export function DashboardHeader({ title, description }: HeaderProps) {
  const { user } = useAuth()
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 bg-black/80 backdrop-blur-xl border-b border-gray-800">
      {/* Left — page title */}
      <div className="min-w-0">
        {title && (
          <h1 className="text-lg font-semibold text-white leading-tight truncate">{title}</h1>
        )}
        {description && (
          <p className="text-sm text-gray-500 mt-0.5 truncate">{description}</p>
        )}
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Credits display */}
        {user && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg">
            <Zap className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-sm font-semibold text-white">
              {formatNumber(user.credits)}
            </span>
            <span className="text-xs text-gray-500">crédits</span>
          </div>
        )}

        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          className="relative p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {/* Unread indicator */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full border border-black" />
        </Link>

        {/* Search shortcut */}
        <Link
          href="/dashboard/search"
          className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
          aria-label="Recherche"
        >
          <Search className="w-5 h-5" />
        </Link>
      </div>
    </header>
  )
}
