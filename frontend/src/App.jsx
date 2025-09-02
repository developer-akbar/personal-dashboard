import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
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

function RequireAuth({ children }){
  const { user } = useAuth()
  if(!user) return <Navigate to="/" replace />
  return children
}

export default function App(){
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard/></RequireAuth>} />
        <Route path="/electricity" element={<RequireAuth><Electricity/></RequireAuth>} />
        <Route path="/account" element={<RequireAuth><Account/></RequireAuth>} />
        <Route path="/account/:id" element={<RequireAuth><AccountDetails/></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Settings/></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
