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
      const { data } = await api.post('/electricity/services', { serviceNumber, label })
      try{ await api.post(`/electricity/services/${data.id}/refresh`) }catch{}
      await get().fetchServices()
    }catch(e){
      const msg = e?.response?.data?.error || e?.message || 'Failed to add service'
      throw new Error(msg)
    }
  },
  async updateService(id, payload){
    try{
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

