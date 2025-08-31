import { create } from 'zustand'
import api from '../api/client'

export const useRewards = create((set, get) => ({
  byAccount: {}, // accountId -> { items, loading, error, at }
  async fetchForAccount(accountId){
    set(state=>({ byAccount: { ...state.byAccount, [accountId]: { ...(state.byAccount[accountId]||{}), loading:true, error:null } }}))
    try{
      const { data } = await api.get(`/rewards/${accountId}`)
      set(state=>({ byAccount: { ...state.byAccount, [accountId]: { items: data.rewards || [], loading:false, error:null, at: Date.now() } }}))
    }catch(e){
      set(state=>({ byAccount: { ...state.byAccount, [accountId]: { ...(state.byAccount[accountId]||{}), loading:false, error: e?.response?.data?.error || e?.message || 'Failed to fetch' } }}))
    }
  },
  async refreshAll(){
    await api.post('/rewards/refresh-all', { batchSize: 3 })
  }
}))

