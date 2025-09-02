import { create } from 'zustand'
import api from '../api/client'

export const useBalances = create((set, get) => ({
  refreshing: false,
  progress: { current: 0, total: 0, message: '' },
  lockUntil: 0,
  setLock(ms){ set({ lockUntil: Date.now() + ms }) },
  async refreshOne(accountId) {
    set({ refreshing: true, progress: { current: 0, total: 1, message: 'Refreshing…' } })
    try {
      const { data } = await api.post(`/balances/refresh/${accountId}`)
      return data
    } finally {
      set({ refreshing: false, progress: { current: 0, total: 0, message: '' } })
    }
  },
  async refreshAll(accounts) {
    set({ refreshing: true, progress: { current: 0, total: accounts.length, message: 'Queued…' } })
    try {
      const { data } = await api.post('/balances/refresh-all')
      return data
    } finally {
      set({ refreshing: false, progress: { current: 0, total: 0, message: '' } })
    }
  },
  async history(accountId) {
    const { data } = await api.get(`/balances/history/${accountId}`)
    return data
  },
}))

