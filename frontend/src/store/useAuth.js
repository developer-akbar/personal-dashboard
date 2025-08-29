import { create } from 'zustand'
import api, { setAccessToken } from '../api/client'

export const useAuth = create((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  async register(email, password) {
    set({ loading: true })
    try {
      const { data } = await api.post('/auth/register', { email, password })
      setAccessToken(data.accessToken)
      set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken })
      return true
    } finally {
      set({ loading: false })
    }
  },
  async login(email, password) {
    set({ loading: true })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setAccessToken(data.accessToken)
      set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken })
      return true
    } finally {
      set({ loading: false })
    }
  },
  logout() {
    setAccessToken(null)
    set({ user: null, accessToken: null, refreshToken: null })
  },
}))

