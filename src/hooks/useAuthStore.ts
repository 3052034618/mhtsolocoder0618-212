import { create } from 'zustand'
import { api } from '@/lib/api'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,

  login: async (email, password) => {
    const data = await api.auth.login(email, password)
    localStorage.setItem('token', data.token)
    set({ token: data.token, user: data.user })
  },

  register: async (username, email, password) => {
    const data = await api.auth.register(username, email, password)
    localStorage.setItem('token', data.token)
    set({ token: data.token, user: data.user })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  fetchMe: async () => {
    try {
      const data = await api.auth.me()
      set({ user: data })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null })
    }
  },
}))
