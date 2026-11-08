'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Search,
  History,
  Key,
  Settings,
  Users,
  FileText,
  Megaphone,
  ClipboardList,
  Activity,
  LogOut,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/Logo'
import { useAuthStore } from '@/store/authStore'

interface NavItem {
  label: string
  href:  string
  icon:  React.ElementType
}

const userNav: NavItem[] = [
  { label: 'Vue d\'ensemble', href: '/dashboard',         icon: LayoutDashboard },
  { label: 'Recherche',       href: '/dashboard/search',  icon: Search          },
  { label: 'Historique',      href: '/dashboard/history', icon: History         },
  { label: 'Cles API',        href: '/dashboard/api-keys',icon: Key             },
  { label: 'Parametres',      href: '/dashboard/settings',icon: Settings        },
]

const adminNav: NavItem[] = [
  { label: 'Vue d\'ensemble', href: '/admin',              icon: LayoutDashboard },
  { label: 'Utilisateurs',    href: '/admin/users',        icon: Users           },
  { label: 'Journaux',        href: '/admin/logs',         icon: Activity        },
  { label: 'Tickets',         href: '/admin/tickets',      icon: FileText        },
  { label: 'Annonces',        href: '/admin/announcements',icon: Megaphone       },
  { label: 'Logs d\'audit',   href: '/admin/audit-logs',   icon: ClipboardList  },
]

interface NavLinkProps {
  item:    NavItem
  compact: boolean
}

function NavLink({ item, compact }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      title={compact ? item.label : undefined}
      className={cn(
        'flex items-center rounded-md transition-colors',
        compact ? 'justify-center p-2' : 'gap-3 px-3 py-2',
        isActive
          ? 'bg-white text-black'
          : 'text-gray-400 hover:text-white hover:bg-white/5',
      )}
    >
      <Icon size={16} className="shrink-0" />
      {!compact && (
        <span className="text-sm font-medium truncate">{item.label}</span>
      )}
    </Link>
  )
}

interface SidebarProps {
  compact?: boolean
}

export function Sidebar({ compact = false }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER'

  const nav = isAdmin ? adminNav : userNav

  return (
    <aside
      className={cn(
        'flex flex-col bg-black border-r border-white/5 h-full',
        compact ? 'w-14' : 'w-56',
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center border-b border-white/5 shrink-0', compact ? 'justify-center p-3 h-14' : 'px-4 h-14')}>
        <Link href={isAdmin ? '/admin' : '/dashboard'}>
          <Logo
            size={22}
            showText={!compact}
            className="text-white"
            textClassName="text-sm"
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 overflow-y-auto py-4', compact ? 'px-1 space-y-1' : 'px-2 space-y-0.5')}>
        {/* Admin badge */}
        {isAdmin && !compact && (
          <div className="flex items-center gap-2 px-3 py-1.5 mb-3">
            <Shield size={12} className="text-gray-600" />
            <span className="text-xs text-gray-600 font-medium uppercase tracking-wider">
              Administration
            </span>
          </div>
        )}

        {nav.map(item => (
          <NavLink key={item.href} item={item} compact={compact} />
        ))}

        {/* Switch to dashboard if admin */}
        {isAdmin && (
          <>
            <div className={cn('border-t border-white/5', compact ? 'my-2' : 'my-3')} />
            {!compact && (
              <div className="flex items-center gap-2 px-3 py-1.5">
                <LayoutDashboard size={12} className="text-gray-600" />
                <span className="text-xs text-gray-600 font-medium uppercase tracking-wider">
                  Espace personnel
                </span>
              </div>
            )}
            {userNav.slice(0, 3).map(item => (
              <NavLink key={`user-${item.href}`} item={item} compact={compact} />
            ))}
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div className={cn('border-t border-white/5 p-2 shrink-0', compact ? '' : 'p-3')}>
        {!compact && user && (
          <div className="px-2 py-1.5 mb-2">
            <p className="text-xs font-medium text-white truncate">{user.username}</p>
            <p className="text-xs text-gray-600 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={() => logout()}
          title="Deconnexion"
          className={cn(
            'flex items-center w-full rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors',
            compact ? 'justify-center p-2' : 'gap-3 px-3 py-2',
          )}
        >
          <LogOut size={15} className="shrink-0" />
          {!compact && <span className="text-sm">Deconnexion</span>}
        </button>
      </div>
    </aside>
  )
}
