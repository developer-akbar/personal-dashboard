import React from 'react'
import { useEffect, useState } from 'react'
import styles from './AddAccountModal.module.css'

const REGIONS = ['amazon.in']

export default function AddAccountModal({ open, onClose, onSubmit, initial }) {
  const [label,setLabel]=useState(initial?.label||'')
  const [email,setEmail]=useState(initial?.email||'')
  const [password,setPassword]=useState('')
  const [region,setRegion]=useState(initial?.region||REGIONS[0])

  // Reset fields when opening for a different account
  useEffect(()=>{
    setLabel(initial?.label||'')
    setEmail(initial?.email||'')
    setPassword('')
    setRegion(initial?.region||REGIONS[0])
  },[initial, open])

  if(!open) return null
  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <h3>{initial? 'Edit account' : 'Add Amazon account'}</h3>
        {!initial && (
          <div className={styles.notice} style={{margin:'8px 0', padding:'8px 12px', border:'1px solid var(--pill-border)', borderRadius:8, background:'var(--pill-bg)'}}>
            <strong>Heads up:</strong> fetching balances requires signing into Amazon in a controlled browser and may ask for OTP/CAPTCHA. Complete it once; a secure session is stored to avoid repeated logins. See “How to use” for steps.
          </div>
        )}
        <form onSubmit={(e)=>{e.preventDefault();onSubmit({label,email,password,region})}} className={styles.form}>
          <label>Label<input value={label} onChange={e=>setLabel(e.target.value)} required /></label>
          <label>Email<input value={email} onChange={e=>setEmail(e.target.value)} required type="email" /></label>
          <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder={initial? '(leave blank to keep unchanged)': ''} required={!initial} /></label>
          <label>Region<select value={region} onChange={e=>setRegion(e.target.value)}>{REGIONS.map(r=> <option key={r} value={r}>{r}</option>)}</select></label>
          <div className={styles.row}>
            <button type="button" onClick={onClose} className={styles.muted}>Cancel</button>
            <button type="submit" className={styles.primary}>{initial? 'Save' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

