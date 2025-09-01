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
    await api.post('/electricity/services', { serviceNumber, label })
    await get().fetchServices()
  },
  async updateService(id, payload){
    await api.put(`/electricity/services/${id}`, payload)
    await get().fetchServices()
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

