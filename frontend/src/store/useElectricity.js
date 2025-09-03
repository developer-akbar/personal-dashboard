import { create } from 'zustand'
import api from '../api/client'

export const useElectricity = create((set,get)=> ({
  services: [],
  trashed: [],
  loading: false,
  async fetchServices(){
    set({ loading:true })
    try{ const { data } = await api.get('/electricity/services'); set({ services: data }) }
    finally{ set({ loading:false }) }
  },
  async fetchTrashed(){
    const { data } = await api.get('/electricity/services/trash')
    set({ trashed: data })
  },
  async addService(serviceNumber, label){
    try{
      const sn = String(serviceNumber||'').trim()
      if (!/^\d{13}$/.test(sn)) throw new Error('Service Number must be exactly 13 digits')
      const { data } = await api.post('/electricity/services', { serviceNumber: sn, label })
      const createdId = data?.id
      if (createdId){
        // Auto-refresh the newly added service so user sees current bill details
        await get().refreshOne(createdId)
      } else {
        await get().fetchServices()
      }
      return createdId
    }catch(e){
      const msg = e?.response?.data?.error || e?.message || 'Failed to add service'
      e.message = msg
      e.canRestore = !!e?.response?.data?.canRestore
      e.restoreId = e?.response?.data?.id
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
    await get().fetchTrashed()
  },
  async deleteServicePermanent(id){
    await api.delete(`/electricity/services/permanent/${id}`)
    await get().fetchServices()
    await get().fetchTrashed()
  },
  async restoreService(id){
    await api.post(`/electricity/services/restore/${id}`)
    await get().fetchServices()
    await get().fetchTrashed()
  },
  async refreshOne(id){
    await api.post(`/electricity/services/${id}/refresh`)
    await get().fetchServices()
  },
  async refreshAll(){
    await api.post('/electricity/services/refresh-all', { batchSize: 3 })
    await get().fetchServices()
  },
  async togglePinned(id, pinned){
    await api.put(`/electricity/services/${id}`, { pinned })
    await get().fetchServices()
  }
}))

