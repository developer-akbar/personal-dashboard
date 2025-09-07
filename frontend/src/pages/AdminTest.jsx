import React, { useState, useEffect } from 'react'
import api from '../api/client'
import toast from 'react-hot-toast'
import GlobalHeader from '../components/GlobalHeader'

export default function AdminTest() {
  const [testResults, setTestResults] = useState({})
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    const results = {}

    try {
      // Test 1: Health check
      console.log('🧪 Testing admin health endpoint...')
      const healthResponse = await api.get('/admin/health')
      results.health = { success: true, data: healthResponse.data }
      console.log('✅ Health test passed:', healthResponse.data)
    } catch (error) {
      results.health = { success: false, error: error.message, status: error.response?.status }
      console.error('❌ Health test failed:', error)
    }

    try {
      // Test 2: Test endpoint
      console.log('🧪 Testing admin test endpoint...')
      const testResponse = await api.get('/admin/test')
      results.test = { success: true, data: testResponse.data }
      console.log('✅ Test endpoint passed:', testResponse.data)
    } catch (error) {
      results.test = { success: false, error: error.message, status: error.response?.status }
      console.error('❌ Test endpoint failed:', error)
    }

    try {
      // Test 3: Analytics endpoint (should fail if not admin)
      console.log('🧪 Testing admin analytics endpoint...')
      const analyticsResponse = await api.get('/admin/analytics')
      results.analytics = { success: true, data: analyticsResponse.data }
      console.log('✅ Analytics test passed:', analyticsResponse.data)
    } catch (error) {
      results.analytics = { success: false, error: error.message, status: error.response?.status }
      console.error('❌ Analytics test failed:', error)
    }

    setTestResults(results)
    setLoading(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  return (
    <div className="container">
      <GlobalHeader title="Admin API Test" showBackButton={true} />
      
      <div style={{ padding: '1rem' }}>
        <h2>Admin API Test Results</h2>
        
        <button 
          onClick={runTests} 
          disabled={loading}
          style={{
            background: 'var(--primary-bg)',
            color: 'var(--primary-text)',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '1rem'
          }}
        >
          {loading ? 'Running Tests...' : 'Run Tests Again'}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(testResults).map(([testName, result]) => (
            <div 
              key={testName}
              style={{
                padding: '1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: result.success ? '#f0f9ff' : '#fef2f2'
              }}
            >
              <h3 style={{ 
                color: result.success ? '#059669' : '#dc2626',
                margin: '0 0 0.5rem 0'
              }}>
                {testName.toUpperCase()} Test: {result.success ? '✅ PASSED' : '❌ FAILED'}
              </h3>
              
              {result.success ? (
                <div>
                  <p><strong>Response:</strong></p>
                  <pre style={{ 
                    background: 'var(--muted-bg)', 
                    padding: '0.5rem', 
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div>
                  <p><strong>Error:</strong> {result.error}</p>
                  <p><strong>Status:</strong> {result.status}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--muted-bg)', borderRadius: '8px' }}>
          <h3>Debug Information</h3>
          <p><strong>Current URL:</strong> {window.location.href}</p>
          <p><strong>API Base URL:</strong> {import.meta.env.VITE_API_URL || 'http://localhost:4000'}</p>
          <p><strong>User Token:</strong> {localStorage.getItem('accessToken') ? 'Present' : 'Missing'}</p>
        </div>
      </div>
    </div>
  )
}