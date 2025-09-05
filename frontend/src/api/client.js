import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  withCredentials: false,
  timeout: 120000,
})

let accessToken = (typeof window !== 'undefined' && localStorage.getItem('accessToken')) || null

// Track slow requests
const slowRequestThreshold = 8000 // 8 seconds
let slowRequestToastId = null
let activeRequests = new Set()

export function setAccessToken(token) {
  accessToken = token
  try{ if (token) localStorage.setItem('accessToken', token); else localStorage.removeItem('accessToken') }catch{}
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  
  // Set up slow request detection
  config.metadata = { startTime: Date.now() }
  activeRequests.add(config.metadata.startTime)
  
  // Show slow request toast after threshold (only once)
  const timeoutId = setTimeout(() => {
    if (!slowRequestToastId) {
      slowRequestToastId = toast.loading(
        '🔄 Server is waking up from inactivity... This may take a moment.',
        {
          duration: 0, // Don't auto-dismiss
          style: {
            background: 'var(--warning-bg)',
            color: 'var(--warning-text)',
            border: '1px solid var(--warning-border)',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '400px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }
        }
      )
    }
  }, slowRequestThreshold)
  
  config.metadata.timeoutId = timeoutId
  
  return config
})

api.interceptors.response.use(
  (res)=>{
    // Track completed requests
    if (res.config?.metadata?.startTime) {
      activeRequests.delete(res.config.metadata.startTime)
      
      // Clear timeout if request completed before threshold
      if (res.config.metadata.timeoutId) {
        clearTimeout(res.config.metadata.timeoutId)
      }
      
      // Dismiss slow request toast if all requests are complete
      if (activeRequests.size === 0 && slowRequestToastId) {
        toast.dismiss(slowRequestToastId)
        slowRequestToastId = null
      }
    }
    
    try{ localStorage.setItem('lastApiMeta', JSON.stringify({ url: res.config?.url, status: res.status, at: Date.now() })) }catch{}
    return res
  },
  (err)=>{
    // Track completed requests (even failed ones)
    if (err?.config?.metadata?.startTime) {
      activeRequests.delete(err.config.metadata.startTime)
      
      // Clear timeout if request failed before threshold
      if (err.config.metadata.timeoutId) {
        clearTimeout(err.config.metadata.timeoutId)
      }
      
      // Dismiss slow request toast if all requests are complete
      if (activeRequests.size === 0 && slowRequestToastId) {
        toast.dismiss(slowRequestToastId)
        slowRequestToastId = null
      }
    }
    
    const url = err?.config?.url || ''
    if(err?.response?.status === 401 && !/\/auth\/(login|register)$/.test(url)){
      try{ toast.error('Session expired. Please sign in again.') }catch{}
      try{ localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); localStorage.removeItem('user') }catch{}
      try{ window.location.hash = '#/' }catch{}
    }
    try{ localStorage.setItem('lastApiMeta', JSON.stringify({ url: err?.config?.url, status: err?.response?.status || 0, error: err?.message, at: Date.now() })) }catch{}
    return Promise.reject(err)
  }
)

export default api

