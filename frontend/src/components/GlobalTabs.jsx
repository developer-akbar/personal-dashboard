import React from 'react'
import { useLocation, Link } from 'react-router-dom'

export default function GlobalTabs(){
  const { pathname } = useLocation()
  const isAmazon = pathname === '/dashboard'
  const isElectricity = pathname === '/electricity'
  return (
    <div className="panel" role="tablist" aria-label="Sections" style={{display:'inline-flex',gap:6,padding:6,marginBottom:8}}>
      <Link to="/dashboard" role="tab" aria-selected={isAmazon} className={isAmazon? 'primary':'muted'} style={{textDecoration:'none',padding:'8px 12px',borderRadius:8}}>Amazon</Link>
      <Link to="/electricity" role="tab" aria-selected={isElectricity} className={isElectricity? 'primary':'muted'} style={{textDecoration:'none',padding:'8px 12px',borderRadius:8}}>Electricity</Link>
    </div>
  )
}

