import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../store/useAuth'
import useSwipeNavigation from '../hooks/useSwipeNavigation'

export default function GlobalTabs(){
  const { pathname } = useLocation()
  const { user } = useAuth()
  const isAmazon = pathname === '/amazon'
  const isElectricity = pathname === '/electricity'
  const isAdmin = pathname === '/admin'
  const isBillOptimizer = pathname === '/bill-optimizer'
  const isAdminUser = user?.userType === 'Admin' || user?.subscription === 'Admin'
  
  // Initialize swipe navigation
  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    isSwipeActive
  } = useSwipeNavigation(['Amazon', 'Electricity', 'Bill Optimizer', 'Analytics'], isAdminUser)
  
  return (
    <div 
      className={`panel main-tabs ${isSwipeActive ? 'swipe-active' : ''}`}
      role="tablist" 
      aria-label="Sections" 
      style={{
        display:'flex',
        justifyContent:'space-between',
        gap:6,
        padding:6,
        marginBottom:8,
        position: 'relative',
        touchAction: 'pan-y', // Allow vertical scrolling but handle horizontal swipes
        userSelect: 'none' // Prevent text selection during swipe
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {/* Swipe indicator */}
      {isSwipeActive && (
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--primary-bg)',
            color: 'var(--primary-text)',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            pointerEvents: 'none'
          }}
        >
          Swipe to navigate
        </div>
      )}
      
      <Link to="/amazon" role="tab" aria-selected={isAmazon} className={`tab-link ${isAmazon? 'primary':'muted'}`} style={{flex:1, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center'}}>Amazon</Link>
      <Link to="/electricity" role="tab" aria-selected={isElectricity} className={`tab-link ${isElectricity? 'primary':'muted'}`} style={{flex:1, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center'}}>Electricity</Link>
      {isAdminUser && (
        <>
          <Link to="/bill-optimizer" role="tab" aria-selected={isBillOptimizer} className={`tab-link ${isBillOptimizer? 'primary':'muted'}`} style={{flex:1, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center'}}>Bill Optimizer</Link>
          <Link to="/admin" role="tab" aria-selected={isAdmin} className={`tab-link ${isAdmin? 'primary':'muted'}`} style={{flex:1, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', border: '2px solid var(--warning-border)', background: isAdmin? 'var(--warning-bg)' : undefined, color: isAdmin? 'var(--warning-text)' : undefined}}>Analytics</Link>
        </>
      )}
    </div>
  )
}

