import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Toaster } from 'react-hot-toast'
import { applyTheme } from './store/useTheme'

try {
  const saved = localStorage.getItem('theme-preference') || 'system'
  applyTheme(saved)
} catch (error) {
  // Silently handle theme loading errors
  console.warn('Failed to load theme preference:', error)
}

// Fix mobile 100vh issue (URL bar hiding changes viewport height)
try {
  const setVH = () => {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }
  setVH()
  window.addEventListener('resize', setVH)
  window.addEventListener('orientationchange', setVH)
} catch (e) {
  // noop
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster 
      position="bottom-center" 
      toastOptions={{ 
        duration: 2500, 
        style: { 
          maxWidth: '480px', 
          whiteSpace: 'pre-wrap', 
          wordBreak: 'break-word' 
        }
      }} 
      containerStyle={{
        zIndex: 9999
      }}
    />
  </StrictMode>,
)
