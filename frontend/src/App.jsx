import React from 'react'
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './App.css'
import Login from './pages/Login'
import Home from './pages/Home'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Electricity from './pages/Electricity'
import AccountDetails from './pages/AccountDetails'
import Settings from './pages/Settings'
import Account from './pages/Account'
import AdminAnalytics from './pages/AdminAnalytics'
import AdminTest from './pages/AdminTest'
import { useAuth } from './store/useAuth'
import ErrorBoundary from './components/ErrorBoundary'
import ConnectionStatus from './components/ConnectionStatus'

function RequireAuth({ children }){
  const { user } = useAuth()
  const loc = useLocation()
  if(!user){
    const next = encodeURIComponent(loc.pathname + loc.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  return children
}

function RequireAdmin({ children }){
  const { user } = useAuth()
  const loc = useLocation()
  
  console.log('🔍 RequireAdmin check:', { 
    user: user ? {
      id: user.id,
      email: user.email,
      userType: user.userType,
      subscription: user.subscription
    } : null,
    pathname: loc.pathname
  })
  
  if(!user){
    console.log('❌ No user, redirecting to login')
    const next = encodeURIComponent(loc.pathname + loc.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  
  const isAdmin = user.userType === 'Admin' || user.subscription === 'Admin'
  console.log('👤 Admin check:', { 
    userType: user.userType, 
    subscription: user.subscription, 
    isAdmin 
  })
  
  if(!isAdmin){
    console.log('❌ User is not admin, redirecting to home')
    return <Navigate to="/" replace />
  }
  
  console.log('✅ Admin access granted')
  return children
}

export default function App(){
  return (
    <ErrorBoundary>
      <HashRouter>
        <ConnectionStatus />
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/register" element={<Register/>} />
          <Route path="/amazon" element={<RequireAuth><Dashboard/></RequireAuth>} />
          <Route path="/electricity" element={<RequireAuth><Electricity/></RequireAuth>} />
          <Route path="/account" element={<RequireAuth><Account/></RequireAuth>} />
          <Route path="/account/:id" element={<RequireAuth><AccountDetails/></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><Settings/></RequireAuth>} />
          <Route path="/admin" element={<RequireAdmin><AdminAnalytics/></RequireAdmin>} />
          <Route path="/admin-test" element={<RequireAuth><AdminTest/></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}
