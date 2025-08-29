import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  withCredentials: false,
  timeout: 120000,
})

let accessToken = (typeof window !== 'undefined' && localStorage.getItem('accessToken')) || null

export function setAccessToken(token) {
  accessToken = token
  try{ if (token) localStorage.setItem('accessToken', token); else localStorage.removeItem('accessToken') }catch{}
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (res)=>res,
  (err)=>{
    if(err?.response?.status === 401){
      try{ const toast = require('react-hot-toast'); toast.toast?.error?.('Session expired. Please sign in again.')}catch{}
      try{ localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); localStorage.removeItem('user') }catch{}
      try{ window.location.assign('/login') }catch{}
    }
    return Promise.reject(err)
  }
)

export default api

