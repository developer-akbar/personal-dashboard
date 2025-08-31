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
  const sections = groupBy(items, r=> r.category || 'Other')
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {Object.entries(sections).map(([cat, list])=> (
        <section key={cat}>
          <div className="pill" style={{display:'inline-block', marginBottom:8}}>{cat}</div>
          <div className="grid" style={{gridTemplateColumns:'repeat(2,minmax(0,1fr))'}}>
            {list.map((r,idx)=> (
              <article key={idx} className="panel" style={{display:'flex',flexDirection:'column',gap:8}}>
                <strong style={{fontSize:14}}>{r.title}</strong>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:12}}>
                  {r.paymentMethod && <div><span style={{opacity:.7}}>Using</span> <b>{r.paymentMethod}</b></div>}
                  {r.onWhat && <div><span style={{opacity:.7}}>On</span> <b>{r.onWhat}</b></div>}
                  {(r.minAmount||r.minCurrency) && <div><span style={{opacity:.7}}>Min amount</span> <b>{r.minCurrency==='INR'?'₹':(r.minCurrency||'')} {Number(r.minAmount||0).toLocaleString('en-IN')}</b></div>}
                  {(r.cashbackText || r.cashbackAmount || r.cashbackPercent) && (
                    <div><span style={{opacity:.7}}>Cashback</span> <b>{r.cashbackText || (r.cashbackPercent? `${r.cashbackPercent}%` : r.cashbackAmount? `₹${r.cashbackAmount}` : '')}{r.cashbackMaxAmount? ` (max ₹${r.cashbackMaxAmount})` : ''}</b></div>
                  )}
                  {r.expiryText && <div><span style={{opacity:.7}}>Expiry</span> <b>{r.expiryText}</b></div>}
                </div>
                {r.description && <div style={{opacity:.9, fontSize:12}}>{r.description}</div>}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:4}}>
                  <small style={{opacity:.7}}>{r.sourceUrl?.replace(/^https?:\/\//,'')}</small>
                  {r.href && <a className="primary" href={r.href} target="_blank" rel="noreferrer" style={{textDecoration:'none', padding:'6px 10px', borderRadius:8}}>View</a>}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function groupBy(arr, keyFn){
  const out = {}
  for (const item of arr){ const k = keyFn(item); if(!out[k]) out[k]=[]; out[k].push(item) }
  return out
}

