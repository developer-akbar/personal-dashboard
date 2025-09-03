import { create } from 'zustand'
import api from '../api/client'

export const useElectricity = create((set,get)=> ({
  services: [],
  loading: false,
  async fetchServices(){
    set({ loading:true })
    try{ const { data } = await api.get('/electricity/services'); set({ services: data }) }
    finally{ set({ loading:false }) }
  },
  async addService(serviceNumber, label){
    try{
      const sn = String(serviceNumber||'').trim()
      if (!/^\d{13}$/.test(sn)) throw new Error('Service Number must be exactly 13 digits')
      const { data } = await api.post('/electricity/services', { serviceNumber: sn, label })
      // Do not auto-refresh immediately to avoid 409 Already refreshing if user clicks refresh
      await get().fetchServices()
    }catch(e){
      const msg = e?.response?.data?.error || e?.message || 'Failed to add service'
      e.message = msg
      throw e
    }
  },
  async updateService(id, payload){
    try{
      if (payload?.serviceNumber){
        const sn = String(payload.serviceNumber||'').trim()
        if (!/^\d{13}$/.test(sn)) throw new Error('Service Number must be exactly 13 digits')
      }
      await api.put(`/electricity/services/${id}`, payload)
      await get().fetchServices()
    }catch(e){
      const msg = e?.response?.data?.error || e?.message || 'Failed to update service'
      throw new Error(msg)
    }
  },
  async deleteService(id){
    await api.delete(`/electricity/services/${id}`)
    await get().fetchServices()
  },
  async refreshOne(id){
    await api.post(`/electricity/services/${id}/refresh`)
    await get().fetchServices()
  },
  async refreshAll(){
    await api.post('/electricity/services/refresh-all', { batchSize: 3 })
    await get().fetchServices()
  }
}))

