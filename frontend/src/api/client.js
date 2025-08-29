import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  withCredentials: false,
  timeout: 20000,
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

export default api

