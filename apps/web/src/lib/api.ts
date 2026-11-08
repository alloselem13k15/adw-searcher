import type {
  User,
  AdwSearchParams,
  AdwApiResponse,
  PaginatedResponse,
  SearchHistoryEntry,
  IpLogEntry,
  AdminStats,
} from '@/types'

// ── Core request helper ───────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface RequestOptions {
  method?:  string
  body?:    unknown
  params?:  Record<string, string | number | boolean | undefined>
  headers?: Record<string, string>
}

class ApiError extends Error {
  constructor(
    public status: number,
    public code:   string,
    message:       string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, headers = {} } = opts

  let url = `${BASE_URL}${path}`
  if (params) {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') qs.append(k, String(v))
    }
    const str = qs.toString()
    if (str) url += `?${str}`
  }

  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  if (!res.ok) {
    let json: { error?: string; code?: string } = {}
    try { json = await res.json() } catch { /* ignore */ }
    throw new ApiError(
      res.status,
      json.code  ?? 'API_ERROR',
      json.error ?? `HTTP ${res.status}`,
    )
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// Inject bearer token from Zustand store (called after store hydrates)
let _getToken: (() => string | null) | null = null
export function setTokenProvider(fn: () => string | null): void {
  _getToken = fn
}

function authHeaders(): Record<string, string> {
  const token = _getToken?.()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function req<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  return request<T>(path, { ...opts, headers: { ...authHeaders(), ...opts.headers } })
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    request<{ user: User; accessToken: string }>('/api/auth/register', { method: 'POST', body: data }),

  login: (data: { email: string; password: string; totpCode?: string }) =>
    request<{ user: User; accessToken: string } | { requiresTwoFactor: true }>(
      '/api/auth/login', { method: 'POST', body: data },
    ),

  logout: () =>
    req<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  refresh: () =>
    request<{ accessToken: string }>('/api/auth/refresh', { method: 'POST' }),

  me: () =>
    req<User>('/api/auth/me'),

  verifyEmail: (token: string) =>
    request<{ success: boolean }>('/api/auth/verify-email', { method: 'POST', body: { token } }),

  forgotPassword: (email: string) =>
    request<{ success: boolean }>('/api/auth/forgot-password', { method: 'POST', body: { email } }),

  resetPassword: (token: string, password: string) =>
    request<{ success: boolean }>('/api/auth/reset-password', { method: 'POST', body: { token, password } }),
}

// ── Search ────────────────────────────────────────────────────────────────────

export const searchApi = {
  /**
   * Search with any combination of 40+ ADW API fields.
   * All fields are sent to the backend server, which calls the ADW API internally.
   */
  search: (params: AdwSearchParams) =>
    req<AdwApiResponse>('/api/search', { method: 'POST', body: params }),

  history: (opts?: { page?: number; limit?: number }) =>
    req<PaginatedResponse<SearchHistoryEntry>>('/api/search/history', {
      params: opts as Record<string, number | undefined>,
    }),

  // Alias for components that call getHistory(page, limit)
  getHistory: (page = 1, limit = 20) =>
    req<PaginatedResponse<SearchHistoryEntry>>('/api/search/history', {
      params: { page, limit },
    }),
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export const adminApi = {
  stats: () =>
    req<AdminStats>('/api/admin/stats'),

  users: (opts?: { page?: number; limit?: number; search?: string }) =>
    req<PaginatedResponse<User>>('/api/admin/users', {
      params: opts as Record<string, string | number | undefined>,
    }),

  updateUser: (id: string, data: { isActive?: boolean; role?: string }) =>
    req<User>(`/api/admin/users/${id}`, { method: 'PATCH', body: data }),

  deleteUser: (id: string) =>
    req<{ success: boolean }>(`/api/admin/users/${id}`, { method: 'DELETE' }),

  /**
   * Activity logs — IpLog entries enriched with user info and SearchHistory.
   * Params: action (all|LOGIN|REGISTER|SEARCH|LOGOUT|FAILED_LOGIN), ip, userId, from, to, page, limit
   */
  logs: (opts?: {
    action?: string
    ip?:     string
    userId?: string
    from?:   string
    to?:     string
    page?:   number
    limit?:  number
  }) =>
    req<PaginatedResponse<IpLogEntry>>('/api/admin/logs', {
      params: opts as Record<string, string | number | undefined>,
    }),

  searchHistory: (opts?: { page?: number; limit?: number; userId?: string; search?: string }) =>
    req<PaginatedResponse<SearchHistoryEntry>>('/api/admin/search-history', {
      params: opts as Record<string, string | number | undefined>,
    }),

  auditLogs: (opts?: { page?: number; limit?: number }) =>
    req<PaginatedResponse<unknown>>('/api/admin/audit-logs', {
      params: opts as Record<string, number | undefined>,
    }),

  tickets: (opts?: { page?: number; limit?: number; status?: string }) =>
    req<PaginatedResponse<unknown>>('/api/admin/tickets', {
      params: opts as Record<string, string | number | undefined>,
    }),
}

// ── API Keys ──────────────────────────────────────────────────────────────────

export const apiKeyApi = {
  list: () =>
    req<unknown[]>('/api/api-keys'),

  create: (name: string) =>
    req<{ key: string; id: string }>('/api/api-keys', { method: 'POST', body: { name } }),

  revoke: (id: string) =>
    req<{ success: boolean }>(`/api/api-keys/${id}`, { method: 'DELETE' }),
}

// ── Error utility ─────────────────────────────────────────────────────────────

export { ApiError }

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError
}

export function extractErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error) return err.message
  return 'Une erreur inattendue est survenue'
}
