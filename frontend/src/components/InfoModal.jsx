import React from 'react'

export default function InfoModal({ open, title, children, onClose, primaryActionLabel, onPrimaryAction }){
  if (!open) return null
  return (
    <div className="backdrop" style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={onClose}>
      <div className="panel" style={{minWidth:360, maxWidth: 640, position:'relative'}} onClick={(e)=> e.stopPropagation()}>
        <button aria-label="Close" onClick={onClose} className="muted" style={{position:'absolute', right:8, top:8, width:28, height:28, borderRadius:8}}>×</button>
        <h3 style={{marginTop:0}}>{title}</h3>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {children}
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:12}}>
          <button className="muted" onClick={onClose}>Close</button>
          {primaryActionLabel && (
            <button className="primary" onClick={onPrimaryAction}>{primaryActionLabel}</button>
          )}
        </div>
      </div>
    </div>
  )
}

