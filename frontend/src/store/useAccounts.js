import { create } from 'zustand'
import api from '../api/client'

export const useAccounts = create((set, get) => ({
  accounts: [],
  loading: false,
  async fetchAccounts() {
    set({ loading: true })
    try {
      const { data } = await api.get('/accounts')
      set({ accounts: data })
    } finally {
      set({ loading: false })
    }
  },
  async addAccount(payload) {
    await api.post('/accounts', payload)
    await get().fetchAccounts()
  },
  async updateAccount(id, payload) {
    await api.put(`/accounts/${id}`, payload)
    await get().fetchAccounts()
  },
  async deleteAccount(id) {
    await api.delete(`/accounts/${id}`)
    set({ accounts: get().accounts.filter((a) => a.id !== id) })
  },
}))

