import create from 'zustand'
import api from '../api/client'

export const usePlan = create((set, get)=> ({
  loading: false,
  isAdmin: false,
  isSubscribed: false,
  freeCardsLimit: 3,
  amazonRefreshPerDay: 3,
  electricityRefreshPerDay: 5,
  resetKey: null,
  fetch: async ()=>{
    if (get().loading) return
    set({ loading: true })
    try{
      const { data } = await api.get('/meta/limits')
      set({ ...data })
    }finally{
      set({ loading: false })
    }
  }
}))

