import React, { useState, useEffect } from 'react'
import { FiWifi, FiWifiOff, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi'
import { checkConnectionHealth, suggestRecoveryActions } from '../api/client'
import toast from 'react-hot-toast'

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isHealthy, setIsHealthy] = useState(true)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check connection health periodically
    const healthCheck = async () => {
      if (isOnline) {
        const healthy = await checkConnectionHealth()
        setIsHealthy(healthy)
        
        if (!healthy) {
          console.warn('Server health check failed')
        }
      }
    }

    // Initial check
    healthCheck()

    // Check every 30 seconds
    const interval = setInterval(healthCheck, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [isOnline])

  const handleRefresh = async () => {
    setIsChecking(true)
    try {
      const healthy = await checkConnectionHealth()
      setIsHealthy(healthy)
      
      if (healthy) {
        toast.success('Connection restored!')
        // Reload the page to refresh data
        setTimeout(() => window.location.reload(), 1000)
      } else {
        suggestRecoveryActions()
      }
    } catch (error) {
      console.error('Health check failed:', error)
      suggestRecoveryActions()
    } finally {
      setIsChecking(false)
    }
  }

  if (isOnline && isHealthy) {
    return null // Don't show anything when everything is working
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: isOnline ? 'var(--warning-bg)' : 'var(--danger-bg)',
      color: isOnline ? 'var(--warning-text)' : 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      border: `1px solid ${isOnline ? 'var(--warning-border)' : 'var(--danger-bg)'}`,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500',
      maxWidth: '300px'
    }}>
      {!isOnline ? (
        <>
          <FiWifiOff />
          <span>No internet connection</span>
        </>
      ) : !isHealthy ? (
        <>
          <FiAlertTriangle />
          <span>Server connection issues</span>
        </>
      ) : (
        <>
          <FiWifi />
          <span>Connection restored</span>
        </>
      )}
      
      <button
        onClick={handleRefresh}
        disabled={isChecking}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          cursor: isChecking ? 'not-allowed' : 'pointer',
          padding: '4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          opacity: isChecking ? 0.6 : 1
        }}
        title="Check connection"
      >
        <FiRefreshCw style={{
          animation: isChecking ? 'spin 1s linear infinite' : 'none',
          fontSize: '16px'
        }} />
      </button>
      
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}