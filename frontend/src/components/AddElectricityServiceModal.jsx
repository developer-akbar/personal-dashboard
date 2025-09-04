import React, { useEffect, useState } from 'react'
import { useElectricityValidation } from '../hooks/useFormValidation'

export default function AddElectricityServiceModal({ open, onClose, onSubmit, initial }){
  const {
    data,
    errors,
    isValidating,
    updateField,
    validateField,
    validateForm,
    resetForm
  } = useElectricityValidation({
    serviceNumber: initial?.serviceNumber || '',
    label: initial?.label || ''
  })
  
  const [submitting, setSubmitting] = useState(false)
  
  useEffect(()=>{
    resetForm({
      serviceNumber: initial?.serviceNumber || '',
      label: initial?.label || ''
    })
  }, [initial, open, resetForm])
  if(!open) return null
  return (
    <div className="backdrop" style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
      <div className="panel" style={{minWidth:320, maxWidth:500, width:'100%', margin:'.5rem', borderWidth:2}}>
        <h3 style={{marginTop:0}}>{initial? 'Edit Service' : 'Add APSPDCL Service'}</h3>
        <form onSubmit={async (e)=>{ 
          e.preventDefault()
          if(submitting || isValidating) return
          
          const validation = await validateForm()
          if (!validation.isValid) return
          
          setSubmitting(true)
          try{ 
            await onSubmit(validation.data.serviceNumber, validation.data.label) 
          } finally { 
            setSubmitting(false) 
          } 
        }} style={{display:'flex',flexDirection:'column',gap:12, padding:'.5rem'}}>
          <label>
            Label (optional)
            <input 
              value={data.label} 
              onChange={e=> updateField('label', e.target.value)}
              onBlur={e=> validateField('label', e.target.value)}
              placeholder="e.g., Home Meter" 
            />
            {errors.label && <span style={{color:'var(--danger-bg)', fontSize:'11px', marginTop:'2px', display:'block'}}>{errors.label}</span>}
          </label>
          <label>
            Service Number
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={13}
              value={data.serviceNumber}
              onChange={e=> updateField('serviceNumber', String(e.target.value||'').replace(/\D/g,''))}
              onBlur={e=> validateField('serviceNumber', e.target.value)}
              placeholder="e.g., 1234567890123"
              required
            />
            {errors.serviceNumber && <span style={{color:'var(--danger-bg)', fontSize:'11px', marginTop:'2px', display:'block'}}>{errors.serviceNumber}</span>}
          </label>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button type="button" className="muted" onClick={onClose} disabled={submitting || isValidating}>Cancel</button>
            <button type="submit" className="primary" disabled={submitting || isValidating}>
              {submitting ? 'Saving...' : (initial? 'Save' : 'Add Service')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

