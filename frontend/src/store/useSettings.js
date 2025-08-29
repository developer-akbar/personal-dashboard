import { create } from 'zustand'
import api from '../api/client'

export const useSettings = create((set, get) => ({
  baseCurrency: 'USD',
  exchangeRates: {},
  async fetchSettings(){
    const { data } = await api.get('/settings')
    set({ baseCurrency: data.baseCurrency || 'USD', exchangeRates: data.exchangeRates || {} })
  },
  async saveSettings(payload){
    await api.put('/settings', payload)
    await get().fetchSettings()
  }
}))

