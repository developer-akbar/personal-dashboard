import React, { useState } from 'react'

export default function GlobalDebug(){
  const [open, setOpen] = useState(localStorage.getItem('debugPanel')==='1')
  return (
    <div style={{margin:'6px 0'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <small style={{opacity:.8}}>Debug</small>
        <button className="muted" onClick={()=>{ const v = open?'0':'1'; localStorage.setItem('debugPanel', v); setOpen(!open) }}>{open? 'Hide':'Show'}</button>
      </div>
      {open && (
        <div className="panel" style={{marginTop:6}}>
          <pre style={{whiteSpace:'pre-wrap',margin:0}}>{(()=>{ try{ return JSON.stringify(JSON.parse(localStorage.getItem('lastApiMeta')||'{}'), null, 2)}catch{return ''} })()}</pre>
        </div>
      )}
    </div>
  )
}

