import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../store/useAuth'

export default function GlobalTabs(){
  const { pathname } = useLocation()
  const { user } = useAuth()
  const isAmazon = pathname === '/amazon'
  const isElectricity = pathname === '/electricity'
  const isAdmin = pathname === '/admin'
  const isBillOptimizer = pathname === '/bill-optimizer'
  const isAdminUser = user?.userType === 'Admin' || user?.subscription === 'Admin'
  
  return (
    <div className="panel main-tabs" role="tablist" aria-label="Sections" style={{display:'flex',justifyContent:'space-between',gap:6,padding:6,marginBottom:8}}>
      <Link to="/amazon" role="tab" aria-selected={isAmazon} className={`tab-link ${isAmazon? 'primary':'muted'}`} style={{flex:1, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center'}}>Amazon</Link>
      <Link to="/electricity" role="tab" aria-selected={isElectricity} className={`tab-link ${isElectricity? 'primary':'muted'}`} style={{flex:1, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center'}}>Electricity</Link>
      {isAdminUser && (
        <>
          <Link to="/admin" role="tab" aria-selected={isAdmin} className={`tab-link ${isAdmin? 'primary':'muted'}`} style={{flex:1, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center'}}>Analytics</Link>
          <Link to="/bill-optimizer" role="tab" aria-selected={isBillOptimizer} className={`tab-link ${isBillOptimizer? 'primary':'muted'}`} style={{flex:1, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center'}}>Bill Optimizer</Link>
        </>
      )}
    </div>
  )
}

