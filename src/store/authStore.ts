import { create } from 'zustand'
import * as authApi from '../api/authApi'
import type { AuthUser, UserRole } from '../types/auth'
import { hasMinRole } from '../types/auth'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AuthState = {
  user: AuthUser | null
  status: AuthStatus
  error: string | null
}

type AuthActions = {
  checkSession: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  canAccess: (minRole: UserRole) => boolean
}

export type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  status: 'loading',
  error: null,

  checkSession: async () => {
    set({ status: 'loading', error: null })
    try {
      const user = await authApi.fetchCurrentUser()
      set({
        user,
        status: user ? 'authenticated' : 'unauthenticated',
        error: null,
      })
    } catch (error) {
      set({
        user: null,
        status: 'unauthenticated',
        error: error instanceof Error ? error.message : 'Session check failed',
      })
    }
  },

  login: async (email, password) => {
    set({ error: null })
    const user = await authApi.login(email, password)
    set({ user, status: 'authenticated', error: null })
  },

  logout: async () => {
    await authApi.logout()
    set({ user: null, status: 'unauthenticated', error: null })
  },

  canAccess: (minRole) => {
    const { user } = get()
    if (!user) return false
    return hasMinRole(user.role, minRole)
  },
}))
