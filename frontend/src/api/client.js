import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  withCredentials: false,
  timeout: 60000, // Reduced to 60 seconds
})

let accessToken = (typeof window !== 'undefined' && localStorage.getItem('accessToken')) || null

// Track slow requests
const slowRequestThreshold = 8000 // 8 seconds
let slowRequestToastId = null
let activeRequests = new Set()

// Track failed requests for recovery
let consecutiveFailures = 0
const maxConsecutiveFailures = 3
let lastFailureTime = 0
const failureResetTime = 30000 // 30 seconds

export function setAccessToken(token) {
  accessToken = token
  try{ if (token) localStorage.setItem('accessToken', token); else localStorage.removeItem('accessToken') }catch{}
}

// Recovery function for persistent connection issues
function handleConnectionFailure(error) {
  const now = Date.now()
  
  // Reset failure count if enough time has passed
  if (now - lastFailureTime > failureResetTime) {
    consecutiveFailures = 0
  }
  
  consecutiveFailures++
  lastFailureTime = now
  
  // Show different messages based on failure count
  if (consecutiveFailures === 1) {
    toast.error('Connection issue detected. Retrying...', { duration: 4000 })
  } else if (consecutiveFailures === 2) {
    toast.error('Still having connection issues. Please check your network.', { duration: 5000 })
  } else if (consecutiveFailures >= maxConsecutiveFailures) {
    toast.error(
      'Multiple connection failures detected. Please try refreshing the page or logging in again.',
      { duration: 8000 }
    )
    
    // Clear all stored data and redirect to login
    setTimeout(() => {
      try {
        localStorage.clear()
        window.location.hash = '#/'
        window.location.reload()
      } catch (e) {
        console.error('Error during recovery:', e)
      }
    }, 2000)
  }
}

// Check if error is likely a connection issue
function isConnectionError(error) {
  if (!error) return false
  
  // Network errors
  if (error.code === 'NETWORK_ERROR' || 
      error.code === 'ECONNABORTED' || 
      error.message?.includes('timeout') ||
      error.message?.includes('Network Error') ||
      error.message?.includes('ERR_NETWORK')) {
    return true
  }
  
  // HTTP status codes that suggest connection issues
  if (error.response?.status >= 500 || 
      error.response?.status === 0 ||
      !error.response) {
    return true
  }
  
  return false
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
    
    // Handle connection failures
    if (isConnectionError(err)) {
      handleConnectionFailure(err)
    }
    // Handle authentication errors
    else if(err?.response?.status === 401 && !/\/auth\/(login|register)$/.test(url)){
      try{ toast.error('Session expired. Please sign in again.') }catch{}
      try{ localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); localStorage.removeItem('user') }catch{}
      try{ window.location.hash = '#/' }catch{}
    }
    // Handle other errors
    else if (err?.response?.status >= 400) {
      const errorMessage = err?.response?.data?.message || err?.message || 'An error occurred'
      toast.error(errorMessage, { duration: 5000 })
    }
    
    try{ localStorage.setItem('lastApiMeta', JSON.stringify({ url: err?.config?.url, status: err?.response?.status || 0, error: err?.message, at: Date.now() })) }catch{}
    return Promise.reject(err)
  }
)

// Connection health check
export async function checkConnectionHealth() {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/health`, {
      method: 'GET',
      timeout: 10000,
    })
    return response.ok
  } catch (error) {
    console.error('Health check failed:', error)
    return false
  }
}

// Recovery function for users
export function suggestRecoveryActions() {
  const actions = [
    '1. Check your internet connection',
    '2. Try refreshing the page (Ctrl+F5 or Cmd+Shift+R)',
    '3. Clear browser cache and cookies',
    '4. Try incognito/private mode',
    '5. Disable browser extensions temporarily',
    '6. Try a different network (mobile hotspot)'
  ]
  
  toast.error(
    `Connection issues detected. Try these steps:\n${actions.join('\n')}`,
    { duration: 10000 }
  )
}

export default api

