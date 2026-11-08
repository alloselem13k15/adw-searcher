import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { SubscriptionPlan, TicketPriority, TicketStatus, AccountStatus } from '@/types'

// ── className helper ────────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Date formatting ─────────────────────────────────────────────────────────
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', options ?? {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'à l\'instant'
  if (diffMinutes < 60) return `il y a ${diffMinutes}min`
  if (diffHours < 24) return `il y a ${diffHours}h`
  if (diffDays < 7) return `il y a ${diffDays}j`
  return formatDate(d)
}

// ── Number formatting ───────────────────────────────────────────────────────
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toString()
}

export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 100) // amount in cents
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ── String helpers ──────────────────────────────────────────────────────────
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength - 3)}...`
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  const masked = local.charAt(0) + '*'.repeat(Math.max(0, local.length - 2)) + local.charAt(local.length - 1)
  return `${masked}@${domain}`
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '***'
  return `${key.slice(0, 8)}${'*'.repeat(16)}${key.slice(-4)}`
}

// ── Validation ──────────────────────────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  if (password.length < 12) errors.push('Au moins 12 caractères')
  if (!/[A-Z]/.test(password)) errors.push('Au moins une majuscule')
  if (!/[a-z]/.test(password)) errors.push('Au moins une minuscule')
  if (!/[0-9]/.test(password)) errors.push('Au moins un chiffre')
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Au moins un caractère spécial')
  return { valid: errors.length === 0, errors }
}

// ── Status labels / styles ──────────────────────────────────────────────────
export function getPlanLabel(plan: SubscriptionPlan): string {
  const labels: Record<SubscriptionPlan, string> = {
    FREE: 'Gratuit',
    BASIC: 'Basic',
    PREMIUM: 'Premium',
    BUSINESS: 'Business',
  }
  return labels[plan]
}

export function getTicketStatusLabel(status: TicketStatus): string {
  const labels: Record<TicketStatus, string> = {
    OPEN: 'Ouvert',
    IN_PROGRESS: 'En cours',
    RESOLVED: 'Résolu',
    CLOSED: 'Fermé',
  }
  return labels[status]
}

export function getTicketStatusStyle(status: TicketStatus): string {
  const styles: Record<TicketStatus, string> = {
    OPEN: 'bg-gray-800 text-gray-200 border-gray-700',
    IN_PROGRESS: 'bg-gray-700 text-white border-gray-600',
    RESOLVED: 'bg-gray-800 text-gray-400 border-gray-700',
    CLOSED: 'bg-gray-900 text-gray-500 border-gray-800',
  }
  return styles[status]
}

export function getTicketPriorityLabel(priority: TicketPriority): string {
  const labels: Record<TicketPriority, string> = {
    LOW: 'Faible',
    MEDIUM: 'Moyen',
    HIGH: 'Élevé',
    URGENT: 'Urgent',
  }
  return labels[priority]
}

export function getTicketPriorityStyle(priority: TicketPriority): string {
  const styles: Record<TicketPriority, string> = {
    LOW: 'bg-gray-800 text-gray-400 border-gray-700',
    MEDIUM: 'bg-gray-700 text-gray-200 border-gray-600',
    HIGH: 'bg-gray-700 text-white border-gray-500',
    URGENT: 'bg-gray-600 text-white border-gray-500',
  }
  return styles[priority]
}

export function getAccountStatusLabel(status: AccountStatus): string {
  const labels: Record<AccountStatus, string> = {
    ACTIVE: 'Actif',
    SUSPENDED: 'Suspendu',
    PENDING_VERIFICATION: 'En attente',
    DELETED: 'Supprimé',
  }
  return labels[status]
}

export function getAccountStatusStyle(status: AccountStatus): string {
  const styles: Record<AccountStatus, string> = {
    ACTIVE: 'bg-gray-800 text-gray-300 border-gray-700',
    SUSPENDED: 'bg-gray-900 text-gray-500 border-gray-800',
    PENDING_VERIFICATION: 'bg-gray-800 text-gray-400 border-gray-700',
    DELETED: 'bg-gray-900 text-gray-600 border-gray-800',
  }
  return styles[status]
}

// ── Copy to clipboard ───────────────────────────────────────────────────────
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.left = '-9999px'
    document.body.appendChild(el)
    el.select()
    const success = document.execCommand('copy')
    document.body.removeChild(el)
    return success
  }
}

// ── URL helpers ─────────────────────────────────────────────────────────────
export function buildUrl(base: string, params: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(base, 'http://placeholder')
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })
  return url.pathname + url.search
}

// ── Sleep ───────────────────────────────────────────────────────────────────
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// ── Object helpers ──────────────────────────────────────────────────────────
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj }
  keys.forEach(key => delete result[key])
  return result
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach(key => { result[key] = obj[key] })
  return result
}

// ── Credit cost map ─────────────────────────────────────────────────────────
export const CREDIT_COSTS: Record<string, number> = {
  PERSON: 5,
  EMAIL: 3,
  PHONE: 4,
  USERNAME: 2,
  IP: 2,
  DOMAIN: 3,
  COMPANY: 6,
}

export function getSearchTypeCost(type: string): number {
  return CREDIT_COSTS[type] ?? 3
}
