import { create } from 'zustand'
import api, { setAccessToken } from '../api/client'

export const useAuth = create((set, get) => ({
  user: (()=>{ try{ return JSON.parse(localStorage.getItem('user')||'null')}catch{return null}})(),
  accessToken: (typeof window!=='undefined' && localStorage.getItem('accessToken')) || null,
  refreshToken: (typeof window!=='undefined' && localStorage.getItem('refreshToken')) || null,
  loading: false,
  async register(email, password) {
    set({ loading: true })
    try {
      const { data } = await api.post('/auth/register', { email, password })
      setAccessToken(data.accessToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('refreshToken', data.refreshToken)
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
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('refreshToken', data.refreshToken)
      set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken })
      return true
    } finally {
      set({ loading: false })
    }
  },
  logout() {
    setAccessToken(null)
    try{ localStorage.removeItem('user'); localStorage.removeItem('refreshToken')}catch{}
    set({ user: null, accessToken: null, refreshToken: null })
  },
}))

