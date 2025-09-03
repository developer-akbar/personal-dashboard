import React, { useEffect, useState } from 'react'

export default function AddElectricityServiceModal({ open, onClose, onSubmit, initial }){
  const [serviceNumber, setServiceNumber] = useState(initial?.serviceNumber || '')
  const [label, setLabel] = useState(initial?.label || '')
  const [submitting, setSubmitting] = useState(false)
  useEffect(()=>{
    setServiceNumber(initial?.serviceNumber || '')
    setLabel(initial?.label || '')
  }, [initial, open])
  if(!open) return null
  return (
    <div className="backdrop" style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
      <div className="panel" style={{minWidth:320, maxWidth:500, width:'100%', margin:'.5rem', borderWidth:2}}>
        <h3 style={{marginTop:0}}>{initial? 'Edit Service' : 'Add APSPDCL Service'}</h3>
        <form onSubmit={async (e)=>{ e.preventDefault(); if(submitting) return; setSubmitting(true); try{ await onSubmit(serviceNumber, label); } finally { setSubmitting(false) } }} style={{display:'flex',flexDirection:'column',gap:12, padding:'.5rem'}}>
          <label>Label (optional)
            <input value={label} onChange={e=> setLabel(e.target.value)} placeholder="e.g., Home Meter" />
          </label>
          <label>Service Number
            <input value={serviceNumber} onChange={e=> setServiceNumber(e.target.value)} placeholder="e.g., 1234567890123" required />
          </label>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button type="button" className="muted" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="primary" disabled={submitting}>{initial? 'Save' : 'Add Service'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

