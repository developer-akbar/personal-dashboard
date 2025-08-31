import React from 'react'

export default function RewardsList({ items=[], loading, error, onRefresh }){
  if (loading) return <div className="panel" style={{opacity:.9}}>Loading rewards…</div>
  if (error) return <div className="panel" style={{color:'var(--danger-text,#ef4444)'}}>{error}</div>
  if (!items.length) return (
    <div className="panel" style={{opacity:.8, display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
      <div>No rewards found right now.</div>
      {onRefresh && <button className="muted" onClick={onRefresh}>Refresh</button>}
    </div>
  )
  return (
    <div className="grid" style={{gridTemplateColumns:'repeat(2,minmax(0,1fr))'}}>
      {items.map((r,idx)=> (
        <article key={idx} className="panel" style={{display:'flex',flexDirection:'column',gap:8}}>
          <strong style={{fontSize:14}}>{r.title}</strong>
          {r.description && <div style={{opacity:.9, fontSize:12}}>{r.description}</div>}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:4}}>
            <small style={{opacity:.7}}>{r.sourceUrl?.replace(/^https?:\/\//,'')}</small>
            {r.href && <a className="primary" href={r.href} target="_blank" rel="noreferrer" style={{textDecoration:'none', padding:'6px 10px', borderRadius:8}}>View</a>}
          </div>
        </article>
      ))}
    </div>
  )
}

