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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}
