'use client'

import { create } from 'zustand'
import { User } from '@/types'
import { authApi } from '@/lib/api'
import { setAccessToken } from '@/lib/auth'

interface AuthState {
  user: User | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null

  // Actions
  initialize: () => Promise<void>
  login: (email: string, password: string, twoFactorCode?: string, rememberMe?: boolean) => Promise<{ requiresTwoFactor?: boolean }>
  register: (data: { email: string; username: string; password: string; firstName?: string; lastName?: string }) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    if (get().isInitialized) return
    set({ isLoading: true })
    try {
      const user = await authApi.me() as User
      set({ user, isInitialized: true, isLoading: false })
    } catch {
      // Not authenticated — that's fine
      set({ user: null, isInitialized: true, isLoading: false })
    }
  },

  login: async (email, password, twoFactorCode, rememberMe) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authApi.login({ email, password, twoFactorCode, rememberMe }) as {
        requiresTwoFactor?: boolean
        accessToken?: string
        user?: User
      }

      if (response.requiresTwoFactor) {
        set({ isLoading: false })
        return { requiresTwoFactor: true }
      }

      if (response.accessToken) {
        setAccessToken(response.accessToken)
      }

      set({ user: response.user ?? null, isLoading: false })
      return {}
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null })
    try {
      await authApi.register(data)
      set({ isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur d\'inscription'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await authApi.logout()
    } finally {
      setAccessToken(null)
      set({ user: null, isLoading: false, isInitialized: false })
    }
  },

  refreshUser: async () => {
    try {
      const user = await authApi.me() as User
      set({ user })
    } catch {
      set({ user: null })
    }
  },

  setUser: (user) => set({ user }),
}))

// Convenience hook
export function useAuth() {
  return useAuthStore()
}
