import { User, Role } from '@/types'

// ── Token management ────────────────────────────────────────────────────────
// Access token stored in memory only (not localStorage) for XSS protection
// Refresh token is in HttpOnly cookie — managed server-side

let _accessToken: string | null = null

export function getAccessToken(): string | null {
  return _accessToken
}

export function setAccessToken(token: string | null): void {
  _accessToken = token
}

// ── Role checks ─────────────────────────────────────────────────────────────
export function hasRole(user: User | null, role: Role): boolean {
  if (!user) return false
  const hierarchy: Role[] = ['USER', 'ADMIN', 'OWNER']
  return hierarchy.indexOf(user.role) >= hierarchy.indexOf(role)
}

export function isAdmin(user: User | null): boolean {
  return hasRole(user, 'ADMIN')
}

export function isOwner(user: User | null): boolean {
  return user?.role === 'OWNER'
}

export function canAccessDashboard(user: User | null): boolean {
  return user?.status === 'ACTIVE'
}

// ── Redirect paths ──────────────────────────────────────────────────────────
export function getDefaultRedirect(user: User): string {
  if (user.role === 'OWNER') return '/owner'
  if (user.role === 'ADMIN') return '/admin'
  return '/dashboard'
}

// ── Password strength ───────────────────────────────────────────────────────
export interface PasswordStrength {
  score: number // 0-4
  label: string
  color: string
}

export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0
  if (password.length >= 12) score++
  if (password.length >= 16) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const levels = [
    { score: 0, label: '', color: 'bg-gray-800' },
    { score: 1, label: 'Très faible', color: 'bg-gray-600' },
    { score: 2, label: 'Faible', color: 'bg-gray-500' },
    { score: 3, label: 'Moyen', color: 'bg-gray-400' },
    { score: 4, label: 'Fort', color: 'bg-gray-300' },
    { score: 5, label: 'Très fort', color: 'bg-white' },
  ]

  return levels[Math.min(score, 5)]
}
