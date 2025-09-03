import React from 'react'
import { useLocation, Link } from 'react-router-dom'

export default function GlobalTabs(){
  const { pathname } = useLocation()
  const isAmazon = pathname === '/amazon'
  const isElectricity = pathname === '/electricity'
  return (
    <div className="panel main-tabs" role="tablist" aria-label="Sections" style={{display:'flex',justifyContent:'space-between',gap:6,padding:6,marginBottom:8}}>
      <Link to="/amazon" role="tab" aria-selected={isAmazon} className={`tab-link ${isAmazon? 'primary':'muted'}`} style={{flex:1, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center'}}>Amazon</Link>
      <Link to="/electricity" role="tab" aria-selected={isElectricity} className={`tab-link ${isElectricity? 'primary':'muted'}`} style={{flex:1, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center'}}>Electricity</Link>
    </div>
  )
}

