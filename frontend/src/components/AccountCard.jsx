import React from "react";
import styles from "./AccountCard.module.css";
import { Link } from "react-router-dom";
import { FiRefreshCcw, FiStar } from "react-icons/fi";
import { FaStar } from "react-icons/fa";

export default function AccountCard({ account, onRefresh, onEdit, onDelete, onTogglePin, selected=false, onToggleSelect, onLongPressActivate, showCheckboxes=false }) {
  // simple long-press activation for mobile
  let pressTimer;
  const onTouchStart = ()=>{
    pressTimer = setTimeout(()=>{ onLongPressActivate?.(); }, 500)
  }
  const onTouchEnd = ()=>{ if(pressTimer) clearTimeout(pressTimer) }
  const onToggleMenu = (e)=>{
    e.stopPropagation()
    const menu = e.currentTarget.nextSibling
    if (menu){
      const showing = menu.style.display==='block'
      menu.style.display = showing? 'none' : 'block'
      const onDoc = (ev)=>{ if (menu && !menu.contains(ev.target) && ev.target !== e.currentTarget){ menu.style.display='none'; document.removeEventListener('click', onDoc) } }
      if (!showing) document.addEventListener('click', onDoc)
    }
  }
  const accent = (()=>{
    const key = (account.label||account.id||account.email||'').toString()
    let h=0; for (let i=0;i<key.length;i++){ h = (h*31 + key.charCodeAt(i)) % 360 }
    return `hsl(${h} 70% 35% / 1)`
  })()
  return (
    <div className={styles.card} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ borderLeft: `4px solid ${accent}` }}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {showCheckboxes && (
            <input aria-label="Select account" className={styles.checkbox} type="checkbox" checked={!!selected} onChange={(e)=>{ e.stopPropagation(); onToggleSelect?.(account, e.target.checked) }} />
          )}
          <Link to={`/account/${account.id}`}>{account.label}</Link>
        </div>
        <div className={styles.actions} style={{display:'inline-flex',gap:8,alignItems:'center'}}>
          <button type="button" onClick={(e)=>{ e.stopPropagation(); onTogglePin?.(account) }} title={account.pinned? 'Unpin' : 'Pin'} style={{ background:'transparent', border:0, cursor:'pointer' }}>
            {account.pinned ? <FaStar color="#fbbf24" /> : <FiStar style={{ color: '#888' }}/>} 
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onRefresh(account) }} className={styles.muted} aria-label="Refresh"><FiRefreshCcw/></button>
          <div style={{position:'relative'}}>
            <div onClick={onToggleMenu} style={{cursor:'pointer', padding:'4px 8px'}}>⋮</div>
            <div className="panel" style={{position:'absolute',right:0,top:'120%',minWidth:160,zIndex:10,display:'none'}} onClick={(e)=> e.stopPropagation()}>
              <a onClick={(e)=>{ e.stopPropagation(); onEdit(account) }} style={{display:'block',padding:'8px 12px',textDecoration:'none',cursor:'pointer'}}>Edit</a>
              <a onClick={(e)=>{ e.stopPropagation(); onDelete(account) }} style={{display:'block',padding:'8px 12px',textDecoration:'none',cursor:'pointer'}}>Delete</a>
            </div>
          </div>
          {account.lastError && (
            <span title={account.lastError} style={{marginLeft:4, color:'#ef4444', fontSize:12}}>• Error</span>
          )}
        </div>
      </div>
      <div className="account-details">
        <div className={styles.email}>{account.email}</div>
        <div className={styles.balance}>
          <span>
            {account.lastCurrency === "INR" ? "₹" : account.lastCurrency}
          </span>
          <strong>
            {Number(account.lastBalance || 0).toLocaleString("en-IN")}
          </strong>
        </div>
      </div>
      {Array.isArray(account.tags) && account.tags.length>0 && (
        <div className={styles.tags} aria-label="Account tags">
          {account.tags.map((t)=> (
            <span key={t} className={styles.tag} style={{background: tagColor(t)}}>{t}</span>
          ))}
        </div>
      )}
      <div className={styles.footer}>
        <small>
          Last refreshed:{" "}
          {account.lastRefreshedAt
            ? new Date(account.lastRefreshedAt).toLocaleString()
            : "—"}
        </small>
        <div/>
      </div>
    </div>
  );
}

function tagColor(label){
  // simple hash to HSL
  let h=0; for (let i=0;i<label.length;i++){ h = (h*31 + label.charCodeAt(i)) % 360 }
  return `hsl(${h} 60% 20% / 0.6)`
}

