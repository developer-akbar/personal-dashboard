import React, { useState } from 'react'

export default function ConfirmDialog({ open, title='Are you sure?', message, onCancel, onConfirm }){
  if(!open) return null
  const [submitting, setSubmitting] = useState(false)
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000}}>
      <div style={{background:'var(--panel-bg)',border:'2px solid var(--panel-border)',borderRadius:12,padding:8,minWidth:300,margin:'.5rem'}}>
        <h3 style={{marginTop:0}}>{title}</h3>
        {message && <p style={{opacity:.85}}>{message}</p>}
        <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
          <button className="muted" onClick={onCancel} disabled={submitting}>Cancel</button>
          <button className="danger" onClick={async()=>{ if(submitting) return; setSubmitting(true); try{ await onConfirm() } finally { setSubmitting(false) } }} disabled={submitting}>{submitting? 'Deleting…' : 'Delete'}</button>
        </div>
      </div>
    </div>
  )
}

