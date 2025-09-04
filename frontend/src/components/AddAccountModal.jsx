import React from 'react'
import { useEffect, useState } from 'react'
import styles from './AddAccountModal.module.css'
import { useAccountValidation } from '../hooks/useFormValidation'

const REGIONS = ['amazon.in']

export default function AddAccountModal({ open, onClose, onSubmit, initial }) {
  const {
    data,
    errors,
    isValidating,
    updateField,
    validateField,
    validateForm,
    resetForm
  } = useAccountValidation({
    label: initial?.label || '',
    email: initial?.email || '',
    password: '',
    region: initial?.region || REGIONS[0]
  })
  
  const [submitting, setSubmitting] = useState(false)

  // Reset fields when opening for a different account
  useEffect(()=>{
    resetForm({
      label: initial?.label || '',
      email: initial?.email || '',
      password: '',
      region: initial?.region || REGIONS[0]
    })
  },[initial, open, resetForm])

  if(!open) return null
  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <h3>{initial? 'Edit account' : 'Add Amazon account'}</h3>
        {!initial && (
          <div className={styles.notice} style={{margin:'8px 0', padding:'8px 12px', border:'1px solid var(--pill-border)', borderRadius:8, background:'var(--pill-bg)'}}>
            <strong>Your main step:</strong> generate a one-time session (storageState) on your computer using the seed script, then upload/use it here. This avoids repeated logins.
          </div>
        )}
        <form onSubmit={async (e)=>{
          e.preventDefault()
          if(submitting || isValidating) return
          
          const validation = await validateForm()
          if (!validation.isValid) return
          
          setSubmitting(true)
          try{ 
            await onSubmit(validation.data) 
          } finally{ 
            setSubmitting(false) 
          } 
        }} className={styles.form}>
          <label>
            Label
            <input 
              value={data.label} 
              onChange={e=>updateField('label', e.target.value)}
              onBlur={e=>validateField('label', e.target.value)}
              required 
            />
            {errors.label && <span className={styles.error}>{errors.label}</span>}
          </label>
          <label>
            Email
            <input 
              value={data.email} 
              onChange={e=>updateField('email', e.target.value)}
              onBlur={e=>validateField('email', e.target.value)}
              required 
              type="email" 
            />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </label>
          <label>
            Password
            <input 
              value={data.password} 
              onChange={e=>updateField('password', e.target.value)}
              onBlur={e=>validateField('password', e.target.value)}
              type="password" 
              placeholder={initial? '(leave blank to keep unchanged)': ''} 
              required={!initial} 
            />
            {errors.password && <span className={styles.error}>{errors.password}</span>}
          </label>
          <label>
            Region
            <select 
              value={data.region} 
              onChange={e=>updateField('region', e.target.value)}
            >
              {REGIONS.map(r=> <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <div className={styles.row}>
            <button type="button" onClick={onClose} className={styles.muted} disabled={submitting || isValidating}>Cancel</button>
            <button type="submit" className={styles.primary} disabled={submitting || isValidating}>
              {submitting ? 'Saving...' : (initial? 'Save' : 'Add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

