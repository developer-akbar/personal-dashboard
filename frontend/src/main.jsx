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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster position="bottom-center" />
  </StrictMode>,
)
